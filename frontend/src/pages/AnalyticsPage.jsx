import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Scale, Calendar, Sparkles, Filter, PieChart as PieIcon,
  BarChart3, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTimeFilter } from '../context/TimeFilterContext';
import { formatCurrency } from '../utils/currency';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import WalletSelector from '../components/WalletSelector';
import WalletManagementModal from '../components/WalletManagementModal';
import TransferModal from '../components/TransferModal';
import { useWallet } from '../context/WalletContext';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

const CustomChartTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-2xl text-xs text-white backdrop-blur-md">
        <p className="font-semibold text-slate-300 mb-1.5 pb-1 border-b border-white/10">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(entry.value, currency.locale, currency.code)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload, currency }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#0e131f] border border-white/10 rounded-xl p-3 shadow-2xl text-xs text-white backdrop-blur-md">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.fill || data.color }} />
          <span className="font-semibold text-slate-200">{data.name}</span>
        </div>
        <div className="font-mono font-bold text-base text-white">
          {formatCurrency(data.value, currency.locale, currency.code)}
        </div>
      </div>
    );
  }
  return null;
};

const AnalyticsPage = () => {
  const { token } = useContext(AuthContext);
  const { currency } = useCurrency();
  const { timeFilter } = useTimeFilter();
  const {
    activeWalletId,
    isManageWalletsOpen,
    setIsManageWalletsOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    refreshAllFinancialData,
  } = useWallet();

  const analyticsEndpoint = token
    ? activeWalletId && activeWalletId !== 'all'
      ? `transactions/analytics?walletId=${activeWalletId}`
      : 'transactions/analytics'
    : null;

  const { data: analyticsDataRaw, error: analyticsError, isLoading: isAnalyticsLoading } = useApi(analyticsEndpoint);
  const analyticsData = analyticsDataRaw || null;
  const isLoading = isAnalyticsLoading;
  const error = analyticsError ? 'Failed to load analytics. Please try again.' : '';

  const [timeframe, setTimeframe] = useState('6m');
  const [chartType, setChartType] = useState('bar');

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 14, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.25 } },
  };

  const periods = analyticsData?.periods;
  const monthlyTrendsRaw = analyticsData?.monthlyTrends || [];

  const monthlyTrends = useMemo(() => {
    if (!monthlyTrendsRaw?.length) return [];
    const count = timeframe === '3m' ? 3 : timeframe === '12m' ? 12 : 6;
    const data = monthlyTrendsRaw.slice(-count);
    return data.map((d) => ({
      ...d,
      income: Number(d.income || 0),
      expense: Number(d.expense || 0),
      netBalance: Number(d.netBalance || 0),
    }));
  }, [monthlyTrendsRaw, timeframe]);

  const topExpenseCategories = useMemo(() => {
    return (analyticsData?.topExpenseCategories || []).map((c) => ({
      category: c.category,
      amount: Number(c.amount || 0),
      count: c.count || 0,
    }));
  }, [analyticsData]);

  // Dynamic date and fiscal quarter calculation for obsidian hero card
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const currentMonthIdx = today.getMonth();
  const currentYear = today.getFullYear();
  const fiscalQuarter = currentMonthIdx >= 3 && currentMonthIdx <= 5 ? 'Q1' :
                        currentMonthIdx >= 6 && currentMonthIdx <= 8 ? 'Q2' :
                        currentMonthIdx >= 9 && currentMonthIdx <= 11 ? 'Q3' : 'Q4';
  const fyYear = currentMonthIdx >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-44 bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07]" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="h-96 lg:col-span-3 bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07]" />
            <div className="h-96 lg:col-span-2 bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-24 px-6 flex items-center justify-center">
        <div className="bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07] p-8 text-center max-w-md shadow-2xl">
          <p className="text-base font-semibold text-slate-900 dark:text-white mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-24 px-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#10141e] border border-slate-200 dark:border-white/[0.07] flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-blue-500" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">No analytics yet</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">Record some transactions to see visual analytics and financial health reports.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const insights = analyticsData.insights || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 px-4 sm:px-6 lg:px-8 pb-16 font-sans antialiased text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 sm:space-y-8">
          
          {/* Top Hero Card - Obsidian billing reference style */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/40 relative overflow-hidden"
          >
            {/* Top row: Capsule date badge + Live status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/[0.06] text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{formattedDate} • {fiscalQuarter} FY{fyYear}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  icon={ArrowLeft}
                  className="text-xs py-1.5 px-3 border-slate-200 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Dashboard
                </Button>
              </div>
            </div>

            {/* Middle row: Page title & Subtitle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Analytics & Trends
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Deep financial health overview, category allocations and multi-period comparisons
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <WalletSelector />
              </div>
            </div>

            {/* Bottom row: Timeframe and Chart toggles */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#0b0e17] border border-slate-200 dark:border-white/[0.06] text-xs">
                <span className="px-2 text-slate-400 font-medium text-[11px]">Range:</span>
                {[
                  { key: '3m', label: 'Last 3M' },
                  { key: '6m', label: 'Last 6M' },
                  { key: '12m', label: '1 Year' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setTimeframe(item.key)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                      timeframe === item.key
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0b0e17] border border-slate-200 dark:border-white/[0.06] text-xs">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                    chartType === 'bar'
                      ? 'bg-white dark:bg-[#161c2b] text-slate-900 dark:text-white font-semibold shadow-sm border border-slate-200 dark:border-white/10'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Bars Comparison
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                    chartType === 'area'
                      ? 'bg-white dark:bg-[#161c2b] text-slate-900 dark:text-white font-semibold shadow-sm border border-slate-200 dark:border-white/10'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Net Balance Area
                </button>
              </div>
            </div>
          </motion.div>

          {/* 4-Card Metric Grid - Obsidian Fintech Style */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <ObsidianStatCard
              label="This Month Income"
              value={periods.thisMonth.income}
              currency={currency}
              icon={TrendingUp}
              trendLabel="Current cycle inflow"
              badgeText="Revenue"
              badgeTone="emerald"
            />
            <ObsidianStatCard
              label="This Month Expenses"
              value={periods.thisMonth.expense}
              currency={currency}
              icon={TrendingDown}
              trendLabel="Current cycle outflow"
              badgeText="Outflow"
              badgeTone="rose"
            />
            <ObsidianStatCard
              label="This Month Net"
              value={periods.thisMonth.netBalance}
              currency={currency}
              icon={Scale}
              trendLabel={periods.thisMonth.netBalance >= 0 ? "Surplus savings" : "Deficit this month"}
              badgeText={periods.thisMonth.netBalance >= 0 ? "+ Positive" : "- Deficit"}
              badgeTone={periods.thisMonth.netBalance >= 0 ? "emerald" : "rose"}
            />
            <ObsidianStatCard
              label="This Year Net"
              value={periods.thisYear.netBalance}
              currency={currency}
              icon={Calendar}
              trendLabel="Cumulative YTD net"
              badgeText="YTD Total"
              badgeTone="blue"
            />
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Monthly Trend Area / Bar Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-500">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Monthly Cashflow Trend</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">Income vs Expenses over the selected period</p>
                    </div>
                  </div>
                  <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#161c2b] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/5">
                    {timeframe.toUpperCase()} View
                  </div>
                </div>

                <div className="h-[310px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                      <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsIncomeBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                          </linearGradient>
                          <linearGradient id="analyticsExpenseBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#1f293d' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => {
                            if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                            if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                            return val;
                          }}
                        />
                        <Tooltip content={<CustomChartTooltip currency={currency} />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="income" name="Income" fill="url(#analyticsIncomeBar)" radius={[5, 5, 0, 0]} barSize={18} />
                        <Bar dataKey="expense" name="Expenses" fill="url(#analyticsExpenseBar)" radius={[5, 5, 0, 0]} barSize={18} />
                      </BarChart>
                    ) : (
                      <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="analyticsNetArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                        <XAxis
                          dataKey="month"
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={{ stroke: '#1f293d' }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => {
                            if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                            if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(0)}k`;
                            return val;
                          }}
                        />
                        <Tooltip content={<CustomChartTooltip currency={currency} />} />
                        <Area
                          type="monotone"
                          dataKey="netBalance"
                          name="Net Balance"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fill="url(#analyticsNetArea)"
                          dot={{ r: 4, fill: '#3b82f6', stroke: '#080b11', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>

            {/* Category Distribution Pie / Donut */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="h-full bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-purple-500">
                        <PieIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Top 5 Expenses</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Largest cost centers</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-[210px] w-full relative flex items-center justify-center">
                    {topExpenseCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topExpenseCategories}
                            dataKey="amount"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {topExpenseCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip currency={currency} />} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-xs text-slate-400">No category expense records available</div>
                    )}
                  </div>
                </div>

                {/* Categorical List */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  {topExpenseCategories.slice(0, 4).map((item, idx) => (
                    <div key={item.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="text-slate-600 dark:text-zinc-300 truncate font-medium">{item.category}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white ml-2 flex-shrink-0">
                        {formatCurrency(item.amount, currency.locale, currency.code)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Key Insights & Period Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Key Insights Card */}
            <motion.div variants={itemVariants}>
              <div className="h-full bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Automated Intelligence</h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161c2b] text-slate-500 dark:text-zinc-400">
                    {insights.length} Insights
                  </span>
                </div>

                <ul className="space-y-3">
                  {insights.length > 0 ? (
                    insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0b0e17] border border-slate-100 dark:border-white/[0.04]">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-normal">{insight}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-400 py-4 text-center">Maintain consistent records to generate automated spending intelligence.</li>
                  )}
                </ul>
              </div>
            </motion.div>

            {/* Period Comparison Grid */}
            <motion.div variants={itemVariants}>
              <div className="h-full bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Period Performance Breakdown</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <ObsidianPeriodStat title="All Time Cumulative" period={periods.allTime} currency={currency} />
                  <ObsidianPeriodStat title="This Year YTD" period={periods.thisYear} currency={currency} />
                  <ObsidianPeriodStat title="This Month" period={periods.thisMonth} currency={currency} />
                  <ObsidianPeriodStat title="Last Month" period={periods.lastMonth} currency={currency} />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Wallet Management Modal */}
        <WalletManagementModal
          isOpen={isManageWalletsOpen}
          onClose={() => setIsManageWalletsOpen(false)}
        />

        {/* Transfer Modal */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            refreshAllFinancialData();
          }}
        />
      </div>
    </div>
  );
};

// Subcomponent: Obsidian Stat Card
const ObsidianStatCard = ({ label, value, currency, icon: Icon, trendLabel, badgeText, badgeTone = 'blue' }) => {
  const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }[badgeTone] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
            {label}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-zinc-200 flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white truncate">
          {formatCurrency(value, currency.locale, currency.code)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
          {trendLabel}
        </span>
        {badgeText && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono flex-shrink-0 ${badgeStyles}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

// Subcomponent: Obsidian Period Stat
const ObsidianPeriodStat = ({ title, period, currency }) => {
  const { income = 0, expense = 0, netBalance = 0 } = period || {};
  return (
    <div className="rounded-xl border border-slate-100 dark:border-white/[0.06] p-3.5 bg-slate-50/70 dark:bg-[#0b0e17]">
      <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-2">{title}</p>
      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
          <span>Inflow:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(income, currency.locale, currency.code)}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
          <span>Outflow:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(expense, currency.locale, currency.code)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/[0.06]">
          <span className="text-slate-700 dark:text-zinc-300 font-semibold">Net:</span>
          <span className={`font-extrabold ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatCurrency(netBalance, currency.locale, currency.code)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;