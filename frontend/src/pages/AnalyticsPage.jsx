import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Scale, Calendar, Sparkles, Filter, LineChart as LineIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import BudgetList from '../components/BudgetList';
import BudgetProgress from '../components/BudgetProgress';
import BudgetForm from '../components/BudgetForm';
import { getBudgets, getBudgetProgress, addBudget, updateBudget, deleteBudget } from '../services/budgetService';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7', '#84CC16'];

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('6m');
  const [chartType, setChartType] = useState('bar');
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        const [analytics, budgets, progress] = await Promise.all([
          api.get('transactions/analytics'),
          getBudgets(),
          getBudgetProgress(),
        ]);
        setAnalyticsData(analytics.data);
        setBudgetGoals(budgets);
        setBudgetProgress(progress);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [token, navigate]);

  const handleAddBudget = () => {
    setEditingGoal(null);
    setIsBudgetFormOpen(true);
  };

  const handleEditBudget = (goal) => {
    setEditingGoal(goal);
    setIsBudgetFormOpen(true);
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      setBudgetGoals(budgetGoals.filter(goal => goal._id !== id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleBudgetFormSubmit = async (budgetData) => {
    try {
      if (editingGoal) {
        const updatedGoal = await updateBudget(editingGoal._id, budgetData);
        setBudgetGoals(budgetGoals.map(goal => goal._id === editingGoal._id ? updatedGoal : goal));
      } else {
        const newGoal = await addBudget(budgetData);
        setBudgetGoals([...budgetGoals, newGoal]);
      }
      setIsBudgetFormOpen(false);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: { y: 0, opacity: 1 },
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 pt-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="h-96 lg:col-span-3 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700" />
              <div className="h-96 lg:col-span-2 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-gray-200 dark:border-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-6 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">No analytics yet</h1>
        <p className="text-gray-600 dark:text-gray-400">Add transactions to see insights.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const insights = analyticsData.insights || [];

  const chartControls = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {['3m', '6m', '12m'].map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              timeframe === tf
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {[
          { key: 'bar', label: 'Bars' },
          { key: 'area', label: 'Area' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setChartType(opt.key)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              chartType === opt.key
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Financial Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" /> Intelligent insights based on your recent activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              {chartControls}
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-5 w-5 mr-2" /> Back
              </button>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard icon={TrendingUp} title="This Month Income" value={periods.thisMonth.income} tone="success" />
            <AnalyticsCard icon={TrendingDown} title="This Month Expenses" value={periods.thisMonth.expense} tone="danger" />
            <AnalyticsCard icon={Scale} title="This Month Net" value={periods.thisMonth.netBalance} tone={periods.thisMonth.netBalance >= 0 ? 'brand' : 'danger'} />
            <AnalyticsCard icon={Calendar} title="This Year Net" value={periods.thisYear.netBalance} tone={periods.thisYear.netBalance >= 0 ? 'brand' : 'danger'} />
          </motion.div>

          {/* Budget Section */}
          <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Budget Goals</h3>
              <button
                onClick={handleAddBudget}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Add Budget
              </button>
            </div>
            {isBudgetFormOpen && (
              <BudgetForm
                onClose={() => setIsBudgetFormOpen(false)}
                onSubmit={handleBudgetFormSubmit}
                goal={editingGoal}
              />
            )}
            <BudgetList goals={budgetGoals} onEdit={handleEditBudget} onDelete={handleDeleteBudget} />
          </motion.div>

          {/* Budget Progress */}
          <motion.div variants={itemVariants}>
            <BudgetProgress progress={budgetProgress} />
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Trend Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Monthly Trends</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Filter className="h-4 w-4" /> Last {timeframe.toUpperCase()}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'bar' ? (
                  <BarChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.4} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17,24,39,0.9)', 
                        border: '1px solid rgba(148,163,184,0.3)', 
                        borderRadius: 12,
                        color: '#FFFFFF'
                      }} 
                      labelStyle={{ color: '#E5E7EB' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="url(#incomeGrad)" radius={[6,6,0,0]} />
                    <Bar dataKey="expense" name="Expenses" fill="url(#expenseGrad)" radius={[6,6,0,0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17,24,39,0.9)', 
                        border: '1px solid rgba(148,163,184,0.3)', 
                        borderRadius: 12,
                        color: '#FFFFFF'
                      }} 
                      labelStyle={{ color: '#E5E7EB' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="netBalance" name="Net Balance" stroke="#6366F1" fill="url(#netGrad)" strokeWidth={2} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </motion.div>

            {/* Pie Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Top 5 Expense Categories</h3>
                <LineIcon className="h-5 w-5 text-indigo-500" />
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={topExpenseCategories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    cornerRadius={6}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {topExpenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17,24,39,0.9)', 
                      border: '1px solid rgba(148,163,184,0.3)', 
                      borderRadius: 12,
                      color: '#FFFFFF'
                    }} 
                    labelStyle={{ color: '#E5E7EB' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Insights and Period Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Key Financial Insights</h3>
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <ul className="space-y-3">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mt-1 mr-2">✓</span>
                    <p className="text-gray-700 dark:text-gray-300">{insight}</p>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Period Comparison</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PeriodStat title="All Time" period={periods.allTime} />
                <PeriodStat title="This Year" period={periods.thisYear} />
                <PeriodStat title="This Month" period={periods.thisMonth} />
                <PeriodStat title="Last Month" period={periods.lastMonth} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const AnalyticsCard = ({ icon: Icon, title, value, tone = 'brand' }) => {
  const toneMap = {
    brand: { bg: 'from-indigo-500 to-purple-600', text: 'text-indigo-600', chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
    success: { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
    danger: { bg: 'from-rose-500 to-red-600', text: 'text-rose-600', chip: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' },
  }[tone];

  return (
    <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${toneMap.bg}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${toneMap.chip}`}>{title}</span>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{formatCurrency(value)}</p>
    </motion.div>
  );
};

const PeriodStat = ({ title, period }) => {
  const { income = 0, expense = 0, netBalance = 0 } = period || {};
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
      <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Income</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(income)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400">Expense</span>
          <span className="font-semibold text-rose-600">{formatCurrency(expense)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Net</span>
          <span className={`font-extrabold ${netBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>{formatCurrency(netBalance)}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
