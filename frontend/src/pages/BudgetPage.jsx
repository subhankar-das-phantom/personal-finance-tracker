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
  RefreshCw
} from 'lucide-react';
import BudgetForm from '../components/BudgetForm';
import BudgetList from '../components/BudgetList';
import BudgetProgress from '../components/BudgetProgress';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

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

  // Fetch all budget goals
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

  // Fetch budget progress for current month
  const fetchBudgetProgress = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await api.get('/budget/progress');
      setBudgetProgress(response.data);
    } catch (err) {
      console.error('Error fetching budget progress:', err);
    }
  }, [token]);

  // Refresh both goals and progress
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

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 30 seconds to catch new transactions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBudgetProgress(); // Silently refresh progress
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchBudgetProgress]);

  // Listen for custom events from transaction creation/updates
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

  // Handle form submission (create or update)
  const handleSubmit = async (budgetData) => {
    try {
      if (editingGoal) {
        // Update existing goal
        await api.put(`/budget/${editingGoal._id}`, budgetData);
        setSuccessMessage('Budget goal updated successfully!');
      } else {
        // Create new goal
        await api.post('/budget', budgetData);
        setSuccessMessage('Budget goal created successfully!');
      }
      
      // Refresh data
      await refreshData();
      
      // Close form and reset
      setShowForm(false);
      setEditingGoal(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving budget goal:', err);
      setError(err.response?.data?.message || 'Failed to save budget goal');
      setTimeout(() => setError(null), 5000);
      throw err; // Re-throw to let form handle it
    }
  };

  // Handle edit
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this budget goal?')) {
      return;
    }
    
    try {
      await api.delete(`/budget/${goalId}`);
      setSuccessMessage('Budget goal deleted successfully!');
      
      // Refresh data
      await refreshData();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting budget goal:', err);
      setError('Failed to delete budget goal');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Calculate summary stats
  const stats = budgetProgress?.summary || {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentageUsed: 0,
    categoriesCount: 0
  };

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-20 pb-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
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
              {/* Refresh Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </motion.button>

              {/* New Budget Goal Button */}
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

        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 text-green-800 dark:text-green-200"
            >
              <AlertCircle className="h-5 w-5" />
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

        {/* Loading State */}
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

        {/* Main Content */}
        {!isLoading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Budget Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Budget</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalBudget.toFixed(2)}
                </p>
              </motion.div>

              {/* Total Spent Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <ArrowDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalSpent.toFixed(2)}
                </p>
              </motion.div>

              {/* Remaining Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <ArrowUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalRemaining.toFixed(2)}
                </p>
              </motion.div>

              {/* Categories Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <PieChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.categoriesCount}
                </p>
              </motion.div>
            </div>

            {/* Progress and Goals Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Budget Progress */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                {budgetProgress && budgetProgress.budgetProgress.length > 0 ? (
                  <BudgetProgress progress={budgetProgress} />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
                    <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      No budget progress yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                      Create your first budget goal to start tracking
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Budget Goals List */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">
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
                      <p className="text-gray-600 dark:text-gray-400 text-lg">
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
          </>
        )}
      </div>

      {/* Budget Form Modal */}
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
