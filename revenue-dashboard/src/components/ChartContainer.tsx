import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { formatCurrency } from '../data';
import { LineChart, BarChart3, HelpCircle } from 'lucide-react';

interface ChartContainerProps {
  data: ChartDataPoint[];
  currencyCode: string;
  activeMetric: 'gross' | 'net' | 'count';
  setActiveMetric: (metric: 'gross' | 'net' | 'count') => void;
  id: string;
}

export default function ChartContainer({
  data,
  currencyCode,
  activeMetric,
  setActiveMetric,
  id
}: ChartContainerProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Format currency values for Y-axis
  const formatYAxis = (val: number) => {
    if (activeMetric === 'count') {
      return val.toString();
    }
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return val.toString();
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      const val = dataPoint[activeMetric];
      const formattedVal = activeMetric === 'count'
        ? `${val} payments`
        : formatCurrency(val, currencyCode);

      const utcTime = new Date(dataPoint.timestamp).toUTCString();

      return (
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-md backdrop-blur-sm">
          <p className="text-xs font-semibold text-neutral-500">{label}</p>
          <p className="mt-1 font-mono text-base font-bold text-neutral-900">{formattedVal}</p>
          <div className="mt-1.5 border-t border-neutral-100 pt-1.5">
            <p className="text-[10px] font-mono text-neutral-400">{utcTime}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper for metric titles
  const metricLabels = {
    gross: 'Gross Revenue',
    net: 'Net Revenue',
    count: 'Successful Payments',
  };

  return (
    <div id={id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-4 mb-6">
        {/* Metric Selector Tab */}
        <div className="flex rounded-lg bg-neutral-100 p-1 self-start">
          {(['gross', 'net', 'count'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeMetric === m
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {metricLabels[m]}
            </button>
          ))}
        </div>

        {/* Chart View Configurator */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1 rounded-md border border-neutral-200 p-1 bg-neutral-50">
            <button
              onClick={() => setChartType('area')}
              title="Area Chart"
              className={`rounded p-1 transition-all ${
                chartType === 'area'
                  ? 'bg-white text-neutral-950 border border-neutral-200 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <LineChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className={`rounded p-1 transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-neutral-950 border border-neutral-200 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        {data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 text-sm">
            No transactions found for the selected timeframe.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635bff" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#635bff" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={formatYAxis}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="linear"
                  dataKey={activeMetric}
                  stroke="#635bff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                  activeDot={{ r: 5, stroke: '#635bff', strokeWidth: 1, fill: '#ffffff' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={formatYAxis}
                  dx={-5}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={activeMetric}
                  fill="#635bff"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 font-mono border-t border-neutral-100 pt-4">
        <span className="flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Calculations include captured & refunded payments</span>
        </span>
        <span>
          Time Zone: <span className="font-semibold text-neutral-500">UTC</span>
        </span>
      </div>
    </div>
  );
}
