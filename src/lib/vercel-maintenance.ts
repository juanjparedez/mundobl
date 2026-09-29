import type { MaintenanceDeployment } from '@/types/runtime-maintenance';

const DAY = 86_400_000;
// Solo main despliega (vercel.json), así que no hay previews que revisar.
const RETENTION_DAYS = 90;
type JsonObject = Record<string, unknown>;

export class MaintenanceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 502
  ) {
    super(code);
  }
}

function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new MaintenanceError('invalid_provider_response');
  return value as JsonObject;
}

function config() {
  const token = process.env.MAINTENANCE_VERCEL_TOKEN;
  const project = process.env.MAINTENANCE_VERCEL_PROJECT_ID;
  const team = process.env.MAINTENANCE_VERCEL_TEAM_ID;
  if (!token || !project || !team)
    throw new MaintenanceError('not_configured', 503);
  return { token, project, team };
}

export function isVercelMaintenanceConfigured(): boolean {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

async function api(
  path: string,
  query: Record<string, string> = {},
  method = 'GET'
) {
  const { token, team } = config();
  const url = new URL(path, 'https://api.vercel.com');
  url.search = new URLSearchParams({ ...query, teamId: team }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new MaintenanceError('provider_unavailable');
  }
  if (!response.ok) throw new MaintenanceError('provider_rejected');
  if (method === 'DELETE') return {};
  return object(await response.json());
}

function deployments(value: JsonObject): JsonObject[] {
  if (!Array.isArray(value.deployments))
    throw new MaintenanceError('invalid_provider_response');
  return value.deployments.map(object);
}

function id(row: JsonObject): string {
  const value = row.uid ?? row.id;
  if (typeof value !== 'string' || !/^dpl_[a-zA-Z0-9]+$/.test(value))
    throw new MaintenanceError('invalid_provider_response');
  return value;
}

function isProduction(row: JsonObject): boolean {
  return !row.customEnvironment && row.target === 'production';
}

async function protectedIds(): Promise<Set<string>> {
  const { project } = config();
  const [projectData, stable, recent] = await Promise.all([
    api(`/v9/projects/${encodeURIComponent(project)}`),
    api('/v7/deployments', {
      projectId: project,
      target: 'production',
      state: 'READY',
      limit: '3',
    }),
    api('/v7/deployments', { projectId: project, limit: '3' }),
  ]);
  if (projectData.id !== project) throw new MaintenanceError('wrong_project');
  const targets = object(projectData.targets);
  const production = object(targets.production);
  const protectedSet = new Set(
    [...deployments(stable), ...deployments(recent)].map(id)
  );
  protectedSet.add(id(production));
  if (process.env.VERCEL_DEPLOYMENT_ID)
    protectedSet.add(process.env.VERCEL_DEPLOYMENT_ID);
  return protectedSet;
}

function candidate(
  row: JsonObject,
  protectedSet: Set<string>,
  now: number
): MaintenanceDeployment | null {
  const deploymentId = id(row);
  const created = row.createdAt ?? row.created;
  const state = row.readyState ?? row.state;
  if (
    !isProduction(row) ||
    protectedSet.has(deploymentId) ||
    !['READY', 'ERROR', 'CANCELED'].includes(String(state)) ||
    typeof created !== 'number' ||
    !Number.isFinite(created) ||
    created <= 0 ||
    created >= now - RETENTION_DAYS * DAY ||
    typeof row.url !== 'string' ||
    !/^[a-zA-Z0-9-]+\.vercel\.app$/.test(row.url)
  )
    return null;
  return { id: deploymentId, url: row.url, created };
}

async function hasAliases(deploymentId: string): Promise<boolean> {
  const data = await api(`/v2/deployments/${deploymentId}/aliases`);
  if (!Array.isArray(data.aliases))
    throw new MaintenanceError('invalid_provider_response');
  return data.aliases.length > 0;
}

export async function inspectDeployments(until?: number) {
  const { project } = config();
  const [protectedSet, page] = await Promise.all([
    protectedIds(),
    api('/v7/deployments', {
      projectId: project,
      target: 'production',
      limit: '10',
      ...(until ? { until: String(until) } : {}),
    }),
  ]);
  const rows = deployments(page);
  const candidates: MaintenanceDeployment[] = [];
  // Small pages bound provider traffic; fail closed if any protection lookup fails.
  for (const row of rows) {
    const item = candidate(row, protectedSet, Date.now());
    if (item && !(await hasAliases(item.id))) candidates.push(item);
  }
  const pagination = object(page.pagination);
  const next = pagination.next;
  if (
    next !== null &&
    (typeof next !== 'number' || !Number.isFinite(next) || next <= 0)
  )
    throw new MaintenanceError('invalid_provider_response');
  return { candidates, scanned: rows.length, next, hasMore: next !== null };
}

export async function deleteOldDeployment(deploymentId: string): Promise<void> {
  if (!/^dpl_[a-zA-Z0-9]+$/.test(deploymentId))
    throw new MaintenanceError('invalid_id', 400);
  const { project } = config();
  const row = await api(`/v13/deployments/${deploymentId}`);
  if (row.projectId !== project || id(row) !== deploymentId)
    throw new MaintenanceError('wrong_project', 409);
  // Re-read protections immediately before deletion; never trust the browser's report.
  const protectedSet = await protectedIds();
  if (
    !candidate(row, protectedSet, Date.now()) ||
    (await hasAliases(deploymentId))
  )
    throw new MaintenanceError('protected_deployment', 409);
  await api(`/v13/deployments/${deploymentId}`, {}, 'DELETE');
}
