export interface SalesRecord {
  ean?: string;
  store: string;
  date: string;
  year?: number;
  grupo?: string;
  product: string;
  qty: number;
  price?: number;
  total?: number;
}

export interface ProductGroup {
  id: string;
  group_name: string;
  keywords: string[];
  priority: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMetrics {
  groupName: string;
  totalUnits: number;
  uniqueProducts: number;
  uniqueStores: number;
  percentage: number;
  color: string;
}

export interface MonthMetrics {
  month: string;
  year: number;
  totalUnits: number;
  uniqueProducts: number;
  uniqueStores: number;
  byGroup: { groupName: string; units: number }[];
}

export interface StoreMetrics {
  storeName: string;
  totalUnits: number;
  uniqueProducts: number;
  byGroup: { groupName: string; units: number }[];
  byMonth: { month: string; units: number }[];
}

export interface SalesMetrics {
  totalUnits: number;
  uniqueStores: number;
  uniqueProducts: number;
  uniqueGroups: number;
  averageUnitsPerDay: number;
  topStores: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
  topGroups: { name: string; value: number }[];
  timeline: { date: string; value: number }[];
  dateRange: { start: string; end: string };
  byGroup: GroupMetrics[];
  byMonth: MonthMetrics[];
  byStore: StoreMetrics[];
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

export interface ChatConversation {
  id: string;
  title: string;
  saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  chart_data: any;
  metadata: any;
  created_at: string;
}

export enum ReportType {
  SALES_BY_STORE = 'sales_by_store',
  MONTHLY_RANKING = 'monthly_ranking',
  DETAILED_BY_PRODUCT = 'detailed_by_product'
}

export interface ReportFilters {
  year: number | null;
  month: number | null;
  store: string | null;
  line: string | null;
}

export interface StoreReportData {
  storeName: string;
  lines: { [lineName: string]: number };
  total: number;
}

export interface MonthlyRankingData {
  storeName: string;
  monthlyData: { [month: string]: number };
  totalYear: number;
  rankings: { [month: string]: number };
  accumulatedRanking: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DetailedProductData {
  storeName: string;
  products: {
    productName: string;
    monthlyData: { [month: string]: number };
    total: number;
  }[];
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  REPORT = 'report',
  AI_REPORT = 'ai_report',
  CHAT_AI = 'chat_ai',
  REPORTS_HISTORY = 'reports_history',
  UPLOAD = 'upload',
  DATA = 'data'
}
