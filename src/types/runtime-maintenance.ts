export type DeploymentEnvironment = 'preview' | 'production';

export interface MaintenanceDeployment {
  id: string;
  url: string;
  created: number;
  environment: DeploymentEnvironment;
}

export interface MaintenanceReport {
  configured: boolean;
  r2Configured: boolean;
  candidates: MaintenanceDeployment[];
  scanned: number;
  hasMore: boolean;
  next: number | null;
}
