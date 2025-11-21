import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  PieChart,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Coins
} from 'lucide-react';
import BudgetForm from '../components/BudgetForm';
import BudgetList from '../components/BudgetList';
import BudgetProgress from '../components/BudgetProgress';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const BudgetPage = () => {
  const [budgetGoals, setBudgetGoals] = useState([]);
  const [budgetProgress, setBudgetProgress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { token } = useContext(AuthContext);
  const { currency } = useCurrency();

  const fetchBudgetGoals = useCallback(async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await api.get('/budget');
      setBudgetGoals(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching budget goals:', err);
      setError('Failed to load budget goals');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchBudgetProgress = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get('/budget/progress');
      setBudgetProgress(response.data);
    } catch (err) {
      console.error('Error fetching budget progress:', err);
    }
  }, [token]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchBudgetGoals(),
        fetchBudgetProgress()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBudgetGoals, fetchBudgetProgress]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBudgetProgress();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBudgetProgress]);

  useEffect(() => {
    const handleTransactionChange = () => {
      console.log('Transaction changed, refreshing budget progress...');
      fetchBudgetProgress();
    };

    window.addEventListener('transactionCreated', handleTransactionChange);
    window.addEventListener('transactionUpdated', handleTransactionChange);
    window.addEventListener('transactionDeleted', handleTransactionChange);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionChange);
      window.removeEventListener('transactionUpdated', handleTransactionChange);
      window.removeEventListener('transactionDeleted', handleTransactionChange);
    };
  }, [fetchBudgetProgress]);

  const handleSubmit = async (budgetData) => {
    try {
      if (editingGoal) {
        await api.put(`/budget/${editingGoal._id}`, budgetData);
        setSuccessMessage('Budget goal updated successfully!');
      } else {
        await api.post('/budget', budgetData);
        setSuccessMessage('Budget goal created successfully!');
      }
      
      await refreshData();
      
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
      
      await refreshData();
      
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

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                Budget Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {currentMonth}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                New Budget Goal
              </motion.button>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-800 dark:text-green-200"
            >
              <Sparkles className="h-5 w-5" />
              <span>{successMessage}</span>
            </motion.div>
          )}
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-800 dark:text-red-200"
            >
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-green-600" />
            </motion.div>
          </div>
        )}

        {!isLoading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Coins className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Total Budget</span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {formatCurrency(stats.totalBudget, currency.locale, currency.code)}
                </p>
                <p className="text-sm opacity-75">Allocated this month</p>
              </div>

              <div className={`rounded-2xl shadow-lg p-6 text-white ${
                stats.totalSpent > stats.totalBudget
                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Total Spent</span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {formatCurrency(stats.totalSpent, currency.locale, currency.code)}
                </p>
                <p className="text-sm opacity-75">
                  {stats.overallPercentageUsed.toFixed(1)}% of budget
                </p>
              </div>

              <div className={`rounded-2xl shadow-lg p-6 text-white ${
                stats.totalRemaining >= 0
                  ? 'bg-gradient-to-br from-green-500 to-green-600'
                  : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <ArrowUp className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Remaining</span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {formatCurrency(Math.abs(stats.totalRemaining), currency.locale, currency.code)}
                </p>
                <p className="text-sm opacity-75">
                  {stats.totalRemaining >= 0 ? 'Still available' : 'Over budget'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <PieChart className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium opacity-90">Categories</span>
                </div>
                <p className="text-3xl font-bold mb-1">
                  {stats.categoriesCount}
                </p>
                <p className="text-sm opacity-75">Budget goals set</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div variants={itemVariants}>
                {budgetProgress && budgetProgress.budgetProgress.length > 0 ? (
                  <BudgetProgress progress={budgetProgress} />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                      No budget progress yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                      Create your first budget goal to start tracking
                    </p>
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
                    <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    Your Budget Goals
                  </h3>
                  {budgetGoals.length > 0 ? (
                    <BudgetList 
                      goals={budgetGoals} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                        No budget goals yet
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                        Click "New Budget Goal" to get started
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <BudgetForm
                onClose={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                onSubmit={handleSubmit}
                goal={editingGoal}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BudgetPage;
