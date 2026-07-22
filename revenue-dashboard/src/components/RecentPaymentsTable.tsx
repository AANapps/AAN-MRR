import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, convertUSDToCurrency } from '../data';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Eye, X, Download, CreditCard, Mail, Calendar, Hash, ShieldCheck, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecentPaymentsTableProps {
  transactions: Transaction[];
  currencyCode: string;
  id: string;
  showToast: (message: string) => void;
}

const ITEMS_PER_PAGE = 10;

export default function RecentPaymentsTable({ transactions, currencyCode, id, showToast }: RecentPaymentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter transactions based on query and status
  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch =
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || tx.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Reset pagination when filter or search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / ITEMS_PER_PAGE));
  const paginatedTxs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTxs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTxs, currentPage]);

  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'succeeded':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: <CheckCircle2 className="h-3 w-3" />
        };
      case 'failed':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-100',
          icon: <AlertCircle className="h-3 w-3" />
        };
      case 'refunded':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: <RefreshCw className="h-3 w-3" />
        };
      case 'processing':
      default:
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-100',
          icon: <RefreshCw className="h-3 w-3 animate-spin" />
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getPaymentMethodLabel = (method: Transaction['paymentMethod']) => {
    switch (method) {
      case 'card':
        return 'Visa •••• 4242';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return 'Card';
    }
  };

  return (
    <div id={id} className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
      {/* Header section with search & quick status filters */}
      <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">Payments</h3>
          <p className="text-xs text-neutral-500">List of transactions in selected filter range</p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white py-1.5 pr-3 pl-9 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-brand focus:ring-1 focus:ring-brand sm:w-60"
            />
          </div>

          {/* Status buttons */}
          <div className="flex flex-wrap rounded-lg bg-neutral-100 p-1">
            {['all', 'succeeded', 'refunded', 'failed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-950'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-neutral-500">
              <th className="py-3 px-5">Amount</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5">Customer</th>
              <th className="py-3 px-5">Description</th>
              <th className="py-3 px-5">Payment Method</th>
              <th className="py-3 px-5">Date (UTC)</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {paginatedTxs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-400">
                  No transactions found matching your selection.
                </td>
              </tr>
            ) : (
              paginatedTxs.map((tx) => {
                const statusStyle = getStatusStyle(tx.status);
                // Convert values to dashboard display currency
                const convertedAmt = convertUSDToCurrency(tx.amount, currencyCode);
                
                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="group hover:bg-neutral-50/70 transition-colors cursor-pointer"
                  >
                    {/* Amount */}
                    <td className="py-3 px-5 font-mono font-medium text-neutral-900">
                      <div className="flex flex-col">
                        <span>{formatCurrency(convertedAmt, currencyCode)}</span>
                        {tx.currency !== currencyCode && (
                          <span className="text-[10px] text-neutral-400">
                            Original: {formatCurrency(convertUSDToCurrency(tx.amount, tx.currency), tx.currency)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyle.bg}`}>
                        {statusStyle.icon}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 font-mono text-xs font-semibold text-neutral-600">
                          {getInitials(tx.customerName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-800">{tx.customerName}</span>
                          <span className="text-[11px] text-neutral-500 leading-tight">{tx.customerEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-5 text-neutral-600 max-w-[180px] truncate" title={tx.description}>
                      {tx.description}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-5 text-neutral-500 font-mono text-xs">
                      {getPaymentMethodLabel(tx.paymentMethod)}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-5 font-mono text-xs text-neutral-500">
                      {new Date(tx.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'UTC'
                      })}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTx(tx);
                        }}
                        className="rounded-md border border-neutral-200 bg-white p-1 text-neutral-400 opacity-0 group-hover:opacity-100 hover:bg-neutral-50 hover:text-neutral-700 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 p-4 text-xs">
        <span className="text-neutral-500 font-mono">
          Showing <span className="font-semibold text-neutral-800">{filteredTxs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to{' '}
          <span className="font-semibold text-neutral-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTxs.length)}</span> of{' '}
          <span className="font-semibold text-neutral-800">{filteredTxs.length}</span> results
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-neutral-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center rounded-lg border border-neutral-200 bg-white p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40 disabled:hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide-over detailed Modal for Transaction */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex justify-end bg-neutral-950/20 backdrop-blur-xs">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedTx(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-neutral-200 p-6 z-10 overflow-y-auto"
            >
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-neutral-800" />
                  <span className="font-mono text-xs font-semibold text-neutral-500">PAYMENT DETAIL</span>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status / Amount section */}
              <div className="my-6 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-neutral-50">
                  {getStatusStyle(selectedTx.status).icon}
                </div>
                <h4 className="mt-3 text-3xl font-mono font-bold text-neutral-900">
                  {formatCurrency(convertUSDToCurrency(selectedTx.amount, currencyCode), currencyCode)}
                </h4>
                <p className="text-xs text-neutral-400 uppercase mt-1 tracking-wider font-semibold font-mono">
                  {selectedTx.status}
                </p>
              </div>

              {/* Transaction breakdown details */}
              <div className="space-y-4 flex-1">
                <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Payment ID</span>
                    <span className="font-mono font-semibold text-neutral-800">{selectedTx.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Original Charge</span>
                    <span className="font-mono text-neutral-800">
                      {formatCurrency(convertUSDToCurrency(selectedTx.amount, selectedTx.currency), selectedTx.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium flex items-center gap-1">
                      <Percent className="h-3 w-3" />
                      Processing Fee
                    </span>
                    <span className="font-mono text-neutral-800">
                      {formatCurrency(convertUSDToCurrency(selectedTx.fee, currencyCode), currencyCode)}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200/60 my-2 pt-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-neutral-800">Net Settlement</span>
                    <span className="font-mono text-neutral-950">
                      {selectedTx.status === 'succeeded' 
                        ? formatCurrency(convertUSDToCurrency(selectedTx.amount - selectedTx.fee, currencyCode), currencyCode) 
                        : formatCurrency(0, currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Customer Section */}
                <div>
                  <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-2">Customer & Account</h5>
                  <div className="rounded-xl border border-neutral-100 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold font-mono">
                        {getInitials(selectedTx.customerName)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-800">{selectedTx.customerName}</span>
                        <span className="text-xs text-neutral-500">{selectedTx.customerEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata & Diagnostics */}
                <div>
                  <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono mb-2">Technical Info</h5>
                  <div className="rounded-xl border border-neutral-100 p-4 space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Date/Time</span>
                      <span className="text-neutral-700 text-right text-[11px]">{new Date(selectedTx.date).toUTCString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Payment Type</span>
                      <span className="text-neutral-700 capitalize">{selectedTx.paymentMethod.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Descriptor</span>
                      <span className="text-neutral-700 max-w-[180px] truncate text-right">{selectedTx.description}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-[10px]">
                      <span className="text-neutral-400 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        Fraud Risk Score
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">1 (Very Low Risk)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF / Invoice Actions */}
              <div className="border-t border-neutral-100 pt-4 flex gap-2.5 mt-4">
                <button
                  onClick={() => showToast('📄 Receipt download started.')}
                  className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
