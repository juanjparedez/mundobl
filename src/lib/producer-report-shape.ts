/** Forma del informe para productoras: compartida por server y cliente. */
export const PRODUCER_REPORT_WINDOWS = [30, 90] as const;
export type ProducerReportWindow = (typeof PRODUCER_REPORT_WINDOWS)[number];

export interface ActivityTotals {
  views: number;
  chapters: number;
  wants: number;
  finishes: number;
  openVer?: number;
  playStarts?: number;
  outboundClicks?: number;
  likes?: number;
}

export interface ProducerReport {
  days: ProducerReportWindow;
  from: string;
  to: string;
  accounts: number;
  activeAccounts: number;
  /** Capitulos por origen: con cuenta o sin cuenta (navegador). */
  chaptersBySource: { account: number; browser: number };
  totals: ActivityTotals;
  /** Embudo del aviso de estreno: boton mostrado, tocado y aviso activado. */
  alerts: { offers: number; clicks: number; activated: number };
  series: Array<
    ActivityTotals & {
      seriesId: number;
      title: string;
      channel: string | null;
      trackers: number;
    }
  >;
  channels: Array<ActivityTotals & { channel: string; series: number }>;
  countries: Array<{ country: string; chapters: number }>;
  outbound: Array<{ platform: string; clicks: number }>;
  trafficBySection?: Array<{ section: string; views: number }>;
}

export function isProducerReportWindow(
  value: number
): value is ProducerReportWindow {
  return PRODUCER_REPORT_WINDOWS.some((days) => days === value);
}
