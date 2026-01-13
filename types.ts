export interface SalesRecord {
  ean: string;
  store: string;
  date: string;
  product: string;
  qty: number;
  price: number;
  total: number;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalUnits: number;
  uniqueStores: number;
  uniqueProducts: number;
  averageOrderValue: number;
  topStores: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
  timeline: { date: string; value: number }[];
  dateRange: { start: string; end: string };
}

export interface AIReport {
  id: string;
  title: string;
  content: string;
  metrics_summary: any;
  created_at: string;
  date_range_start: string | null;
  date_range_end: string | null;
}

export interface UploadedFile {
  id: string;
  filename: string;
  records_count: number;
  file_hash: string;
  uploaded_at: string;
  file_size: number;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  UPLOAD = 'upload',
  DATA = 'data',
  AI_REPORT = 'ai_report',
  REPORTS_HISTORY = 'reports_history'
}
