import { useState, useMemo } from 'react';
import { formatCurrency } from '../data';
import { Landmark, ArrowUpRight, TrendingUp, HelpCircle, CheckCircle2, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Payout {
  id: string;
  amount: number;
  status: 'paid' | 'in_transit' | 'failed';
  date: string;
  bankName: string;
}

interface BalancesTabProps {
  grossRevenue: number;
  feesPaid: number;
  currencyCode: string;
  showToast: (msg: string) => void;
}

export default function BalancesTab({ grossRevenue, feesPaid, currencyCode, showToast }: BalancesTabProps) {
  // Compute some realistic balances
  const netPool = Math.max(0, grossRevenue - feesPaid);
  
  const [availableToPayout, setAvailableToPayout] = useState<number>(() => {
    const saved = localStorage.getItem('stripe_available_payout_pool');
    return saved ? parseFloat(saved) : Math.round(netPool * 0.35 * 100) / 100;
  });

  const [inTransitAmount, setInTransitAmount] = useState<number>(
    Math.round(netPool * 0.15 * 100) / 100
  );

  const [payouts, setPayouts] = useState<Payout[]>(() => {
    const saved = localStorage.getItem('stripe_simulated_payouts_v1');
    if (saved) return JSON.parse(saved);

    // Default seeded payouts
    const list: Payout[] = [
      { id: 'po_1N9A4B3X', amount: Math.round(netPool * 0.22 * 100) / 100, status: 'paid', date: '2026-07-01T14:32:00Z', bankName: 'Chase Bank •••• 9924' },
      { id: 'po_1N8X92M2', amount: Math.round(netPool * 0.18 * 100) / 100, status: 'paid', date: '2026-06-15T09:12:00Z', bankName: 'Chase Bank •••• 9924' },
      { id: 'po_1N7C11P0', amount: Math.round(netPool * 0.28 * 100) / 100, status: 'paid', date: '2026-06-01T08:00:00Z', bankName: 'Chase Bank •••• 9924' },
    ];
    return list;
  });

  const handleInstantPayout = () => {
    if (availableToPayout <= 0) {
      showToast('⚠️ No available funds in balance pool to pay out!');
      return;
    }

    const payoutAmount = availableToPayout;
    const newPayout: Payout = {
      id: `po_SIM_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      amount: payoutAmount,
      status: 'in_transit',
      date: new Date().toISOString(),
      bankName: 'Chase Bank •••• 9924'
    };

    const updatedPayouts = [newPayout, ...payouts];
    setPayouts(updatedPayouts);
    localStorage.setItem('stripe_simulated_payouts_v1', JSON.stringify(updatedPayouts));

    setAvailableToPayout(0);
    localStorage.setItem('stripe_available_payout_pool', '0');

    showToast(`🏦 Payout of ${formatCurrency(payoutAmount, currencyCode)} initiated to your bank!`);

    // Simulate arriving in 3 seconds!
    setTimeout(() => {
      setPayouts(prev => {
        const next = prev.map(p => p.id === newPayout.id ? { ...p, status: 'paid' as const } : p);
        localStorage.setItem('stripe_simulated_payouts_v1', JSON.stringify(next));
        return next;
      });
      showToast(`✅ Payout ${newPayout.id} arrived successfully at Chase Bank!`);
    }, 5000);
  };

  const handleAddFunds = () => {
    const topUp = Math.round((Math.random() * 5000 + 1000) * 100) / 100;
    const nextVal = Math.round((availableToPayout + topUp) * 100) / 100;
    setAvailableToPayout(nextVal);
    localStorage.setItem('stripe_available_payout_pool', nextVal.toString());
    showToast(`💰 Simulated top-up of ${formatCurrency(topUp, currencyCode)} added to your available payout balance!`);
  };

  const totalPaidOut = useMemo(() => {
    return payouts
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payouts]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Balances</h2>
          <p className="text-xs text-neutral-500">Track settlements, pending clearance, and bank payouts</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddFunds}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-97 transition"
          >
            Add Simulated Funds
          </button>
          
          <button
            onClick={handleInstantPayout}
            disabled={availableToPayout <= 0}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-850 active:scale-97 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            <Landmark className="h-4 w-4" />
            <span>Payout Available Balance</span>
          </button>
        </div>
      </div>

      {/* Balance widgets strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Available to Payout */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Available to payout</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-neutral-900">
              {formatCurrency(availableToPayout, currencyCode)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">Ready for transfer to your linked bank account.</p>
          </div>
          {availableToPayout > 0 && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-emerald-500" />
          )}
        </div>

        {/* Pending Clearance */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">In transit / Pending</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-neutral-900">
              {formatCurrency(inTransitAmount, currencyCode)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">Awaiting 2-day standard rolling settlement clearance.</p>
          </div>
        </div>

        {/* Total Settled */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider font-mono">Total Paid Out</span>
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-neutral-900">
              {formatCurrency(totalPaidOut, currencyCode)}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">Historically sent to Chase Bank ending in •••• 9924.</p>
          </div>
        </div>
      </div>

      {/* Payout Calendar & FAQ Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payout list table */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden flex flex-col">
          <div className="border-b border-neutral-100 p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Payout Logs</h3>
            <p className="text-xs text-neutral-500">History of transfers from your Stripe balance</p>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-5">Payout ID</th>
                  <th className="py-2.5 px-5">Status</th>
                  <th className="py-2.5 px-5">Destination</th>
                  <th className="py-2.5 px-5">Date Initiated</th>
                  <th className="py-2.5 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-neutral-400">
                      No payouts initiated yet.
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/55 transition">
                      <td className="py-3 px-5 font-mono font-medium text-neutral-900">{p.id}</td>
                      <td className="py-3 px-5">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          p.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {p.status === 'paid' ? (
                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                          ) : (
                            <RefreshCw className="h-2.5 w-2.5 text-amber-600 animate-spin" />
                          )}
                          {p.status === 'paid' ? 'paid' : 'in transit'}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-neutral-600">{p.bankName}</td>
                      <td className="py-3 px-5 text-neutral-500 font-mono">
                        {new Date(p.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC'
                        })}
                      </td>
                      <td className="py-3 px-5 font-mono font-semibold text-right text-neutral-900">
                        {formatCurrency(p.amount, currencyCode)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settlement Calendar & Rule Check Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <h4 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-neutral-500" /> Settlement Schedule
          </h4>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold text-neutral-400 block">DEFAULT PAYOUT SPEED</span>
              <p className="text-xs font-semibold text-neutral-800">Daily rolling (2 business days)</p>
              <p className="text-[11px] text-neutral-500">
                Transactions processed on Monday clear and arrive in your bank balance on Wednesday.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold text-neutral-400 block">INSTANT PAYOUT SPEED</span>
              <p className="text-xs font-semibold text-neutral-800">Instant (Within 30 minutes)</p>
              <p className="text-[11px] text-neutral-500">
                1% transaction surcharge fee applies. Enabled on sandbox mode for real-time testing.
              </p>
            </div>

            <div className="border-t border-neutral-100 pt-3 flex items-start gap-2 text-neutral-500 text-[11px]">
              <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <span>
                Initiating an Instant Payout dynamically triggers a simulated settlement flow that reconciles your ledger logs automatically.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
