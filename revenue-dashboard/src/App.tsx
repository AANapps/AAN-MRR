import { useState, useMemo, useEffect } from 'react';
import { generateMockTransactions, CURRENCIES, formatCurrency, convertUSDToCurrency } from './data';
import { getPresetRange, getPreviousPeriodRange, calculateMetrics, aggregateChartData, SIMULATED_NOW } from './utils';
import { Transaction, TimeInterval } from './types';
import FilterBar from './components/FilterBar';
import MetricCard from './components/MetricCard';
import ChartContainer from './components/ChartContainer';
import RecentPaymentsTable from './components/RecentPaymentsTable';
import LeftSidebar from './components/LeftSidebar';
import BalancesTab from './components/BalancesTab';
import CustomersTab from './components/CustomersTab';
import ProductsTab from './components/ProductsTab';
import DevelopersTab from './components/DevelopersTab';
import { HelpCircle, Activity, Sparkles, Search, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CustomConfig {
  customRevenue: number;
  customDays: number;
  customCount?: number;
}

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'home' | 'payments' | 'balances' | 'customers' | 'products' | 'developers'>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Primary state: seeded mock transaction database
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('stripe_custom_config');
    const config = saved ? JSON.parse(saved) : undefined;
    return generateMockTransactions(config);
  });

  // Filter and aggregation states
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [selectedPreset, setSelectedPreset] = useState<string>('30days');
  const [chartInterval, setChartInterval] = useState<TimeInterval>('daily');
  const [activeMetric, setActiveMetric] = useState<'gross' | 'net' | 'count'>('gross');

  // Custom date picker states
  const [customStartDate, setCustomStartDate] = useState<string>('2026-06-11');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-07-10');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom simulation target states
  const [customConfig, setCustomConfig] = useState<CustomConfig | null>(() => {
    const saved = localStorage.getItem('stripe_custom_config');
    return saved ? JSON.parse(saved) : null;
  });

  const [inputRevenue, setInputRevenue] = useState('33435.54');
  const [inputDays, setInputDays] = useState('30');
  const [inputCount, setInputCount] = useState('891');

  useEffect(() => {
    if (customConfig) {
      setInputRevenue(customConfig.customRevenue.toString());
      setInputDays(customConfig.customDays.toString());
      setInputCount(customConfig.customCount?.toString() || Math.max(1, Math.round(customConfig.customRevenue / 37.5258)).toString());
    } else {
      setInputRevenue('33435.54');
      setInputDays('30');
      setInputCount('891');
    }
  }, [customConfig]);

  const handleSaveConfig = (revenue: number, days: number, count: number) => {
    if (isNaN(revenue) || revenue <= 0) {
      showToast('⚠️ Please enter a valid revenue amount greater than 0.');
      return;
    }
    if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
      showToast('⚠️ Please enter a valid positive integer number of days.');
      return;
    }
    if (isNaN(count) || count <= 0 || !Number.isInteger(count)) {
      showToast('⚠️ Please enter a valid positive integer number of transactions.');
      return;
    }
    
    const newConfig: CustomConfig = { customRevenue: revenue, customDays: days, customCount: count };
    setCustomConfig(newConfig);
    localStorage.setItem('stripe_custom_config', JSON.stringify(newConfig));
    setTransactions(generateMockTransactions(newConfig));
    
    // Automatically select the preset that covers this number of days so they see it instantly!
    if (days === 7) {
      setSelectedPreset('7days');
    } else if (days === 30) {
      setSelectedPreset('30days');
    } else {
      // If custom days, set a custom range that perfectly matches!
      const end = new Date(SIMULATED_NOW);
      const start = new Date(SIMULATED_NOW);
      start.setUTCDate(start.getUTCDate() - (days - 1));
      
      const formatYMD = (d: Date) => d.toISOString().split('T')[0];
      setCustomStartDate(formatYMD(start));
      setCustomEndDate(formatYMD(end));
      setSelectedPreset('custom');
    }

    showToast(`⚙️ Target configured: ${formatCurrency(revenue, selectedCurrency)} & ${count} transactions over ${days} days!`);
  };

  const handleResetConfig = () => {
    setCustomConfig(null);
    localStorage.removeItem('stripe_custom_config');
    setTransactions(generateMockTransactions());
    showToast('⚙️ Reset to default revenue baseline.');
  };

  // Auto-tune chart interval based on selected preset
  useEffect(() => {
    switch (selectedPreset) {
      case 'today':
      case 'yesterday':
        setChartInterval('hourly');
        break;
      case '7days':
      case '30days':
        setChartInterval('daily');
        break;
      case '3months':
        setChartInterval('weekly');
        break;
      case '12months':
      case 'ytd':
      case 'all':
        setChartInterval('monthly');
        break;
      default:
        break;
    }
  }, [selectedPreset]);

  // Compute active date range (Start & End dates)
  const dateRange = useMemo(() => {
    if (selectedPreset === 'custom') {
      const start = new Date(`${customStartDate}T00:00:00Z`);
      const end = new Date(`${customEndDate}T23:59:59Z`);
      return { start, end };
    }
    return getPresetRange(selectedPreset);
  }, [selectedPreset, customStartDate, customEndDate]);

  // Compute comparison period date range
  const prevDateRange = useMemo(() => {
    return getPreviousPeriodRange(dateRange.start, dateRange.end, selectedPreset);
  }, [dateRange, selectedPreset]);

  // Filtered transactions for the current period
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= dateRange.start && txDate <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Filtered transactions for the previous period
  const prevFilteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= prevDateRange.start && txDate <= prevDateRange.end;
    });
  }, [transactions, prevDateRange]);

  // Aggregate current metrics
  const metrics = useMemo(() => {
    return calculateMetrics(filteredTransactions, selectedCurrency);
  }, [filteredTransactions, selectedCurrency]);

  // Aggregate previous metrics for comparison
  const prevMetrics = useMemo(() => {
    return calculateMetrics(prevFilteredTransactions, selectedCurrency);
  }, [prevFilteredTransactions, selectedCurrency]);

  // Aggregated Chart Data
  const chartData = useMemo(() => {
    return aggregateChartData(
      filteredTransactions,
      dateRange.start,
      dateRange.end,
      chartInterval,
      selectedCurrency
    );
  }, [filteredTransactions, dateRange, chartInterval, selectedCurrency]);

  // Trigger brief alert Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Live Simulated Payment creation handler
  const handleAddSimulatedTx = () => {
    const randomNames = ['John Doe', 'Alice Freeman', 'Robert Lee', 'Zoe Jenkins', 'Kevin Patel', 'Hana Suzuki'];
    const randomEmails = ['john.d@company.com', 'alice@freeman.io', 'r.lee@tech.co', 'zoe.j@example.com', 'kpatel@fintech.net', 'hana@suzuki.co.jp'];
    const randomDescs = ['SaaS Pro Subscription - Standard Monthly', 'API Usage Pack - Overages Tier 2', 'Developer Seat License add-on', 'Premium Support SLA - Custom Integration'];
    const randomPrices = [79, 149, 29, 300];

    const idx = Math.floor(Math.random() * randomNames.length);
    const prodIdx = Math.floor(Math.random() * randomDescs.length);

    const priceUSD = randomPrices[prodIdx];
    const feeUSD = Math.round((priceUSD * 0.029 + 0.3) * 100) / 100;

    const nativeCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
    const nativeCurr = nativeCurrencies[Math.floor(Math.random() * nativeCurrencies.length)];

    const newTx: Transaction = {
      id: `ch_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      amount: priceUSD,
      currency: nativeCurr,
      status: 'succeeded',
      customerName: randomNames[idx],
      customerEmail: randomEmails[idx],
      description: randomDescs[prodIdx],
      date: new Date().toISOString(), // Real-time date
      fee: feeUSD,
      paymentMethod: ['card', 'apple_pay', 'google_pay'][Math.floor(Math.random() * 3)] as any
    };

    // Prepend to transaction store
    setTransactions(prev => [newTx, ...prev]);
    
    const convertedVal = formatCurrency(convertUSDToCurrency(priceUSD, selectedCurrency), selectedCurrency);
    showToast(`💰 Payment of ${convertedVal} captured from ${randomNames[idx]}!`);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('⚠️ No transaction data to export!');
      return;
    }

    const headers = ['Transaction ID', 'Customer Name', 'Customer Email', 'Original Amount', 'Original Currency', 'Converted Amount (Selected)', 'Fees (USD)', 'Status', 'Payment Method', 'Date (UTC)'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      `"${tx.customerName.replace(/"/g, '""')}"`,
      tx.customerEmail,
      tx.amount,
      tx.currency,
      convertUSDToCurrency(tx.amount, selectedCurrency).toFixed(2),
      tx.fee,
      tx.status,
      tx.paymentMethod,
      tx.date
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stripe_revenue_export_${selectedCurrency}_${selectedPreset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`📄 Exported ${filteredTransactions.length} transaction logs!`);
  };

  // Header Title breadcrumb labels based on selected tab
  const getBreadcrumbLabel = () => {
    switch (currentTab) {
      case 'home': return { title: 'Home', subtitle: 'Overview & business health metrics' };
      case 'payments': return { title: 'Transactions', subtitle: 'Audit individual charges and customer payouts' };
      case 'balances': return { title: 'Balances', subtitle: 'Funds settled, available, and historique logs' };
      case 'customers': return { title: 'Customers', subtitle: 'Review active subscriber directories and accounts' };
      case 'products': return { title: 'Product catalogue', subtitle: 'Subscription products list and pricing catalog' };
      case 'developers': return { title: 'Workbench', subtitle: 'API logs, keys, and account configuration' };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FA] text-neutral-900 font-sans">

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">

        {/* Sidebar navigation */}
        <LeftSidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          userEmail="info@adastranetwork.co.uk"
        />

        {/* Main Workspace Frame container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">

          {/* Global Horizontal Header */}
          <header className="border-b border-neutral-200 bg-white px-6 py-3 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  {getBreadcrumbLabel().title}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">{getBreadcrumbLabel().subtitle}</p>
              </div>

              {/* Command-palette style search, centered */}
              <button
                onClick={() => showToast('🔍 Search is coming soon.')}
                className="hidden md:flex flex-1 max-w-sm items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-300 hover:bg-white transition"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 text-left">Search Adastra Network</span>
                <span className="rounded border border-neutral-200 bg-white px-1 py-0.5 text-[10px] font-mono text-neutral-400">/</span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Live status indicator */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  All systems operational
                </div>

                <a
                  href="#notifications"
                  onClick={(e) => { e.preventDefault(); showToast('🔔 No new notifications.'); }}
                  className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition"
                  title="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                </a>

                <a
                  href="#help"
                  onClick={(e) => { e.preventDefault(); showToast('📖 Documentation is available in the Developers tab.'); }}
                  className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition"
                  title="Help Docs"
                >
                  <HelpCircle className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>
          </header>

        {/* Content view frame */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {currentTab === 'home' && (
            <div className="space-y-6">
              
              {/* Filter Toolbar row */}
              <FilterBar
                id="filter-toolbar"
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
                chartInterval={chartInterval}
                setChartInterval={setChartInterval}
                onAddSimulatedTx={handleAddSimulatedTx}
                onExportCSV={handleExportCSV}
              />

              {/* Metrics Card Strip */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  id="metric-gross"
                  title="Gross Revenue"
                  value={metrics.grossRevenue}
                  prevValue={prevMetrics.grossRevenue}
                  currencyCode={selectedCurrency}
                  tooltip="All captured payments including processing fees before any refunds."
                  isSelected={activeMetric === 'gross'}
                  onClick={() => setActiveMetric('gross')}
                />
                <MetricCard
                  id="metric-net"
                  title="Net Revenue"
                  value={metrics.netRevenue}
                  prevValue={prevMetrics.netRevenue}
                  currencyCode={selectedCurrency}
                  tooltip="Calculated settle amount (Captured Payments minus estimated 2.9% + $0.30 processing fee, with refunded charges excluded)."
                  isSelected={activeMetric === 'net'}
                  onClick={() => setActiveMetric('net')}
                />
                <MetricCard
                  id="metric-count"
                  title="Successful Payments"
                  value={metrics.successfulPayments}
                  prevValue={prevMetrics.successfulPayments}
                  currencyCode={selectedCurrency}
                  tooltip="Total count of customer checkout sessions successfully captured."
                  isSelected={activeMetric === 'count'}
                  onClick={() => setActiveMetric('count')}
                />
                <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                    <span>Average Value</span>
                  </div>
                  <p className="font-mono text-2xl font-bold text-neutral-900">
                    {formatCurrency(metrics.successfulPayments > 0 ? (metrics.grossRevenue / metrics.successfulPayments) : 0, selectedCurrency)}
                  </p>
                  <p className="text-[10px] text-neutral-400">Estimated value per successful customer card charge.</p>
                </div>
              </div>

              {/* Charts Display */}
              <ChartContainer
                id="revenue-chart"
                data={chartData}
                activeMetric={activeMetric}
                setActiveMetric={setActiveMetric}
                currencyCode={selectedCurrency}
              />

              {/* Business checklist and diagnostic logs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Onboarding Checklist panel */}
                <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
                    <Sparkles className="h-4 w-4 text-brand animate-pulse" /> Getting Started
                  </h3>

                  <div className="space-y-3.5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 font-mono border border-emerald-100">✓</span>
                      <div className="text-xs">
                        <span className="font-bold text-neutral-800 block">Configure monthly gross target</span>
                        <p className="text-neutral-500">Go to settings or Developers tab to set custom volume scattering goals.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-700 font-mono border border-emerald-100">✓</span>
                      <div className="text-xs">
                        <span className="font-bold text-neutral-800 block">Verify multi-currency support</span>
                        <p className="text-neutral-500">Try changing filter currencies (USD, EUR, GBP, JPY) to see automated cross-rate conversions.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-[11px] font-bold text-brand font-mono border border-brand/10">3</span>
                      <div className="text-xs">
                        <span className="font-bold text-neutral-800 block">Send an instant payout transfer</span>
                        <p className="text-neutral-500">Navigate to the Balances tab to send available cash directly to linked bank accounts.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Diagnostics */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5 border-b border-neutral-100 pb-3">
                    <Activity className="h-4 w-4 text-emerald-500" /> Gateway Health
                  </h3>

                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Card Success Rate</span>
                      <span className="font-mono font-bold text-emerald-600">99.85%</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">API Latency avg</span>
                      <span className="font-mono text-neutral-700">42ms</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Fraud Score threshold</span>
                      <span className="font-mono text-neutral-400">&lt; 1 / 100</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Refund Ratio</span>
                      <span className="font-mono text-emerald-600">0.12%</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent charges table list */}
              <RecentPaymentsTable
                id="payments-table"
                transactions={filteredTransactions}
                currencyCode={selectedCurrency}
                showToast={showToast}
              />
            </div>
          )}

          {currentTab === 'payments' && (
            <RecentPaymentsTable
              id="payments-table-dedicated"
              transactions={filteredTransactions}
              currencyCode={selectedCurrency}
              showToast={showToast}
            />
          )}

          {currentTab === 'balances' && (
            <BalancesTab
              grossRevenue={metrics.grossRevenue}
              feesPaid={metrics.feesPaid}
              currencyCode={selectedCurrency}
              showToast={showToast}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersTab
              transactions={transactions}
              currencyCode={selectedCurrency}
              showToast={showToast}
            />
          )}

          {currentTab === 'products' && (
            <ProductsTab
              transactions={transactions}
              currencyCode={selectedCurrency}
              showToast={showToast}
            />
          )}

          {currentTab === 'developers' && (
            <DevelopersTab
              inputRevenue={inputRevenue}
              setInputRevenue={setInputRevenue}
              inputDays={inputDays}
              setInputDays={setInputDays}
              inputCount={inputCount}
              setInputCount={setInputCount}
              onSaveConfig={handleSaveConfig}
              onResetConfig={handleResetConfig}
              customConfig={customConfig}
              currencyCode={selectedCurrency}
              showToast={showToast}
            />
          )}

        </main>

        </div>

      </div>

      {/* Floating active alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 rounded-xl bg-[#0C0E17] text-neutral-200 px-4 py-3 text-xs font-mono font-semibold shadow-xl border border-neutral-800 flex items-center gap-2 max-w-sm"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
