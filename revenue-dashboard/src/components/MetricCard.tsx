import { motion } from 'motion/react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../data';

interface MetricCardProps {
  title: string;
  value: number;
  currencyCode: string;
  prevValue: number;
  isCount?: boolean;
  tooltip?: string;
  id: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  currencyCode,
  prevValue,
  isCount = false,
  tooltip,
  id,
  isSelected = false,
  onClick
}: MetricCardProps) {
  const percentChange = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  const formattedValue = isCount
    ? new Intl.NumberFormat().format(value)
    : formatCurrency(value, currencyCode);

  return (
    <motion.div
      id={id}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-neutral-900 bg-white shadow-sm ring-1 ring-neutral-900'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500">{title}</span>
        {tooltip && (
          <div className="group relative">
            <span className="cursor-help text-xs text-neutral-400 underline decoration-dotted">info</span>
            <div className="absolute right-0 bottom-full mb-2 hidden w-48 rounded bg-neutral-900 p-2 text-xs text-white group-hover:block z-10 shadow-lg">
              {tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tracking-tight text-neutral-900">
          {formattedValue}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {prevValue === 0 ? (
          <div className="flex items-center gap-1 text-neutral-400">
            <Minus className="h-3 w-3" />
            <span>No previous data</span>
          </div>
        ) : (
          <>
            <span
              className={`flex items-center font-medium gap-0.5 rounded-full px-1.5 py-0.5 ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : isNegative
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : isNegative ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {Math.abs(percentChange).toFixed(1)}%
            </span>
            <span className="text-neutral-500">vs previous period</span>
          </>
        )}
      </div>

      {/* Stripe-like indicator line for selected state */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-neutral-900" />
      )}
    </motion.div>
  );
}
