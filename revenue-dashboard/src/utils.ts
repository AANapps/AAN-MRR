import { Transaction, DashboardMetrics, ChartDataPoint, DateRange } from './types';
import { convertUSDToCurrency } from './data';

export const SIMULATED_NOW = new Date('2026-07-10T23:59:59Z');

export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7days', label: 'Last 7 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: '3months', label: 'Last 3 months' },
  { id: '12months', label: 'Last 12 months' },
  { id: 'ytd', label: 'Year to date (YTD)' },
  { id: 'all', label: 'All time' },
];

export function getPresetRange(presetId: string): { start: Date; end: Date } {
  const end = new Date(SIMULATED_NOW);
  const start = new Date(SIMULATED_NOW);

  switch (presetId) {
    case 'today':
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setUTCDate(start.getUTCDate() - 1);
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCDate(end.getUTCDate() - 1);
      end.setUTCHours(23, 59, 59, 999);
      break;
    case '7days':
      start.setUTCDate(start.getUTCDate() - 6);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case '30days':
      start.setUTCDate(start.getUTCDate() - 29);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case '3months':
      start.setUTCMonth(start.getUTCMonth() - 3);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case '12months':
      start.setUTCMonth(start.getUTCMonth() - 12);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'ytd':
      start.setUTCMonth(0, 1);
      start.setUTCHours(0, 0, 0, 0);
      break;
    case 'all':
    default:
      // Starting from our seed begin date: 2024-07-10
      return {
        start: new Date('2024-07-10T00:00:00Z'),
        end: new Date('2026-07-10T23:59:59Z'),
      };
  }

  return { start, end };
}

/**
 * Gets the date range of the comparison period (e.g., if current is "last 30 days", previous is the 30 days before that).
 */
export function getPreviousPeriodRange(start: Date, end: Date, presetId: string): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  
  if (presetId === 'today') {
    // Compare today with yesterday
    const prevStart = new Date(start);
    prevStart.setUTCDate(prevStart.getUTCDate() - 1);
    const prevEnd = new Date(end);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    return { start: prevStart, end: prevEnd };
  }
  
  if (presetId === 'yesterday') {
    // Compare yesterday with the day before yesterday
    const prevStart = new Date(start);
    prevStart.setUTCDate(prevStart.getUTCDate() - 1);
    const prevEnd = new Date(end);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    return { start: prevStart, end: prevEnd };
  }

  if (presetId === 'ytd') {
    // Compare YTD 2026 with full year 2025 or the same timeframe in 2025
    const prevStart = new Date(start);
    prevStart.setUTCFullYear(prevStart.getUTCFullYear() - 1);
    const prevEnd = new Date(end);
    prevEnd.setUTCFullYear(prevEnd.getUTCFullYear() - 1);
    return { start: prevStart, end: prevEnd };
  }

  // General shift back by the exact duration of the current filter
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return { start: prevStart, end: prevEnd };
}

/**
 * Calculates Stripe-like metrics for a list of transactions in a given target currency
 */
export function calculateMetrics(
  transactions: Transaction[],
  targetCurrencyCode: string
): Omit<DashboardMetrics, 'growthRate'> {
  let grossRevenueUSD = 0;
  let netRevenueUSD = 0;
  let feesPaidUSD = 0;
  let refundedVolumeUSD = 0;
  
  let successfulPayments = 0;
  let failedPayments = 0;
  let refundsCount = 0;
  
  const customerEmails = new Set<string>();

  transactions.forEach(t => {
    const isSucceeded = t.status === 'succeeded';
    const isRefunded = t.status === 'refunded';
    const isFailed = t.status === 'failed';
    const isProcessing = t.status === 'processing';

    if (isSucceeded || isRefunded) {
      grossRevenueUSD += t.amount;
      feesPaidUSD += t.fee;
      
      if (isSucceeded) {
        successfulPayments++;
        netRevenueUSD += (t.amount - t.fee);
      } else if (isRefunded) {
        refundsCount++;
        refundedVolumeUSD += t.amount;
        // In Stripe, when a charge is refunded, the original transaction is fully or partially returned,
        // and fees are usually not returned. For simplicity, net is gross - refund - fee.
        netRevenueUSD += 0; // Net is zero for refunded item
      }

      if (t.customerEmail) {
        customerEmails.add(t.customerEmail);
      }
    } else if (isFailed) {
      failedPayments++;
    }
  });

  const grossRevenue = convertUSDToCurrency(grossRevenueUSD, targetCurrencyCode);
  const netRevenue = convertUSDToCurrency(netRevenueUSD, targetCurrencyCode);
  const feesPaid = convertUSDToCurrency(feesPaidUSD, targetCurrencyCode);
  const refundedVolume = convertUSDToCurrency(refundedVolumeUSD, targetCurrencyCode);
  
  const averageOrderValue = successfulPayments > 0 ? (grossRevenue / successfulPayments) : 0;
  
  return {
    grossRevenue,
    netRevenue,
    successfulPayments,
    failedPayments,
    refundsCount,
    refundedVolume,
    feesPaid,
    averageOrderValue,
    activeCustomers: customerEmails.size,
  };
}

