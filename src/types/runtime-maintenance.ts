export interface MaintenanceDeployment {
  id: string;
  url: string;
  created: number;
}

export interface MaintenanceReport {
  configured: boolean;
  r2Configured: boolean;
  candidates: MaintenanceDeployment[];
  scanned: number;
  hasMore: boolean;
  next: number | null;
}
