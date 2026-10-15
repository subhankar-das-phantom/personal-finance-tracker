import React, { useState, useEffect, useContext, useMemo } from "react";
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
  CreditCard,
} from "lucide-react";

const CATEGORY_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];



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

  const {
    data: budgetProgressRaw,
    isLoading: isLoadingBudgetProgress,
    isValidating: isValidatingBudgetProgress,
    mutate: mutateBudgetProgress,
  } = useApi(token ? "budget/progress" : null, { refreshInterval: 30000 });

  const budgetProgress = budgetProgressRaw || null;

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

  const isLoading =
    isLoadingTransactions ||
    isLoadingStats ||
    isLoadingChart ||
    isLoadingBudgetProgress;
  const isRefreshing =
    isValidatingTransactions ||
    isValidatingStats ||
    isValidatingChart ||
    isValidatingBudgetProgress;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudgetGoal, setEditingBudgetGoal] = useState(null);

  // Prevent background scroll jitter when modal is open
  useEffect(() => {
    if (showAddForm || showBudgetForm) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [showAddForm, showBudgetForm]);

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
    mutateBudgetProgress();
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

  // Filter transactions consistently by timeFilter
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    switch (timeFilter) {
      case "today": {
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        return allTransactions.filter((t) => new Date(t.date) >= startOfToday);
      }
      case "7D":
      case "thisWeek": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return allTransactions.filter((t) => new Date(t.date) >= weekAgo);
      }
      case "30D": {
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );
        return allTransactions.filter((t) => new Date(t.date) >= thirtyDaysAgo);
      }
      case "thisMonth": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return allTransactions.filter((t) => new Date(t.date) >= monthStart);
      }
      case "thisYear": {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return allTransactions.filter((t) => new Date(t.date) >= yearStart);
      }
      case "all":
      default:
        return allTransactions;
    }
  }, [allTransactions, timeFilter]);

  // Aggregate stats based on active scope
  const filteredStats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      income,
      expenses,
      netBalance:
        timeFilter === "all" ? stats.netBalanceAllTime : income - expenses,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions, timeFilter, stats.netBalanceAllTime]);

  // Top Spending Categories Breakdown
  const topCategories = useMemo(() => {
    const expenseTxns = filteredTransactions.filter((t) => t.type === "expense");
    const totalExp = expenseTxns.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0
    );

    const map = {};
    expenseTxns.forEach((t) => {
      const cat = t.category || "General";
      if (!map[cat]) {
        map[cat] = { category: cat, amount: 0, count: 0 };
      }
      map[cat].amount += parseFloat(t.amount || 0);
      map[cat].count += 1;
    });

    const items = Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
      .map((item) => ({
        ...item,
        percentage:
          totalExp > 0 ? ((item.amount / totalExp) * 100).toFixed(1) : "0",
      }));

    return {
      items,
      totalExpenses: totalExp,
    };
  }, [filteredTransactions]);


  // Monthly Budget Health & Pacing
  const budgetHealth = useMemo(() => {
    if (!budgetProgress || !budgetProgress.budgetProgress) {
      return null;
    }
    const goals = budgetProgress.budgetProgress;
    const totalBudget = goals.reduce((sum, g) => sum + (g.budgetAmount || 0), 0);
    const totalSpent = goals.reduce((sum, g) => sum + (g.actualSpent || 0), 0);
    const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const now = new Date();
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(0, lastDayOfMonth - currentDay);
    const monthProgress = (currentDay / lastDayOfMonth) * 100;

    const isOverBudget = totalSpent > totalBudget;
    const isPaceHigh = percentage > monthProgress + 10;

    return {
      goalsCount: goals.length,
      totalBudget,
      totalSpent,
      remaining: Math.max(0, totalBudget - totalSpent),
      percentage,
      daysRemaining,
      monthProgress,
      isOverBudget,
      isPaceHigh,
      goals: goals.slice(0, 2),
    };
  }, [budgetProgress]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "long" });
  }, []);

  const fiscalQuarter = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    let q = "Q3";
    let fy = `FY${year}-${String(year + 1).slice(-2)}`;
    if (month >= 3 && month <= 5) q = "Q1";
    else if (month >= 6 && month <= 8) q = "Q2";
    else if (month >= 9 && month <= 11) q = "Q3";
    else {
      q = "Q4";
      fy = `FY${year - 1}-${String(year).slice(-2)}`;
    }
    return `${q} ${fy}`;
  }, []);

  const timePresets = [
    { id: "today", label: "Today" },
    { id: "7D", label: "7D" },
    { id: "30D", label: "30D" },
    { id: "thisMonth", label: "This Month" },
    { id: "thisYear", label: "This Year" },
    { id: "all", label: "All Time" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-36 bg-slate-200 dark:bg-[#121724] rounded-2xl"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 sm:h-32 bg-slate-200 dark:bg-[#121724] rounded-2xl"
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-slate-200 dark:bg-[#121724] rounded-2xl"></div>
              <div className="h-96 bg-slate-200 dark:bg-[#121724] rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 px-4 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-4.5"
        >
          {/* Dashboard Hero Header Card (Matching Premium Reference Screenshot) */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-4 sm:p-5 shadow-xs"
          >
            {/* Top Row: Date Pill + Live Indicator + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#151c2a] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-zinc-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
                  <span>
                    {currentDateFormatted} • {fiscalQuarter}
                  </span>
                </span>

                <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                {/* Wallet Selector */}
                <WalletSelector />

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-[#151c2a] hover:bg-slate-200 dark:hover:bg-[#1c2538] border border-slate-200/80 dark:border-white/5 transition-colors"
                  aria-label="Refresh data"
                  title="Refresh data"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </button>

                {/* Transfer Funds Button */}
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#151c2a] text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-[#1c2538] border border-slate-200/80 dark:border-white/5 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Transfer</span>
                </button>

                {/* Add Transaction Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditTransaction(null);
                    setShowAddForm(true);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20 transition-all duration-150"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Middle: Title & Greeting */}
            <div className="mb-3.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dashboard
              </h1>
              <p className="text-[11px] sm:text-xs lg:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                Welcome back, {user?.username || "Admin"}.{" "}
                <span className="text-slate-400 dark:text-zinc-500">
                  {activeWallet
                    ? `(Filtering ${activeWallet.name})`
                    : "(All Wallets Overview)"}
                </span>
              </p>
            </div>

            {/* Bottom Row: Segmented Time Filter + Quick Wallets Ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
              {/* Segmented Time Filter */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 space-x-1 overflow-x-auto no-scrollbar max-w-full">
                {timePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setTimeFilter(preset.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                      timeFilter === preset.id
                        ? "bg-white dark:bg-[#1a2233] text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-white/10"
                        : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Quick Wallets Ribbon */}
              {activeWallets.length > 1 && (
                <div
                  className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 no-scrollbar"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveWalletId("all")}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      activeWalletId === "all"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 dark:bg-[#151c2a] text-slate-600 dark:text-zinc-300 border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-[#1a2436]"
                    }`}
                  >
                    <span>🌐 All</span>
                    <span className="font-mono font-bold opacity-90 text-[11px]">
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
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                          isSelected
                            ? "bg-slate-900 dark:bg-[#182030] text-white border-slate-700 dark:border-white/10 shadow-sm"
                            : "bg-slate-50 dark:bg-[#151c2a] text-slate-600 dark:text-zinc-300 border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-[#1a2436]"
                        }`}
                      >
                        <span className="truncate max-w-[100px]">{w.name}</span>
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            isSelected
                              ? "text-white"
                              : w.balance >= 0
                              ? "text-slate-900 dark:text-white"
                              : "text-rose-500"
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
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-zinc-700 hover:border-slate-400 whitespace-nowrap"
                    title="Manage wallets"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Manage</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Stats Cards (4-Card Metric Grid Matching Reference Screenshot) */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5"
          >
            <StatsCard
              title="Total Income"
              value={filteredStats.income}
              icon={TrendingUp}
              color="green"
              change={incomeChange}
              badgeText="Inflow"
            />
            <StatsCard
              title="Total Expenses"
              value={filteredStats.expenses}
              icon={TrendingDown}
              color="red"
              change={expensesChange}
              badgeText="Outflow"
            />
            <StatsCard
              title={
                activeWallet
                  ? `${activeWallet.name} Balance`
                  : "Net Balance"
              }
              value={filteredStats.netBalance}
              icon={Wallet}
              color={filteredStats.netBalance >= 0 ? "green" : "red"}
              change={netBalanceChange}
              badgeText={activeWallet ? activeWallet.currency : "Combined"}
            />
            <StatsCard
              title="Transactions"
              value={filteredStats.count}
              icon={BarChart3}
              color="blue"
              change={timePresets.find((p) => p.id === timeFilter)?.label || "All Time"}
              badgeText={`${filteredStats.count} txns`}
              isCount={true}
            />
          </motion.div>

          {/* Main Content Grid: Chart & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Chart Section */}
            <motion.div variants={itemVariants}>
              <Chart data={chartData} title="Sales & Expense Breakdown" />
            </motion.div>

            {/* Recent Transactions Section */}
            <motion.div variants={itemVariants}>
              <div className="bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 transition-all duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-[#161c2b] border border-blue-200/60 dark:border-white/5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Recent Transactions
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {recentTransactions.length} recorded items in this scope
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/transactions")}
                    className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    View All →
                  </button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-zinc-500 text-xs">
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

          {/* Secondary 2-Column Row: Top Spending Categories + Budget Health */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8"
          >
            {/* 1. Top Spending Categories Card */}
            <div className="bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <PieChart className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Top Categories
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Primary cost centers this period
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    Analytics →
                  </button>
                </div>

                {topCategories.items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
                    <p>No expense data recorded in this period.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {topCategories.items.map((cat, idx) => (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                              }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                              {cat.category}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              ({cat.count})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(cat.amount)}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#161c2b] text-slate-600 dark:text-zinc-400 font-medium">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#161c2b] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${cat.percentage}%`,
                              backgroundColor:
                                CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  Total Outflow
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(topCategories.totalExpenses)}
                </span>
              </div>
            </div>

            {/* 2. Monthly Budget Health & Pacing Card */}
            <div className="bg-white dark:bg-[#10141e] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] p-5 sm:p-6 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.05]">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        Budget Health
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        {currentMonthName} pace & limits
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/budget")}
                    className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    Manage →
                  </button>
                </div>

                {budgetHealth && budgetHealth.goalsCount > 0 ? (
                  <div className="space-y-3.5">
                    {/* Spent vs Budget Gauge */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {formatCurrency(budgetHealth.totalSpent)} spent
                        </span>
                        <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
                          of {formatCurrency(budgetHealth.totalBudget)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-[#161c2b] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            budgetHealth.isOverBudget
                              ? "bg-rose-500"
                              : budgetHealth.isPaceHigh
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(100, budgetHealth.percentage)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span
                          className={`font-semibold ${
                            budgetHealth.isOverBudget
                              ? "text-rose-500"
                              : budgetHealth.isPaceHigh
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {budgetHealth.isOverBudget
                            ? "Over Budget"
                            : budgetHealth.isPaceHigh
                            ? "Pace Warning"
                            : "On Track"}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">
                          {budgetHealth.daysRemaining} days remaining
                        </span>
                      </div>
                    </div>

                    {/* Preview of top budget targets */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
                      {budgetHealth.goals.map((goal) => (
                        <div
                          key={goal.category}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-slate-600 dark:text-zinc-300 truncate font-medium">
                            {goal.category}
                          </span>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(goal.actualSpent)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              / {formatCurrency(goal.budgetAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mx-auto mb-2">
                      <Target className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                      No budget limits configured
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 mb-3 max-w-xs mx-auto">
                      Set monthly category limits to prevent spending leaks.
                    </p>
                    <button
                      onClick={() => navigate("/budget")}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Target</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 text-[11px]">
                  Remaining Allowance
                </span>
                <span
                  className={`font-mono font-bold ${
                    budgetHealth?.isOverBudget
                      ? "text-rose-500"
                      : "text-emerald-500"
                  }`}
                >
                  {budgetHealth
                    ? formatCurrency(budgetHealth.remaining)
                    : "Not configured"}
                </span>
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* Add/Edit Transaction Modal (Stable, Jitter-Free) */}
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="fixed inset-0 bg-black/70"
                onClick={() => {
                  setShowAddForm(false);
                  setEditTransaction(null);
                }}
              />
              {/* Centering Wrapper */}
              <div className="min-h-full flex items-center justify-center p-4 sm:p-6 relative pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="w-full max-w-lg pointer-events-auto shadow-2xl"
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
                </motion.div>
              </div>
            </div>
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

// ============================================
// Premium StatsCard Component (Obsidian Fintech)
// ============================================
const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = "blue",
  change,
  badgeText,
  isCount = false,
}) => {
  const { currency } = useCurrency();

  const formatValue = (val) => {
    if (isCount) return val.toLocaleString();
    return formatCurrency(val, currency.locale, currency.code);
  };

  return (
    <Card
      whileHover={{ y: -2 }}
      className="p-3.5 sm:p-5 transition-all duration-200 bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl flex flex-col justify-between"
    >
      {/* Top: Title on left, Dark Squircle Icon on right */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200/70 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-zinc-300 flex-shrink-0 shadow-2xs">
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      {/* Middle: Prominent Tabular Numeral */}
      <div className="my-1">
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight tabular-nums truncate">
          {formatValue(value)}
        </div>
      </div>

      {/* Bottom: Trend on left, Micro badge on right */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-xs">
        <div className="flex items-center space-x-1 truncate mr-2">
          {change && (
            <span
              className={`font-semibold flex items-center gap-0.5 text-[10px] sm:text-[11px] ${
                color === "green"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : color === "red"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-blue-600 dark:text-cyan-400"
              }`}
            >
              {change.includes("+") && <span>↗</span>}
              {change.includes("-") && <span>↘</span>}
              <span>{change}</span>
            </span>
          )}
        </div>

        {badgeText && (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium bg-slate-100 dark:bg-[#161c2b] text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-white/5 flex-shrink-0">
            {badgeText}
          </span>
        )}
      </div>
    </Card>
  );
};

export default HomePage;
