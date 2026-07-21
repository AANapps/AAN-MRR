import { Currency, Transaction } from './types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', rate: 1.0, label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', rate: 0.92, label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', rate: 0.78, label: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', rate: 158.0, label: 'Japanese Yen (JPY)' },
  { code: 'CAD', symbol: 'C$', rate: 1.36, label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', rate: 1.50, label: 'Australian Dollar (AUD)' },
  { code: 'INR', symbol: '₹', rate: 83.4, label: 'Indian Rupee (INR)' },
];

// Seeded PRNG to ensure deterministic data across refreshes
function createRandom(seed: number) {
  const m = 0x80000000; // 2**31
  const a = 1103515245;
  const c = 12345;
  let state = seed;
  return function() {
    state = (a * state + c) % m;
    return state / (m - 1);
  };
}

const CUSTOMERS = [
  { name: 'Sarah Jenkins', email: 'sarah.j@example.com' },
  { name: 'Liam Carter', email: 'l.carter@techflow.io' },
  { name: 'Emma Watson', email: 'emma@designstudio.co' },
  { name: 'Noah Miller', email: 'noah.miller@enterprise.com' },
  { name: 'Olivia Davis', email: 'olivia@cloudscale.net' },
  { name: 'William Smith', email: 'wsmith@codelabs.dev' },
  { name: 'Sophia Jones', email: 'sophia@retailhub.com' },
  { name: 'James Wilson', email: 'j.wilson@saasventures.com' },
  { name: 'Isabella Taylor', email: 'isabella@taylorconsulting.com' },
  { name: 'Alexander Brown', email: 'alex@databeat.org' },
  { name: 'Mia Martinez', email: 'mia.m@cybersec.io' },
  { name: 'Benjamin Thomas', email: 'ben.t@logisticspro.com' },
  { name: 'Charlotte Garcia', email: 'charlotte@g-marketing.co' },
  { name: 'Lucas Robinson', email: 'lucas.r@creativeagency.net' },
  { name: 'Amelia Clark', email: 'amelia.clark@fintechcorp.com' },
  { name: 'Henry Rodriguez', email: 'henry@aerotech.io' },
];

const PRODUCTS = [
  { desc: 'SaaS Pro Subscription - Enterprise Plan', basePrice: 499, cat: 'SaaS Plan' },
  { desc: 'SaaS Pro Subscription - Standard Monthly', basePrice: 79, cat: 'SaaS Plan' },
  { desc: 'SaaS Pro Subscription - Growth Annual', basePrice: 999, cat: 'SaaS Plan' },
  { desc: 'API Usage Pack - Overages Tier 2', basePrice: 149, cat: 'API Overages' },
  { desc: 'Premium Support SLA - Custom Integration', basePrice: 300, cat: 'Support' },
  { desc: 'Consulting Session - Cloud Architecture', basePrice: 250, cat: 'Consulting' },
  { desc: 'Developer Seat License add-on', basePrice: 29, cat: 'SaaS Seat' },
];

const PAYMENT_METHODS: Array<'card' | 'bank_transfer' | 'apple_pay' | 'google_pay'> = [
  'card',
  'card',
  'card', // higher weight for card
  'apple_pay',
  'google_pay',
  'bank_transfer'
];

/**
 * Generates mock transactions from 2 years ago up to 2026-07-10 (the current simulated time)
 * Scaled precisely so that the gross revenue is exactly 33,435.54 USD per month,
 * with an average succeeded/refunded transaction size of exactly $37.5258 (approx 891 payments/month).
 * Supports custom simulation targets via config.
 */
