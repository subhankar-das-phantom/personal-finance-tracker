import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const Chart = ({ data = [], trendData = [], title = 'Sales & Expense Breakdown' }) => {
  const { currency } = useCurrency();
  const [viewMode, setViewMode] = useState('categories'); // 'categories' | 'trend'

  // Curated modern fintech palette (electric blue, emerald, amber, rose, violet, cyan)
  const COLORS = [
    '#3b82f6', // Electric Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Rose
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ];

  // Derive trend series from category data if explicit trendData isn't provided
  const activeTrendData = trendData.length > 0 ? trendData : data.map((item, idx) => ({
    name: item.name || item.category || `Period ${idx + 1}`,
    amount: item.value || 0,
  }));

  const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.value) || 0), 0);

  // Modern Obsidian Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-[#0c101a]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/10 shadow-2xl">
          <p className="text-xs font-medium text-zinc-400 mb-0.5">{item.name || item.payload?.name}</p>
          <p className="text-sm font-bold font-mono text-white tracking-tight">
            {formatCurrency(item.value, currency.locale, currency.code)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 transition-all duration-200">
      {/* Header with Icon, Title, and Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#161c2b] border border-blue-200/60 dark:border-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-2xs">
            {viewMode === 'trend' ? <TrendingUp className="w-4 h-4" /> : <PieIcon className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {viewMode === 'trend' ? 'Inflow & outflow volume over time' : 'Category distribution and volume'}
            </p>
          </div>
        </div>

        {/* Segmented Control (Matching Reference Screenshot) */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200/70 dark:border-white/5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
              viewMode === 'categories'
                ? 'bg-white dark:bg-[#1a2233] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setViewMode('trend')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
              viewMode === 'trend'
                ? 'bg-white dark:bg-[#1a2233] text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-white/10'
                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Trend
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {data.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
          <PieIcon className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-xs">No transaction data available for this range</p>
        </div>
      ) : viewMode === 'trend' ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activeTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} opacity={0.6} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={600}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="transparent"
                      className="transition-opacity duration-150 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Micro Legend & Category Pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
            {data.slice(0, 6).map((item, index) => (
              <div
                key={`cat-${index}`}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#141b29] border border-slate-200/60 dark:border-white/5 text-xs"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-slate-700 dark:text-zinc-300 font-medium truncate max-w-[90px]">
                  {item.name || item.category}
                </span>
                <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                  {formatCurrency(item.value, currency.locale, currency.code)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Total Metric Pill */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
        <span>Total Analyzed</span>
        <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
          {formatCurrency(totalAmount, currency.locale, currency.code)}
        </span>
      </div>
    </div>
  );
};

export default Chart;