import { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionStatus } from '../types';
import { CURRENCIES, formatCurrency } from '../data';
import { X, ShieldAlert, Plus, Search, Eye, EyeOff, Save, UserCog } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (id: string, updates: Partial<Transaction>) => void;
  redactMode: boolean;
  setRedactMode: (val: boolean) => void;
  showToast: (msg: string) => void;
}

type FormState = {
  customerName: string;
  customerEmail: string;
  amount: string;
  currency: string;
  fee: string;
  status: TransactionStatus;
  paymentMethod: Transaction['paymentMethod'];
  description: string;
  date: string; // datetime-local formatted
};

const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blankForm = (): FormState => ({
  customerName: '',
  customerEmail: '',
  amount: '',
  currency: 'USD',
  fee: '',
  status: 'succeeded',
  paymentMethod: 'card',
  description: '',
  date: isoToLocalInput(new Date().toISOString()),
});

const txToForm = (tx: Transaction): FormState => ({
  customerName: tx.customerName,
  customerEmail: tx.customerEmail,
  amount: tx.amount.toString(),
  currency: tx.currency,
  fee: tx.fee.toString(),
  status: tx.status,
  paymentMethod: tx.paymentMethod,
  description: tx.description,
  date: isoToLocalInput(tx.date),
});

export default function AdminPanel({
  isOpen,
  onClose,
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  redactMode,
  setRedactMode,
  showToast,
}: AdminPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === selectedId) ?? null,
    [transactions, selectedId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setForm(selectedTx ? txToForm(selectedTx) : blankForm());
  }, [selectedTx, isOpen]);

  const sortedTxs = useMemo(() => {
    const list = transactions.filter((tx) => {
      const q = searchQuery.toLowerCase();
      return (
        tx.customerName.toLowerCase().includes(q) ||
        tx.customerEmail.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        tx.description.toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery]);

  if (!isOpen) return null;

  const handleField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNewClick = () => {
    setSelectedId(null);
    setForm(blankForm());
  };

  const handleSave = () => {
    const amount = parseFloat(form.amount);
    const fee = form.fee === '' ? 0 : parseFloat(form.fee);

    if (!form.customerName.trim() || !form.customerEmail.trim()) {
      showToast('⚠️ Customer name and email are required.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      showToast('⚠️ Enter a valid amount greater than 0.');
      return;
    }
    if (isNaN(fee) || fee < 0) {
      showToast('⚠️ Enter a valid fee (0 or more).');
      return;
    }

    const isoDate = new Date(form.date).toISOString();

    if (selectedTx) {
      onUpdateTransaction(selectedTx.id, {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        amount,
        currency: form.currency,
        fee,
        status: form.status,
        paymentMethod: form.paymentMethod,
        description: form.description.trim(),
        date: isoDate,
      });
      showToast(`✏️ Updated transaction ${selectedTx.id}.`);
    } else {
      const newTx: Transaction = {
        id: `ch_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        amount,
        currency: form.currency,
        fee,
        status: form.status,
        paymentMethod: form.paymentMethod,
        description: form.description.trim() || 'Manual admin entry',
        date: isoDate,
      };
      onAddTransaction(newTx);
      setSelectedId(newTx.id);
      showToast(`➕ Added new transaction for ${newTx.customerName}.`);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-950/40 backdrop-blur-xs p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Admin Console</h2>
              <p className="text-[11px] text-neutral-500">Add and edit transaction records — changes apply instantly across the dashboard.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRedactMode(!redactMode)}
              title="Blur customer name, email, and payment details across the dashboard"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                redactMode
                  ? 'border-brand bg-brand-light text-brand'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {redactMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {redactMode ? 'Data blurred' : 'Blur sensitive data'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* List panel */}
          <div className="flex w-full max-w-[280px] shrink-0 flex-col border-r border-neutral-100">
            <div className="space-y-2 border-b border-neutral-100 p-3">
              <button
                onClick={handleNewClick}
                className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                  !selectedTx
                    ? 'bg-neutral-900 text-white'
                    : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                New transaction
              </button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records..."
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-2 text-xs text-neutral-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sortedTxs.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-neutral-400">No matching records.</p>
              ) : (
                sortedTxs.map((tx) => (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedId(tx.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-neutral-50 px-3 py-2.5 text-left transition ${
                      selectedId === tx.id ? 'bg-brand-light' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${selectedId === tx.id ? 'text-brand' : 'text-neutral-800'}`}>
                      {formatCurrency(tx.amount, tx.currency)} · {tx.customerName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {tx.id} · {tx.status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Edit / Add form panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {selectedTx ? `Editing ${selectedTx.id}` : 'New transaction record'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Customer Name</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => handleField('customerName', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Customer Email</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => handleField('customerEmail', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="jane@company.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => handleField('amount', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="8500.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Original Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => handleField('currency', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Processing Fee (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.fee}
                  onChange={(e) => handleField('fee', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="4.62"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleField('status', e.target.value as TransactionStatus)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="succeeded">Succeeded</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                  <option value="processing">Processing</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => handleField('paymentMethod', e.target.value as Transaction['paymentMethod'])}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="card">Card</option>
                  <option value="apple_pay">Apple Pay</option>
                  <option value="google_pay">Google Pay</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Date / Time</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => handleField('date', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => handleField('description', e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Junior Software Developer Program - Standard"
                />
              </div>
            </div>

            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-[11px] text-indigo-800 flex items-start gap-2 leading-relaxed">
              <ShieldAlert className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p>Saving here updates the shared transaction record used everywhere — metrics, charts, and the transactions table recalculate immediately.</p>
            </div>

            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
              <button
                onClick={handleNewClick}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-850 transition"
              >
                <Save className="h-3.5 w-3.5" />
                {selectedTx ? 'Save changes' : 'Add transaction'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
