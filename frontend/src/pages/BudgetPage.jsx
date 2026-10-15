import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  Coins, 
  Calendar,
  PieChart,
  ArrowUp,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Clock,
  ShieldCheck,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BudgetForm from '../components/BudgetForm';
import BudgetList from '../components/BudgetList';
import BudgetProgress from '../components/BudgetProgress';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTimeFilter } from '../context/TimeFilterContext';
import { formatCurrency } from '../utils/currency';
import Button from '../components/common/Button';

const BudgetPage = () => {
  const { token } = useContext(AuthContext);
  const { currency } = useCurrency();
  const { timeFilter } = useTimeFilter();
  const navigate = useNavigate();

  const { data: budgetGoalsRaw, isLoading: isGoalsLoading, mutate: mutateGoals, isValidating: isGoalsValidating } = useApi(token ? '/budget' : null);
  const { data: budgetProgressRaw, isLoading: isProgressLoading, mutate: mutateProgress, isValidating: isProgressValidating } = useApi(token ? '/budget/progress' : null, { refreshInterval: 30000 });

  const budgetGoals = budgetGoalsRaw || [];
  const budgetProgress = budgetProgressRaw || null;
  const isLoading = isGoalsLoading || isProgressLoading;
  const isRefreshing = isGoalsValidating || isProgressValidating;

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const refreshData = () => {
    mutateGoals();
    mutateProgress();
  };

  const handleSubmit = async (budgetData) => {
    try {
      if (editingGoal) {
        await api.put(`/budget/${editingGoal._id}`, budgetData);
        setSuccessMessage('Budget goal updated successfully!');
      } else {
        await api.post('/budget', budgetData);
        setSuccessMessage('Budget goal created successfully!');
      }
      
      refreshData();
      
      setShowForm(false);
      setEditingGoal(null);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving budget goal:', err);
      setError(err.response?.data?.message || 'Failed to save budget goal');
      setTimeout(() => setError(null), 5000);
      throw err;
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this budget goal?')) {
      return;
    }
    
    try {
      await api.delete(`/budget/${goalId}`);
      setSuccessMessage('Budget goal deleted successfully!');
      refreshData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting budget goal:', err);
      setError('Failed to delete budget goal');
      setTimeout(() => setError(null), 5000);
    }
  };

  const stats = budgetProgress?.summary || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentageUsed: 0,
    categoriesCount: 0
  };

  // Fiscal Quarter and Date formatting
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const currentMonth = today.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthIdx = today.getMonth();
  const currentYear = today.getFullYear();
  const fiscalQuarter = currentMonthIdx >= 3 && currentMonthIdx <= 5 ? 'Q1' :
                        currentMonthIdx >= 6 && currentMonthIdx <= 8 ? 'Q2' :
                        currentMonthIdx >= 9 && currentMonthIdx <= 11 ? 'Q3' : 'Q4';
  const fyYear = currentMonthIdx >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 dark:text-slate-100"
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Hero Card - Obsidian billing reference style */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
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
                Live Budgeting
              </div>

              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-zinc-400 transition-colors"
                title="Refresh budget metrics"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Middle row: Title & Primary Action Button (+ New Budget Goal matching screenshot) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Budget Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Track monthly spending limits, monitor category pacing and prevent overruns for {currentMonth}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all duration-150 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Budget Goal</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Success / Error Alerts */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium"
            >
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200 dark:border-white/[0.07]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            
            {/* 4-Card Metric Grid - Obsidian Fintech Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Card 1: Total Budget */}
              <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                      Total Allocated
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-500 flex-shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white truncate">
                    {formatCurrency(stats.totalBudget, currency.locale, currency.code)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Monthly spending cap
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono bg-blue-500/10 text-blue-500 border-blue-500/20 flex-shrink-0">
                    Total Cap
                  </span>
                </div>
              </div>

              {/* Card 2: Total Spent */}
              <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                      Actual Outflow
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white truncate">
                    {formatCurrency(stats.totalSpent, currency.locale, currency.code)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {stats.overallPercentageUsed.toFixed(1)}% consumed
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono flex-shrink-0 ${
                    stats.totalSpent > stats.totalBudget
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {stats.totalSpent > stats.totalBudget ? 'Exceeded' : 'On Track'}
                  </span>
                </div>
              </div>

              {/* Card 3: Remaining */}
              <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                      Remaining Cap
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight truncate ${
                    stats.totalRemaining < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                  }`}>
                    {formatCurrency(Math.abs(stats.totalRemaining), currency.locale, currency.code)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {stats.totalRemaining >= 0 ? 'Available surplus' : 'Exceeded budget'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono flex-shrink-0 ${
                    stats.totalRemaining >= 0
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {stats.totalRemaining >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
              </div>

              {/* Card 4: Categories */}
              <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
                      Monitored Categories
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-purple-500 flex-shrink-0">
                      <PieChart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="font-mono font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white truncate">
                    {stats.categoriesCount}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    Active monthly targets
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono bg-purple-500/10 text-purple-500 border-purple-500/20 flex-shrink-0">
                    {stats.categoriesCount} Set
                  </span>
                </div>
              </div>
            </div>

            {/* Split Section: Budget Progress vs Goals List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              
              {/* Left Column: Real-time Category Progress Bars */}
              <div>
                {budgetProgress && budgetProgress.budgetProgress.length > 0 ? (
                  <BudgetProgress progress={budgetProgress} />
                ) : (
                  <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-8 text-center shadow-xl shadow-black/5 dark:shadow-black/30">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="text-slate-800 dark:text-zinc-200 text-base font-bold">
                      No budget progress yet
                    </p>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1 max-w-xs mx-auto">
                      Create your first category budget cap to activate live spending pace tracking.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Goal Management Card */}
              <div>
                <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                        <Target className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Budget Targets</h3>
                    </div>
                    <button
                      onClick={() => {
                        setEditingGoal(null);
                        setShowForm(true);
                      }}
                      className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Target
                    </button>
                  </div>

                  {budgetGoals.length > 0 ? (
                    <BudgetList 
                      goals={budgetGoals} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 mx-auto mb-3">
                        <Target className="h-6 w-6" />
                      </div>
                      <p className="text-slate-800 dark:text-zinc-200 text-sm font-semibold">
                        No targets defined
                      </p>
                      <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
                        Click "+ Budget Goal" to create limits for Dining, Shopping, Bills & more.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog for Budget Form (Stable, Jitter-Free) */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed inset-0 bg-black/70"
              onClick={() => {
                setShowForm(false);
                setEditingGoal(null);
              }}
            />
            {/* Centering Wrapper */}
            <div className="min-h-full flex items-center justify-center p-4 sm:p-6 relative pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full max-w-md pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <BudgetForm
                  onClose={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                  }}
                  onSubmit={handleSubmit}
                  goal={editingGoal}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BudgetPage;
