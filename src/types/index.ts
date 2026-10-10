export interface Product {
  product_id: string;
  name: string;
  category: string;
  list_price: number;
  unit_cost: number;
}

export interface SaleRecord {
  sale_id: string;
  date: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  unit_cost_at_sale: number;
  channel: string;
}

export interface ExpenseRecord {
  expense_id: string;
  date: string;
  category: string;
  amount: number;
  vendor: string;
  note: string;
}

export interface MonthlyMetric {
  month: string; // "2026-01"
  rev: number;
  cogs: number;
  gp: number;
  opex: number;
  net: number;
  gm: number;
  nm: number;
  units: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  margin_pct: number;
  units: number;
}

export interface ExpenseCategoryDiff {
  category: string;
  aug: number;
  sep: number;
  change: number;
}

export interface DashboardSummary {
  business: string;
  currency: string;
  totalRevenue: number;
  totalCogs: number;
  totalGrossProfit: number;
  totalOpex: number;
  totalNetProfit: number;
  grossMarginPct: number;
  netMarginPct: number;
  totalUnits: number;
  monthlyTrends: MonthlyMetric[];
  productsPerformance: ProductPerformance[];
  expenseCategories: { category: string; amount: number; percentage: number }[];
  sepVsAugExpenses: ExpenseCategoryDiff[];
  channelBreakdown: { channel: string; revenue: number; percentage: number }[];
  dateRange: { start: string; end: string };
  recordCounts: { sales: number; expenses: number; products: number };
}

export interface AIQuestionResponse {
  question: string;
  answer: string;
  calculationSteps?: string[];
  keyDataPoints?: { label: string; value: string }[];
  isDemoMode: boolean;
  generatedAt: string;
}
