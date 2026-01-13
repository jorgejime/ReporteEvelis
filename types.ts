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

export enum AppTab {
  DASHBOARD = 'dashboard',
  UPLOAD = 'upload',
  DATA = 'data',
  AI_REPORT = 'ai_report'
}
