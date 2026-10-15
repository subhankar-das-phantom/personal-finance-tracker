import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useApi, globalMutate } from "../hooks/useApi";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowLeftRight,
  Settings,
} from "lucide-react";

import Chart from "../components/Chart";
import TransactionList from "../components/TransactionList";
import TransactionForm from "../components/TransactionForm";
import BudgetForm from "../components/BudgetForm";
import WalletSelector from "../components/WalletSelector";
import WalletManagementModal from "../components/WalletManagementModal";
import TransferModal from "../components/TransferModal";
import { AuthContext } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTimeFilter } from "../context/TimeFilterContext";
import { useWallet } from "../context/WalletContext";
import { formatCurrency } from "../utils/currency";
import Button from "../components/common/Button";
import Card from "../components/common/Card";

const HomePage = () => {
  const { token, user } = useContext(AuthContext);
  const { timeFilter, setTimeFilter } = useTimeFilter();
  const {
    activeWalletId,
    activeWallets,
    activeWallet,
    setActiveWalletId,
    summary,
    isManageWalletsOpen,
    setIsManageWalletsOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    refreshAllFinancialData,
  } = useWallet();

  // Dynamic SWR endpoints based on active wallet selection
  const transactionsEndpoint = token
    ? activeWalletId !== "all"
      ? `transactions?walletId=${activeWalletId}`
      : "transactions"
    : null;

  const statsEndpoint = token
    ? activeWalletId !== "all"
      ? `transactions/stats?walletId=${activeWalletId}`
      : "transactions/stats"
    : null;

  const chartEndpoint = token
    ? activeWalletId !== "all"
      ? `transactions/chart-data?walletId=${activeWalletId}`
      : "transactions/chart-data"
    : null;

  const {
    data: allTransactionsRaw,
    isLoading: isLoadingTransactions,
    mutate: mutateTransactions,
    isValidating: isValidatingTransactions,
  } = useApi(transactionsEndpoint);

  const {
    data: statsRaw,
    isLoading: isLoadingStats,
    isValidating: isValidatingStats,
  } = useApi(statsEndpoint);

  const {
    data: chartDataRaw,
    isLoading: isLoadingChart,
    isValidating: isValidatingChart,
  } = useApi(chartEndpoint);

  const allTransactions = Array.isArray(
    allTransactionsRaw?.transactions || allTransactionsRaw
  )
    ? allTransactionsRaw?.transactions || allTransactionsRaw
    : [];

  const recentTransactions = allTransactions.slice(0, 5);

  const stats = statsRaw || {
    totalIncomeAllTime: 0,
    totalExpensesAllTime: 0,
    netBalanceAllTime: 0,
    transactionCount: 0,
    openingBalance: 0,
    transfersIn: 0,
    transfersOut: 0,
    currentMonth: { income: 0, expenses: 0, netBalance: 0 },
    previousMonth: { income: 0, expenses: 0, netBalance: 0 },
  };

  const chartData = chartDataRaw || [];

  const isLoading = isLoadingTransactions || isLoadingStats || isLoadingChart;
  const isRefreshing =
    isValidatingTransactions || isValidatingStats || isValidatingChart;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetGoal, setEditingBudgetGoal] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  // Notification helper
  const showNotification = (message, type = "info") => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
        ? "bg-red-500 text-white"
        : type === "warning"
        ? "bg-yellow-500 text-black"
        : "bg-blue-500 text-white"
    }`;

    notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        ${
          type === "success"
            ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
            : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>'
        }
      </svg>
      <span>${message}</span>
    </div>
  `;

    document.body.appendChild(notification);
    setTimeout(() => (notification.style.transform = "translateX(0)"), 10);
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  };

  // Helper to calculate percentage change
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) {
      if (current === 0) return "0%";
      return current > 0 ? "New!" : "New!";
    }

    const change = ((current - previous) / previous) * 100;
    return Math.abs(change) >= 1000
      ? change > 0
        ? "+999%+"
        : "-999%+"
      : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
  };

  const incomeChange =
    stats.currentMonth && stats.previousMonth
      ? calculatePercentageChange(
          stats.currentMonth.income,
          stats.previousMonth.income
        )
      : "N/A";

  const expensesChange =
    stats.currentMonth && stats.previousMonth
      ? calculatePercentageChange(
          stats.currentMonth.expenses,
          stats.previousMonth.expenses
        )
      : "N/A";

  const netBalanceChange =
    stats.currentMonth && stats.previousMonth
      ? calculatePercentageChange(
          stats.currentMonth.netBalance,
          stats.previousMonth.netBalance
        )
      : "N/A";

  // Refresh data
  const refreshData = async () => {
    refreshAllFinancialData();
  };

  // Handle form submission
  const handleAddTransaction = async (transactionData) => {
    try {
      if (editTransaction) {
        await api.put(`transactions/${editTransaction._id}`, transactionData);
        setEditTransaction(null);
      } else {
        await api.post("transactions", transactionData);
      }

      setShowAddForm(false);
      refreshData();
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction) => {
    setEditTransaction(transaction);
    setShowAddForm(true);
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`transactions/${id}`);
      refreshData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  // Calculate filtered stats based on time filter
  const getFilteredStats = () => {
    const now = new Date();
    let filteredTransactions = allTransactions;

    switch (timeFilter) {
      case "thisWeek": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTransactions = allTransactions.filter((t) => {
          const date = new Date(t.date);
          return date >= weekAgo && date <= now;
        });
        break;
      }
      case "thisMonth": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredTransactions = allTransactions.filter((t) => {
          const date = new Date(t.date);
          return date >= monthStart && date <= now;
        });
        break;
      }
      case "thisYear": {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filteredTransactions = allTransactions.filter((t) => {
          const date = new Date(t.date);
          return date >= yearStart && date <= now;
        });
        break;
      }
      default:
        break;
    }

    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      income,
      expenses,
      // For all-time, accurately respect server calculated balance (including opening balance and transfers)
      netBalance:
        timeFilter === "all" ? stats.netBalanceAllTime : income - expenses,
      count: filteredTransactions.length,
    };
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const filteredStats = getFilteredStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeWallet
                  ? `Viewing wallet: ${activeWallet.name}`
                  : "Combined overview across all personal wallets"}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Wallet Selector */}
              <WalletSelector />

              {/* Time Filter */}
              <label htmlFor="time-filter" className="sr-only">
                Time Filter
              </label>
              <select
                id="time-filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                aria-label="Filter transactions by time period"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="thisYear">This Year</option>
                <option value="all">All Time</option>
              </select>

              {/* Refresh Button */}
              <Button
                variant="secondary"
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 rounded-xl"
                aria-label="Refresh data"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>

              {/* Transfer Funds Button */}
              <Button
                variant="secondary"
                onClick={() => setIsTransferModalOpen(true)}
                icon={ArrowLeftRight}
                className="rounded-xl text-sm font-semibold"
              >
                <span className="hidden sm:inline">Transfer</span>
              </Button>

              {/* Add Transaction Button */}
              <Button
                onClick={() => {
                  setEditTransaction(null);
                  setShowAddForm(true);
                }}
                icon={Plus}
                className="rounded-xl text-sm font-semibold"
              >
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </motion.div>

          {/* Quick Wallets Bar (if multiple active wallets exist) */}
          {activeWallets.length > 1 && (
            <motion.div
              variants={itemVariants}
              className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                type="button"
                onClick={() => setActiveWalletId("all")}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  activeWalletId === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span>🌐 All Wallets</span>
                <span className="opacity-90 font-bold">
                  {formatCurrency(summary.totalBalance)}
                </span>
              </button>

              {activeWallets.map((w) => {
                const isSelected = activeWalletId === w._id;
                return (
                  <button
                    key={w._id}
                    type="button"
                    onClick={() => setActiveWalletId(w._id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-blue-600 shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{w.name}</span>
                    <span
                      className={`font-bold ${
                        isSelected
                          ? "text-white"
                          : w.balance >= 0
                          ? "text-gray-900 dark:text-white"
                          : "text-red-500"
                      }`}
                    >
                      {formatCurrency(w.balance, { code: w.currency })}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsManageWalletsOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 whitespace-nowrap"
                title="Manage wallets"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage</span>
              </button>
            </motion.div>
          )}

          {/* Stats Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          >
            <StatsCard
              title="Total Income"
              value={filteredStats.income}
              icon={TrendingUp}
              color="green"
              change={incomeChange}
            />
            <StatsCard
              title="Total Expenses"
              value={filteredStats.expenses}
              icon={TrendingDown}
              color="red"
              change={expensesChange}
            />
            <StatsCard
              title={
                activeWallet
                  ? `${activeWallet.name} Balance`
                  : "Combined Net Balance"
              }
              value={filteredStats.netBalance}
              icon={Wallet}
              color={filteredStats.netBalance >= 0 ? "green" : "red"}
              change={netBalanceChange}
            />
            <StatsCard
              title="Transactions"
              value={filteredStats.count}
              icon={BarChart3}
              color="blue"
              change={`${filteredStats.count} in scope`}
              isCount={true}
            />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart Section */}
            <motion.div variants={itemVariants}>
              <Chart data={chartData} title="Expense Categories" />
            </motion.div>

            {/* Recent Transactions */}
            <motion.div variants={itemVariants}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Recent Transactions
                  </h3>
                  <button
                    onClick={() => navigate("/transactions")}
                    className="text-sm font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p>No transactions found for this scope.</p>
                  </div>
                ) : (
                  <TransactionList
                    transactions={recentTransactions}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    showHeader={false}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Add/Edit Transaction Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowAddForm(false);
                setEditTransaction(null);
              }}
            >
              <div
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <TransactionForm
                  transaction={editTransaction}
                  onSubmit={handleAddTransaction}
                  onClose={() => {
                    setShowAddForm(false);
                    setEditTransaction(null);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Wallet Modals */}
        <WalletManagementModal
          isOpen={isManageWalletsOpen}
          onClose={() => setIsManageWalletsOpen(false)}
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
        />
      </div>
    </div>
  );
};

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  change,
  isCount = false,
}) => {
  const { currency } = useCurrency();

  const colorClasses = {
    green:
      "from-emerald-500 to-teal-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-600 dark:text-white",
    red: "from-red-500 to-rose-600 text-red-700 bg-red-50 dark:bg-red-600 dark:text-white",
    blue: "from-blue-500 to-cyan-600 text-blue-700 bg-blue-50 dark:bg-blue-600 dark:text-white",
  };

  const formatValue = (val) => {
    if (isCount) return val.toLocaleString();
    return formatCurrency(val, currency.locale, currency.code);
  };

  return (
    <Card whileHover={{ y: -4 }} className="p-3.5 sm:p-5 lg:p-6 transition-all duration-200">
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div
          className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${
            colorClasses[color].split(" ")[0]
          } ${colorClasses[color].split(" ")[1]}`}
        >
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
        <div
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium truncate max-w-[85px] sm:max-w-none ${
            colorClasses[color].split(" ")[2]
          } ${colorClasses[color].split(" ")[3]} ${
            colorClasses[color].split(" ")[4]
          } ${colorClasses[color].split(" ")[5] || ""} ${
            colorClasses[color].split(" ")[6] || ""
          }`}
        >
          {change}
        </div>
      </div>

      <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">
        {title}
      </h3>
      <p className="text-sm sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
        {formatValue(value)}
      </p>
    </Card>
  );
};

export default HomePage;