export function generateMockTransactions(config?: {
  customRevenue?: number;
  customDays?: number;
  customCount?: number;
}): Transaction[] {
  const transactions: Transaction[] = [];
  const rand = createRandom(101); // Seeded random for determinism
  
  // Simulated timeline: From 2024-07-10 to 2026-07-10
  const limitStart = new Date('2024-07-10T00:00:00Z');
  const limitEnd = new Date('2026-07-10T23:59:59Z');
  
  let TARGET_MONTHLY_REVENUE = 33435.54;
  let TARGET_MONTHLY_COUNT = 891; // 33,435.54 / 891 = $37.5258 average payment (fits 37.50-37.57 range perfectly!)
  
  if (config && config.customRevenue !== undefined && config.customDays !== undefined && config.customDays > 0) {
    const dailyRevenue = config.customRevenue / config.customDays;
    TARGET_MONTHLY_REVENUE = dailyRevenue * 30.4375; // average days in a month for smooth distribution
    if (config.customCount !== undefined && config.customCount > 0) {
      const dailyCount = config.customCount / config.customDays;
      TARGET_MONTHLY_COUNT = Math.max(1, Math.round(dailyCount * 30.4375));
    } else {
      // Keep average payment size centered on $37.5258
      TARGET_MONTHLY_COUNT = Math.max(1, Math.round(TARGET_MONTHLY_REVENUE / 37.5258));
    }
  }
  
  // List of calendar months to generate
  const months: { year: number; month: number }[] = [];
  for (let y = 2024; y <= 2026; y++) {
    const startM = y === 2024 ? 7 : 1;
    const endM = y === 2026 ? 7 : 12;
    for (let m = startM; m <= endM; m++) {
      months.push({ year: y, month: m });
    }
  }

  let currentId = 10000;

  months.forEach(({ year, month }) => {
    // Determine start and end of this calendar month
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    
    const actualStart = monthStart < limitStart ? limitStart : monthStart;
    const actualEnd = monthEnd > limitEnd ? limitEnd : monthEnd;
    
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const activeDays = Math.max(1, Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const daysFraction = Math.min(1.0, activeDays / totalDaysInMonth);

    // Proportionate target calculations
    const targetRevenue = Math.round(TARGET_MONTHLY_REVENUE * daysFraction * 100) / 100;
    const targetCount = Math.round(TARGET_MONTHLY_COUNT * daysFraction);

    if (targetCount <= 0) return;

    const monthTxs: Transaction[] = [];
    let rawAmountSum = 0;

    // Generate normal-like transaction amounts around $37.50
    for (let i = 0; i < targetCount; i++) {
      const customerIdx = Math.floor(rand() * CUSTOMERS.length);
      const customer = CUSTOMERS[customerIdx];
      
      const productIdx = Math.floor(rand() * PRODUCTS.length);
      const product = PRODUCTS[productIdx];

      const currencyIndex = Math.floor(rand() * CURRENCIES.length);
      const nativeCurrency = CURRENCIES[currencyIndex];

      const method = PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)];

      // 4% refunded, 96% succeeded
      const status: Transaction['status'] = rand() < 0.04 ? 'refunded' : 'succeeded';

      // Generate random variance around the $37.50 target base
      const baseAmountUSD = 25.0 + rand() * 25.0; // Mean is exactly 37.50
      rawAmountSum += baseAmountUSD;

      currentId++;
      monthTxs.push({
        id: `ch_${currentId.toString(36).toUpperCase()}`,
        amount: baseAmountUSD,
        currency: nativeCurrency.code,
        status,
        customerName: customer.name,
        customerEmail: customer.email,
        description: product.desc,
        date: '', // populated below
        fee: 0,
        paymentMethod: method
      });
    }

    // Adjust/scale transaction values to match the target gross revenue perfectly
    let runningSum = 0;
    const scaleFactor = targetRevenue / rawAmountSum;

    monthTxs.forEach((tx, idx) => {
      if (idx === monthTxs.length - 1) {
        tx.amount = Math.round((targetRevenue - runningSum) * 100) / 100;
      } else {
        const scaledAmt = Math.round(tx.amount * scaleFactor * 100) / 100;
        tx.amount = Math.max(1.0, scaledAmt);
        runningSum += tx.amount;
      }
      tx.fee = Math.round((tx.amount * 0.029 + 0.3) * 100) / 100;
    });

    // Generate natural failed transactions (~4% failure rate)
    const failedCount = Math.round(targetCount * 0.04);
    for (let i = 0; i < failedCount; i++) {
      const customerIdx = Math.floor(rand() * CUSTOMERS.length);
      const customer = CUSTOMERS[customerIdx];
      const productIdx = Math.floor(rand() * PRODUCTS.length);
      const product = PRODUCTS[productIdx];
      const currencyIndex = Math.floor(rand() * CURRENCIES.length);
      const nativeCurrency = CURRENCIES[currencyIndex];
      const method = PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)];

      currentId++;
      monthTxs.push({
        id: `ch_${currentId.toString(36).toUpperCase()}`,
        amount: Math.round((25.0 + rand() * 25.0) * 100) / 100,
        currency: nativeCurrency.code,
        status: 'failed',
        customerName: customer.name,
        customerEmail: customer.email,
        description: product.desc,
        date: '',
        fee: 0,
        paymentMethod: method
      });
    }

    // Distribute timestamps uniformly across this month's active timeline
    const startTimeMs = actualStart.getTime();
    const endTimeMs = actualEnd.getTime();
    const durationMs = endTimeMs - startTimeMs;

    monthTxs.forEach(tx => {
      const randomTimeMs = startTimeMs + Math.floor(rand() * durationMs);
      tx.date = new Date(randomTimeMs).toISOString();
    });

    transactions.push(...monthTxs);
  });

  // --- PRECISE PRECISION SCALING IF CUSTOM TARGET SPECIFIED ---
  if (config && config.customRevenue !== undefined && config.customDays !== undefined && config.customDays > 0) {
    const periodStart = new Date(limitEnd.getTime() - config.customDays * 24 * 60 * 60 * 1000);
    
    // Find all succeeded and refunded transactions within the custom days period
    const periodTxs = transactions.filter(t => 
      (t.status === 'succeeded' || t.status === 'refunded') && 
      new Date(t.date) >= periodStart
    );
    
    const currentGrossSum = periodTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (currentGrossSum > 0 && config.customRevenue > 0) {
      const scaleFactor = config.customRevenue / currentGrossSum;
      
      // Scale all transactions in the entire database so the whole history stays matching and natural!
      transactions.forEach(tx => {
        const isSucceeded = tx.status === 'succeeded';
        const isRefunded = tx.status === 'refunded';
        
        if (isSucceeded || isRefunded) {
          tx.amount = Math.round(tx.amount * scaleFactor * 100) / 100;
          tx.fee = Math.round((tx.amount * 0.029 + 0.3) * 100) / 100;
        } else if (tx.status === 'failed') {
          tx.amount = Math.round(tx.amount * scaleFactor * 100) / 100;
          tx.fee = 0;
        }
      });
    }
  }

  // Sort transactions in reverse chronological order (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Format helper for currencies
 */
export function formatCurrency(amount: number, currencyCode: string, currencies: Currency[] = CURRENCIES): string {
  const currencyObj = currencies.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  // Format based on standard currency formats
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
    maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
  }).format(amount);
}

/**
 * Exchange helper to convert value from USD base to target currency code
 */
export function convertUSDToCurrency(amountUSD: number, targetCurrencyCode: string, currencies: Currency[] = CURRENCIES): number {
  const currencyObj = currencies.find(c => c.code === targetCurrencyCode) || CURRENCIES[0];
  return amountUSD * currencyObj.rate;
}
