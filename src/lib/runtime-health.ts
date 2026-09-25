import { prisma } from '@/lib/database';
import { getRecentCronRuns } from '@/lib/cron-runs';

/**
 * Salud del sistema para /admin/runtime: los crons y las dependencias de las
 * que depende que las herramientas funcionen (base, hosting, CDN, GitHub
 * Actions). Todo sale de fuentes publicas o de la propia base: sin tokens.
 */

// Mismo horario que vercel.json ("0 5 * * *"): el cron diario, 05:00 UTC.
const DAILY_CRON_HOUR_UTC = 5;

function nextDailyRun(hourUtc: number, now = new Date()): string {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc)
  );
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString();
}

export type StatusIndicator =
  | 'none'
  | 'minor'
  | 'major'
  | 'critical'
  | 'unknown';

const INDICATORS: readonly StatusIndicator[] = [
  'none',
  'minor',
  'major',
  'critical',
];

// Paginas de estado oficiales. Las tres usan Statuspage, que publica
// /api/v2/status.json sin autenticacion.
const STATUS_PAGES = [
  { name: 'Supabase', url: 'https://status.supabase.com' },
  { name: 'Vercel', url: 'https://www.vercel-status.com' },
  { name: 'Cloudflare', url: 'https://www.cloudflarestatus.com' },
] as const;

async function checkStatusPage(page: (typeof STATUS_PAGES)[number]) {
  try {
    const res = await fetch(`${page.url}/api/v2/status.json`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      status?: { indicator?: string; description?: string };
    };
    const raw = json.status?.indicator;
    const indicator = INDICATORS.find((i) => i === raw) ?? 'unknown';
    return {
      name: page.name,
      url: page.url,
      indicator,
      description: json.status?.description ?? '',
    };
  } catch {
    return {
      name: page.name,
      url: page.url,
      indicator: 'unknown' as const,
      description: '',
    };
  }
}

async function checkDatabase() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

// El repo es publico: la API de GitHub devuelve las corridas sin token.
// Sin token hay 60 pedidos por hora por IP; con la cache de 5 minutos alcanza,
// y si igual falla, el panel lo muestra como "sin datos".
const GITHUB_REPO = 'juanjparedez/mundobl';
const GITHUB_WORKFLOWS = [
  { key: 'backup', file: 'backup.yml' },
  { key: 'smoke', file: 'smoke.yml' },
] as const;

async function checkWorkflow(workflow: (typeof GITHUB_WORKFLOWS)[number]) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflow.file}/runs?per_page=1`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      workflow_runs?: Array<{
        status: string | null;
        conclusion: string | null;
        created_at: string;
        html_url: string;
      }>;
    };
    const run = json.workflow_runs?.[0];
    return {
      key: workflow.key,
      status: run?.status ?? null,
      conclusion: run?.conclusion ?? null,
      at: run?.created_at ?? null,
      url: run?.html_url ?? null,
    };
  } catch {
    return {
      key: workflow.key,
      status: null,
      conclusion: null,
      at: null,
      url: null,
    };
  }
}

function getDeployment() {
  return {
    env: process.env.VERCEL_ENV ?? 'local',
    region: process.env.VERCEL_REGION ?? null,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    commitMessage:
      process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
  };
}

// Solo si estan configuradas; nunca se expone un valor.
function getIntegrations() {
  const has = (...keys: string[]) => keys.every((k) => Boolean(process.env[k]));
  return [
    { key: 'cron', configured: has('CRON_SECRET') },
    { key: 'youtube', configured: has('YOUTUBE_API_KEY') },
    { key: 'gemini', configured: has('GEMINI_API_KEY') },
    { key: 'email', configured: has('RESEND_API_KEY') },
    {
      key: 'push',
      configured: has('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'),
    },
    {
      key: 'storage',
      configured: has(
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET'
      ),
    },
  ] as const;
}

export async function getRuntimeHealth() {
  const [database, statusPages, workflows, runs] = await Promise.all([
    checkDatabase(),
    Promise.all(STATUS_PAGES.map(checkStatusPage)),
    Promise.all(GITHUB_WORKFLOWS.map(checkWorkflow)),
    getRecentCronRuns(10),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    cron: {
      nextRunAt: nextDailyRun(DAILY_CRON_HOUR_UTC),
      runs,
    },
    workflows,
    database,
    statusPages,
    deployment: getDeployment(),
    integrations: getIntegrations(),
  };
}

export type RuntimeHealth = Awaited<ReturnType<typeof getRuntimeHealth>>;
