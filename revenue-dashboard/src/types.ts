export type TransactionStatus = 'succeeded' | 'refunded' | 'failed' | 'processing';

export interface Transaction {
  id: string;
  amount: number; // in USD
  currency: string; // original currency (e.g., 'USD', 'EUR', 'GBP')
  status: TransactionStatus;
  customerName: string;
  customerEmail: string;
  description: string;
  date: string; // ISO string
  fee: number; // in USD
  paymentMethod: 'card' | 'bank_transfer' | 'apple_pay' | 'google_pay';
}

export interface DashboardMetrics {
  grossRevenue: number;
  netRevenue: number;
  successfulPayments: number;
  failedPayments: number;
  refundsCount: number;
  refundedVolume: number;
  feesPaid: number;
  averageOrderValue: number;
  activeCustomers: number;
  growthRate: number; // compared to previous period
}

export type TimeInterval = 'hourly' | 'daily' | 'weekly' | 'monthly';

export interface DateRange {
  start: Date;
  end: Date;
  preset: string;
}

export interface Currency {
  code: string;
  symbol: string;
  rate: number; // exchange rate relative to USD (1 USD = rate Currency)
  label: string;
}

export interface ChartDataPoint {
  label: string;
  timestamp: string;
  gross: number;
  net: number;
  count: number;
}