/**
 * Aggregates transactions into intervals for recharts to display
 */
export function aggregateChartData(
  transactions: Transaction[],
  start: Date,
  end: Date,
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly',
  targetCurrencyCode: string
): ChartDataPoint[] {
  const dataMap = new Map<string, { grossUSD: number; netUSD: number; count: number; timestamp: string }>();

  // Determine key formatting based on interval
  const getGroupKeyAndLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    
    if (interval === 'hourly') {
      const hr = d.getUTCHours();
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const formattedHr = hr % 12 === 0 ? 12 : hr % 12;
      const label = `${formattedHr} ${ampm}`;
      // Group key includes day and hour to distinguish
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()} ${hr}:00`;
      return { key, label };
    }
    
    if (interval === 'daily') {
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`;
      return { key, label };
    }
    
    if (interval === 'weekly') {
      // Get ISO week number or start of week date
      const firstDayOfWeek = new Date(d);
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      firstDayOfWeek.setUTCDate(diff);
      
      const label = `Wk of ${firstDayOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
      const key = `${firstDayOfWeek.getUTCFullYear()}-${(firstDayOfWeek.getUTCMonth() + 1).toString().padStart(2, '0')}-${firstDayOfWeek.getUTCDate().toString().padStart(2, '0')}`;
      return { key, label };
    }
    
    // monthly
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    return { key, label };
  };

  // Pre-populate intervals with 0 to avoid empty gaps in graphs, giving a smooth line!
  const durationMs = end.getTime() - start.getTime();
  const stepMs = 
    interval === 'hourly' ? 60 * 60 * 1000 :
    interval === 'daily' ? 24 * 60 * 60 * 1000 :
    interval === 'weekly' ? 7 * 24 * 60 * 60 * 1000 :
    30 * 24 * 60 * 60 * 1000; // rough month step

  let stepDate = new Date(start);
  while (stepDate <= end) {
    const { key, label } = getGroupKeyAndLabel(stepDate.toISOString());
    if (!dataMap.has(key)) {
      dataMap.set(key, { grossUSD: 0, netUSD: 0, count: 0, timestamp: stepDate.toISOString() });
    }
    
    // Advance step date
    if (interval === 'hourly') {
      stepDate.setUTCHours(stepDate.getUTCHours() + 1);
    } else if (interval === 'daily') {
      stepDate.setUTCDate(stepDate.getUTCDate() + 1);
    } else if (interval === 'weekly') {
      stepDate.setUTCDate(stepDate.getUTCDate() + 7);
    } else {
      stepDate.setUTCMonth(stepDate.getUTCMonth() + 1);
    }
  }

  // Populate actual transactions
  transactions.forEach(t => {
    if (t.status !== 'succeeded' && t.status !== 'refunded') return;
    
    const tDate = new Date(t.date);
    if (tDate < start || tDate > end) return;

    const { key } = getGroupKeyAndLabel(t.date);
    const existing = dataMap.get(key);
    
    const netValue = t.status === 'succeeded' ? (t.amount - t.fee) : 0;
    const grossValue = t.amount;

    if (existing) {
      existing.grossUSD += grossValue;
      existing.netUSD += netValue;
      existing.count += t.status === 'succeeded' ? 1 : 0;
    } else {
      // Just in case it wasn't pre-populated
      dataMap.set(key, {
        grossUSD: grossValue,
        netUSD: netValue,
        count: t.status === 'succeeded' ? 1 : 0,
        timestamp: t.date
      });
    }
  });

  // Convert map to array sorted chronologically
  return Array.from(dataMap.entries())
    .map(([key, value]) => {
      const { label } = getGroupKeyAndLabel(value.timestamp);
      return {
        label,
        timestamp: value.timestamp,
        gross: convertUSDToCurrency(value.grossUSD, targetCurrencyCode),
        net: convertUSDToCurrency(value.netUSD, targetCurrencyCode),
        count: value.count,
      };
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
