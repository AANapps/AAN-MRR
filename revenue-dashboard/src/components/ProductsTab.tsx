import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../data';
import { Package, Plus, DollarSign, Calendar, Sparkles, Tag, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  interval: 'one-time' | 'monthly' | 'yearly';
  category: string;
  totalSalesCount: number;
  totalRevenueUSD: number;
}

interface ProductsTabProps {
  transactions: any[];
  currencyCode: string;
  showToast: (msg: string) => void;
}

export default function ProductsTab({ transactions, currencyCode, showToast }: ProductsTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductInterval, setNewProductInterval] = useState<'one-time' | 'monthly' | 'yearly'>('monthly');
  const [newProductCategory, setNewProductCategory] = useState('Software Development');

  // Load custom-created products from local storage
  const [customProducts, setCustomProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('stripe_custom_products');
    return saved ? JSON.parse(saved) : [];
  });

  // Consolidate static standard products and compute their metrics from transaction store
  const productsData = useMemo(() => {
    // Standard baseline products catalog
    const baseCatalog: Record<string, Omit<ProductItem, 'totalSalesCount' | 'totalRevenueUSD'>> = {
      'Junior Data Analyst Bootcamp - Full Course': { id: 'prod_JDA_01', name: 'Junior Data Analyst Bootcamp - Full Course', price: 2500, interval: 'one-time', category: 'Data & Analytics' },
      'Junior Software Developer Program - Standard': { id: 'prod_JSD_02', name: 'Junior Software Developer Program - Standard', price: 1800, interval: 'monthly', category: 'Software Development' },
      'Junior Software Developer Program - Career Track Annual': { id: 'prod_JSD_03', name: 'Junior Software Developer Program - Career Track Annual', price: 4800, interval: 'yearly', category: 'Software Development' },
      'Junior Cloud & DevOps Associate Course': { id: 'prod_JCD_04', name: 'Junior Cloud & DevOps Associate Course', price: 2200, interval: 'one-time', category: 'Cloud & DevOps' },
      'Junior Cybersecurity Analyst Program': { id: 'prod_JCA_05', name: 'Junior Cybersecurity Analyst Program', price: 3000, interval: 'monthly', category: 'Cybersecurity' },
      'Junior UX/UI Designer Bootcamp': { id: 'prod_JUX_06', name: 'Junior UX/UI Designer Bootcamp', price: 2100, interval: 'one-time', category: 'Product & Design' },
      'Junior QA Engineer Certification Course': { id: 'prod_JQA_07', name: 'Junior QA Engineer Certification Course', price: 1500, interval: 'one-time', category: 'QA & Testing' },
    };

    // Incorporate custom created products
    customProducts.forEach(p => {
      baseCatalog[p.name] = {
        id: p.id,
        name: p.name,
        price: p.price,
        interval: p.interval,
        category: p.category
      };
    });

    // Compute sales statistics dynamically from transaction database
    const salesCounts: Record<string, number> = {};
    const salesRevenues: Record<string, number> = {};

    transactions.forEach(tx => {
      if (tx.status === 'succeeded') {
        const title = tx.description || 'Unknown Product';
        salesCounts[title] = (salesCounts[title] || 0) + 1;
        salesRevenues[title] = (salesRevenues[title] || 0) + tx.amount;
      }
    });

    const list: ProductItem[] = Object.keys(baseCatalog).map(key => {
      const item = baseCatalog[key];
      return {
        ...item,
        totalSalesCount: salesCounts[item.name] || 0,
        totalRevenueUSD: salesRevenues[item.name] || 0
      };
    });

    // Sort by revenue descending
    return list.sort((a, b) => b.totalRevenueUSD - a.totalRevenueUSD);
  }, [transactions, customProducts]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newProductPrice);
    if (!newProductName.trim() || isNaN(priceNum) || priceNum <= 0) {
      showToast('⚠️ Please enter a valid product name and positive price.');
      return;
    }

    const newProd: ProductItem = {
      id: `prod_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      name: newProductName,
      price: priceNum,
      interval: newProductInterval,
      category: newProductCategory,
      totalSalesCount: 0,
      totalRevenueUSD: 0
    };

    const nextCustom = [newProd, ...customProducts];
    setCustomProducts(nextCustom);
    localStorage.setItem('stripe_custom_products', JSON.stringify(nextCustom));

    setNewProductName('');
    setNewProductPrice('');
    setNewProductInterval('monthly');
    setNewProductCategory('Software Development');
    setIsAddOpen(false);

    showToast(`📦 Product ${newProd.name} added with a price of ${formatCurrency(priceNum, currencyCode)}!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Product catalogue</h2>
          <p className="text-xs text-neutral-500">Track subscriptions, custom plans, billing rates, and individual revenue analytics</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-850 active:scale-97 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Create Product</span>
        </button>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Products Table Card */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-neutral-100 p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Products Catalog</h3>
            <p className="text-xs text-neutral-500">Price and cumulative revenue for each SKU</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="py-2.5 px-5">Product Name</th>
                  <th className="py-2.5 px-5">Product ID</th>
                  <th className="py-2.5 px-5">Pricing Plan</th>
                  <th className="py-2.5 px-5">Sales</th>
                  <th className="py-2.5 px-5 text-right">Gross Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {productsData.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-700">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-neutral-900">{p.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono capitalize">{p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-neutral-400 font-medium">
                      {p.id}
                    </td>
                    <td className="py-3 px-5">
                      <span className="font-mono font-medium text-neutral-800">
                        {formatCurrency(p.price, currencyCode)}
                      </span>
                      {p.interval !== 'one-time' && (
                        <span className="text-neutral-400 font-semibold text-[10px] uppercase font-mono ml-1">
                          / {p.interval === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 font-mono text-neutral-600">
                      {p.totalSalesCount} sold
                    </td>
                    <td className="py-3 px-5 font-mono font-semibold text-right text-neutral-900">
                      {formatCurrency(p.totalRevenueUSD, currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Catalog Insights */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
          <h4 className="text-sm font-semibold text-neutral-900 border-b border-neutral-100 pb-3 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-neutral-500" /> Catalog Revenue Split
          </h4>

          <div className="space-y-4">
            <p className="text-xs text-neutral-500 leading-normal">
              Based on current activity, subscription recurring charges contribute to the majority of consistent growth. Keep adding custom products to monitor transaction splits.
            </p>

            <div className="space-y-3 pt-2">
              {productsData.slice(0, 3).map((p) => {
                const totalRevs = productsData.reduce((sum, item) => sum + item.totalRevenueUSD, 0);
                const percent = totalRevs > 0 ? (p.totalRevenueUSD / totalRevs) * 100 : 0;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700 truncate max-w-[180px]">{p.name}</span>
                      <span className="font-mono text-neutral-500 font-semibold">{percent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-100 pt-3 text-[11px] text-neutral-400 flex gap-1.5">
              <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
              <span>
                New custom products created here are instantly made available at checkout.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Create Product Modal Drawer */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/20 backdrop-blur-xs">
            {/* Modal Backdrop click to close */}
            <div className="absolute inset-0 animate-fade-in" onClick={() => setIsAddOpen(false)} />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-neutral-900">Create New Product</h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-neutral-200 p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Junior Product Analyst Bootcamp"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase">Price (USD)</label>
                    <div className="relative flex items-center">
                      <DollarSign className="absolute left-2.5 h-4 w-4 text-neutral-400" />
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        placeholder="2500.00"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-8 text-sm text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase">Billing Scheme</label>
                    <select
                      value={newProductInterval}
                      onChange={(e) => setNewProductInterval(e.target.value as any)}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer"
                    >
                      <option value="one-time">One-time</option>
                      <option value="monthly">Monthly Recurring</option>
                      <option value="yearly">Yearly Recurring</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-neutral-400 uppercase">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Software Development, Data & Analytics, Cybersecurity"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg border border-neutral-900 bg-neutral-900 py-2 text-center text-xs font-semibold text-white hover:bg-neutral-850 transition"
                  >
                    Create Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
