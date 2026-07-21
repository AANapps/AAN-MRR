import { Currency, DateRange, TimeInterval } from '../types';
import { CURRENCIES } from '../data';
import { DATE_PRESETS, SIMULATED_NOW } from '../utils';
import { Calendar as CalendarIcon, Coins, RefreshCw, BarChart2, Plus, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface FilterBarProps {
  selectedCurrency: string;
  setSelectedCurrency: (curr: string) => void;
  selectedPreset: string;
  setSelectedPreset: (preset: string) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  chartInterval: TimeInterval;
  setChartInterval: (interval: TimeInterval) => void;
  onAddSimulatedTx: () => void;
  onExportCSV: () => void;
  id: string;
}

export default function FilterBar({
  selectedCurrency,
  setSelectedCurrency,
  selectedPreset,
  setSelectedPreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  chartInterval,
  setChartInterval,
  onAddSimulatedTx,
  onExportCSV,
  id
}: FilterBarProps) {
  const [showCustomInputs, setShowCustomInputs] = useState(selectedPreset === 'custom');

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
    }
  };

  return (
    <div id={id} className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        
        {/* Left controls: Date Period & Custom Date Range Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Period Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Date Range</label>
            <div className="relative flex items-center">
              <CalendarIcon className="absolute left-3 h-4 w-4 text-neutral-400 pointer-events-none" />
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white py-1.5 pr-8 pl-9 text-sm text-neutral-900 font-medium outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer hover:bg-neutral-50 transition"
              >
                {DATE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                <option value="custom">Custom Range...</option>
              </select>
            </div>
          </div>

          {/* Custom Date Picker Inputs */}
          {(showCustomInputs || selectedPreset === 'custom') && (
            <div className="flex items-end gap-2 animate-fade-in">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-semibold text-neutral-400">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate || '2026-07-10'}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-mono text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer"
                />
              </div>
              <span className="mb-2 text-neutral-400 font-medium text-xs">to</span>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-semibold text-neutral-400">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max="2026-07-10"
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-mono text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Chart Granularity Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Time Interval</label>
            <div className="relative flex items-center">
              <BarChart2 className="absolute left-3 h-4 w-4 text-neutral-400 pointer-events-none" />
              <select
                value={chartInterval}
                onChange={(e) => setChartInterval(e.target.value as TimeInterval)}
                className="rounded-lg border border-neutral-200 bg-white py-1.5 pr-8 pl-9 text-sm text-neutral-900 font-medium outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer hover:bg-neutral-50 transition"
              >
                <option value="hourly">Hourly (1 Day)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right controls: Currency selector and dynamic transaction triggers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Settlement Currency Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Display Currency</label>
            <div className="relative flex items-center">
              <Coins className="absolute left-3 h-4 w-4 text-neutral-400 pointer-events-none" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white py-1.5 pr-8 pl-9 text-sm text-neutral-900 font-semibold outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 cursor-pointer hover:bg-neutral-50 transition"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} &middot; {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 h-full pt-5 self-end">
            {/* Live simulator button */}
            <button
              onClick={onAddSimulatedTx}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-850 active:scale-97 transition cursor-pointer"
              title="Add a dynamic simulated payment to see numbers update instantly!"
            >
              <Plus className="h-4 w-4" />
              <span>Simulate Pay</span>
            </button>

            {/* Export CSV button */}
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 active:scale-97 transition cursor-pointer"
              title="Download transaction records as CSV"
            >
              <FileSpreadsheet className="h-4 w-4 text-neutral-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
