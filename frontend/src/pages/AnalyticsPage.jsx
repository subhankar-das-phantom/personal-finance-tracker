import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  ArrowLeft, TrendingUp, TrendingDown, Scale, Calendar, Sparkles, Filter, PieChart as PieIcon,
  BarChart3, Activity, ShieldCheck, ArrowUpRight, ArrowDownRight,
  Cpu, Zap, Flame, ShieldAlert, CheckCircle2, AlertTriangle, Gauge, Layers, Compass, RefreshCw, Lightbulb
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

// Smart Financial Health & Advisory Engine
const generateAlgorithmicDiagnostics = (analyticsData, summary, currency) => {
  const periods = analyticsData?.periods || {};
  const monthlyTrends = analyticsData?.monthlyTrends || [];
  const topExpenseCategories = analyticsData?.topExpenseCategories || [];
  const totalBalance = Number(summary?.totalBalance || 0);

  const thisMonth = periods.thisMonth || { income: 0, expense: 0, netBalance: 0, count: 0, savingsRate: 0 };
  const lastMonth = periods.lastMonth || { income: 0, expense: 0, netBalance: 0, count: 0, savingsRate: 0 };

  const today = new Date();
  const currentDay = today.getDate() || 1;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(daysInMonth - currentDay, 1);

  const models = [];

  // Model 1: Savings & Retained Income
  const hasMonthlyActivity = thisMonth.income > 0 || thisMonth.expense > 0;
  const savingsRate = Number(
    thisMonth.savingsRate !== undefined
      ? thisMonth.savingsRate
      : thisMonth.income > 0
      ? ((thisMonth.income - thisMonth.expense) / thisMonth.income) * 100
      : 0
  );

  let srTone = 'optimal';
  let srMetric = '';
  let srTitle = '';
  let srDesc = '';
  let srTip = '';

  if (!hasMonthlyActivity) {
    srTone = 'optimal';
    srMetric = 'No Expenses Yet';
    srTitle = 'Clean Slate This Month';
    srDesc = `No income or expenses have been logged for this month yet. Once you record transactions, your live savings rate and monthly progress will update here.`;
    srTip = 'Add your latest paycheck or daily expenses to start tracking your financial health this month.';
  } else if (thisMonth.income > 0 && thisMonth.expense === 0) {
    srTone = 'optimal';
    srMetric = '100% Retained';
    srTitle = 'All Income Retained';
    srDesc = `You have earned ${formatCurrency(thisMonth.income, currency?.locale, currency?.code)} this month with zero expenses recorded so far. You are keeping 100% of your earnings.`;
    srTip = 'Keep an eye on upcoming bills to preserve as much of this balance as possible.';
  } else if (thisMonth.income === 0 && thisMonth.expense > 0) {
    srTone = 'caution';
    srMetric = `${formatCurrency(thisMonth.expense, currency?.locale, currency?.code)} Spent`;
    srTitle = 'Expenses Without Logged Income';
    srDesc = `You have recorded ${formatCurrency(thisMonth.expense, currency?.locale, currency?.code)} in expenses this month, but no income has been logged yet.`;
    srTip = 'Remember to log your salary or other earnings so your true net savings rate can be calculated.';
  } else if (savingsRate >= 35) {
    srTone = 'optimal';
    srMetric = `+${savingsRate.toFixed(1)}% Saved`;
    srTitle = 'Superb Savings Rate';
    srDesc = `You are saving ${savingsRate.toFixed(1)}% of your income this month (${formatCurrency(thisMonth.netBalance, currency?.locale, currency?.code)} saved). You are well ahead of typical savings benchmarks.`;
    srTip = 'Consider channeling part of this surplus into an emergency fund, high-yield account, or long-term investments.';
  } else if (savingsRate >= 20) {
    srTone = 'optimal';
    srMetric = `+${savingsRate.toFixed(1)}% Saved`;
    srTitle = 'Healthy Savings Rate';
    srDesc = `You are saving ${savingsRate.toFixed(1)}% of your earnings, comfortably meeting the recommended 50/30/20 guideline (20% target).`;
    srTip = 'Maintain your current spending discipline to finish the month with a strong surplus.';
  } else if (savingsRate > 0) {
    srTone = 'caution';
    srMetric = `+${savingsRate.toFixed(1)}% Saved`;
    srTitle = 'Positive but Modest Savings';
    srDesc = `You have saved ${formatCurrency(thisMonth.netBalance, currency?.locale, currency?.code)} (${savingsRate.toFixed(1)}% of income). While you are in the green, margins are modest.`;
    srTip = 'Look over flexible everyday spending to see if you can nudge your savings rate closer to the 20% mark.';
  } else {
    srTone = 'warning';
    srMetric = `-${Math.abs(savingsRate).toFixed(1)}% Deficit`;
    srTitle = 'Spending Exceeds Income';
    srDesc = `Your expenses have exceeded your income by ${formatCurrency(Math.abs(thisMonth.netBalance), currency?.locale, currency?.code)} so far this month.`;
    srTip = 'Pause non-essential purchases for the remainder of the month to bring your cash flow back into balance.';
  }

  models.push({
    id: 'savings',
    badge: 'SAVINGS',
    category: 'Savings Rate',
    tone: srTone,
    title: srTitle,
    metric: srMetric,
    description: srDesc,
    recommendation: srTip,
    domain: 'growth',
  });

  // Model 2: Daily Spending Pace
  const dailyBurn = (thisMonth.expense || 0) / currentDay;
  const projectedMonthExpense = dailyBurn * daysInMonth;
  const projectedMomDelta = lastMonth.expense > 0 ? ((projectedMonthExpense - lastMonth.expense) / lastMonth.expense) * 100 : 0;

  let brTone = 'optimal';
  let brTitle = '';
  let brMetric = '';
  let brDesc = '';
  let brTip = '';

  if (thisMonth.expense === 0) {
    brTone = 'optimal';
    brMetric = `${formatCurrency(0, currency?.locale, currency?.code)} / day`;
    brTitle = 'Zero Expenses Logged';
    brDesc = `You haven't logged any expenses yet through day ${currentDay} of ${daysInMonth}.`;
    brTip = 'As you log everyday purchases, we will project your estimated month-end spending total.';
  } else if (lastMonth.expense > 0 && projectedMomDelta > 20) {
    brTone = 'warning';
    brMetric = `${formatCurrency(dailyBurn, currency?.locale, currency?.code)} / day`;
    brTitle = 'Pacing Higher Than Last Month';
    brDesc = `You're spending an average of ${formatCurrency(dailyBurn, currency?.locale, currency?.code)}/day. At this pace, you're projected to spend ${formatCurrency(projectedMonthExpense, currency?.locale, currency?.code)} by month-end (+${projectedMomDelta.toFixed(1)}% vs last month).`;
    const targetDaily = Math.max((lastMonth.expense - thisMonth.expense) / daysRemaining, 0);
    brTip = `To match last month's spending, aim for roughly ${formatCurrency(targetDaily, currency?.locale, currency?.code)}/day over the remaining ${daysRemaining} days.`;
  } else if (lastMonth.expense > 0 && projectedMomDelta < -10) {
    brTone = 'optimal';
    brMetric = `${formatCurrency(dailyBurn, currency?.locale, currency?.code)} / day`;
    brTitle = 'Lower Spending Than Last Month';
    brDesc = `You're spending an average of ${formatCurrency(dailyBurn, currency?.locale, currency?.code)}/day through day ${currentDay}. At this rate, projected month-end spending is ${formatCurrency(projectedMonthExpense, currency?.locale, currency?.code)} (${Math.abs(projectedMomDelta).toFixed(1)}% below last month).`;
    brTip = 'Great pace! You are spending less and keeping more cash in your wallet.';
  } else {
    brTone = 'optimal';
    brMetric = `${formatCurrency(dailyBurn, currency?.locale, currency?.code)} / day`;
    brTitle = 'Steady Monthly Spending Pace';
    brDesc = `You're averaging ${formatCurrency(dailyBurn, currency?.locale, currency?.code)}/day through day ${currentDay} of ${daysInMonth}. Projected month-end total is approximately ${formatCurrency(projectedMonthExpense, currency?.locale, currency?.code)}.`;
    brTip = 'Your spending pace is consistent and predictable.';
  }

  models.push({
    id: 'spending-pace',
    badge: 'SPENDING PACE',
    category: 'Daily Spending',
    tone: brTone,
    title: brTitle,
    metric: brMetric,
    description: brDesc,
    recommendation: brTip,
    domain: 'velocity',
  });

  // Model 3: Top Spending Categories
  if (topExpenseCategories.length > 0 && thisMonth.expense > 0) {
    const top1 = topExpenseCategories[0];
    const top2 = topExpenseCategories[1];
    const top2Sum = (top1?.amount || 0) + (top2?.amount || 0);
    const concentration = (top2Sum / thisMonth.expense) * 100;
    const isConcentrated = concentration >= 50;

    models.push({
      id: 'categories',
      badge: 'CATEGORIES',
      category: 'Top Categories',
      tone: concentration > 70 ? 'warning' : isConcentrated ? 'caution' : 'optimal',
      title: isConcentrated ? 'High Category Concentration' : 'Well-Balanced Spending',
      metric: `${concentration.toFixed(0)}% in Top ${top2 ? '2 Categories' : 'Category'}`,
      description: isConcentrated
        ? `Over half of this month's expenses are in ${top1.category} (${((top1.amount / thisMonth.expense) * 100).toFixed(0)}%)${top2 ? ` and ${top2.category} (${((top2.amount / thisMonth.expense) * 100).toFixed(0)}%)` : ''}.`
        : `Your spending is evenly distributed across multiple categories, with no single expense area dominating your budget.`,
      recommendation: isConcentrated
        ? `Review your recent ${top1.category} purchases to see if there are subscription costs or discretionary items you can optimize.`
        : `Healthy balance across your lifestyle categories. Keep it up!`,
      domain: 'risk',
    });
  }

  // Model 4: Cash Flow Momentum
  if (lastMonth.income > 0 || lastMonth.expense > 0) {
    const incomeGrowth = lastMonth.income > 0 ? ((thisMonth.income - lastMonth.income) / lastMonth.income) * 100 : (thisMonth.income > 0 ? 100 : 0);
    const expenseGrowth = lastMonth.expense > 0 ? ((thisMonth.expense - lastMonth.expense) / lastMonth.expense) * 100 : 0;
    const marginSpread = incomeGrowth - expenseGrowth;
    const isExpanding = marginSpread >= 0;

    models.push({
      id: 'cash-flow',
      badge: 'CASH FLOW',
      category: 'Cash Flow',
      tone: isExpanding ? 'optimal' : 'caution',
      title: isExpanding ? 'Expanding Cash Flow' : 'Spending Outpaced Income Growth',
      metric: `${isExpanding ? '+' : ''}${marginSpread.toFixed(1)}% Net Margin`,
      description: `Income shifted by ${incomeGrowth >= 0 ? '+' : ''}${incomeGrowth.toFixed(1)}% while spending moved ${expenseGrowth >= 0 ? '+' : ''}${expenseGrowth.toFixed(1)}% compared to last month.`,
      recommendation: isExpanding
        ? 'Your income is growing faster than your spending. A prime opportunity to put the difference toward savings or debt payoff.'
        : 'Spending grew faster than income this month. Keep non-essential purchases in check to restore positive margin growth.',
      domain: 'dynamics',
    });
  }

  // Model 5: Emergency Fund & Cushion (Realistic baseline burn)
  const activeExpenseMonths = monthlyTrends.filter((m) => Number(m.expense || 0) > 0);
  let baselineMonthlyBurn = 0;

  if (thisMonth.expense > 0 && currentDay >= 10) {
    baselineMonthlyBurn = (thisMonth.expense / currentDay) * 30;
  } else if (lastMonth.expense > 0) {
    baselineMonthlyBurn = lastMonth.expense;
  } else if (activeExpenseMonths.length > 0) {
    const totalTrendBurn = activeExpenseMonths.reduce((sum, m) => sum + Number(m.expense || 0), 0);
    baselineMonthlyBurn = totalTrendBurn / activeExpenseMonths.length;
  } else if (periods.allTime?.expense > 0) {
    baselineMonthlyBurn = periods.allTime.expense / Math.max(activeExpenseMonths.length || 1, 1);
  } else if (thisMonth.expense > 0) {
    baselineMonthlyBurn = thisMonth.expense;
  }

  let lrTone = 'optimal';
  let lrTitle = '';
  let lrMetric = '';
  let lrDesc = '';
  let lrTip = '';
  const runwayMonths = baselineMonthlyBurn > 0 ? totalBalance / baselineMonthlyBurn : 0;

  if (baselineMonthlyBurn <= 0) {
    lrTone = totalBalance > 0 ? 'optimal' : 'caution';
    lrTitle = totalBalance > 0 ? 'Available Cash Cushion' : 'No Reserve Funds';
    lrMetric = formatCurrency(totalBalance, currency?.locale, currency?.code);
    lrDesc = totalBalance > 0
      ? `You have ${formatCurrency(totalBalance, currency?.locale, currency?.code)} across your wallets. Once you've logged regular monthly expenses, we'll calculate your exact emergency runway.`
      : `Your wallet balance is currently zero. Prioritize saving an initial cash cushion for unexpected expenses.`;
    lrTip = 'Financial experts recommend keeping 3 to 6 months of basic living expenses in an accessible emergency fund.';
  } else {
    if (runwayMonths >= 24) {
      lrTone = 'optimal';
      lrTitle = '2+ Years Emergency Cushion';
      lrMetric = '24+ Months Buffer';
      lrDesc = `Your total balance of ${formatCurrency(totalBalance, currency?.locale, currency?.code)} provides over 2 years of living expenses at your average historical burn of ${formatCurrency(baselineMonthlyBurn, currency?.locale, currency?.code)}/month.`;
      lrTip = 'You have achieved exceptional financial peace of mind. Any surplus can be comfortably directed toward long-term goals or investments.';
    } else if (runwayMonths >= 6) {
      lrTone = 'optimal';
      lrTitle = `${runwayMonths.toFixed(1)} Months Emergency Cushion`;
      lrMetric = `${runwayMonths.toFixed(1)}x Monthly Buffer`;
      lrDesc = `Your total balance of ${formatCurrency(totalBalance, currency?.locale, currency?.code)} can cover about ${runwayMonths.toFixed(1)} months of expenses at your estimated burn of ${formatCurrency(baselineMonthlyBurn, currency?.locale, currency?.code)}/month.`;
      lrTip = 'You have achieved a solid 6+ month emergency safety net! Extra savings can be directed toward long-term goals or investments.';
    } else if (runwayMonths >= 3) {
      lrTone = 'positive';
      lrTitle = `${runwayMonths.toFixed(1)} Months Emergency Cushion`;
      lrMetric = `${runwayMonths.toFixed(1)}x Monthly Buffer`;
      lrDesc = `Your balance provides approximately ${runwayMonths.toFixed(1)} months of living expenses at ${formatCurrency(baselineMonthlyBurn, currency?.locale, currency?.code)}/month.`;
      lrTip = 'You have a solid 3-month foundation. Working toward 6 months provides even greater peace of mind.';
    } else if (runwayMonths >= 1) {
      lrTone = 'caution';
      lrTitle = `${runwayMonths.toFixed(1)} Months Living Buffer`;
      lrMetric = `${runwayMonths.toFixed(1)}x Monthly Buffer`;
      lrDesc = `Your total balance of ${formatCurrency(totalBalance, currency?.locale, currency?.code)} covers about ${runwayMonths.toFixed(1)} months of typical expenses (${formatCurrency(baselineMonthlyBurn, currency?.locale, currency?.code)}/mo).`;
      lrTip = 'Aim to set aside a little each week to expand your cash cushion to at least 3 full months.';
    } else {
      lrTone = 'warning';
      lrTitle = 'Low Emergency Buffer (< 1 Month)';
      lrMetric = `${runwayMonths.toFixed(1)} mo Reserve`;
      lrDesc = `Your current balance (${formatCurrency(totalBalance, currency?.locale, currency?.code)}) covers less than 1 month of estimated monthly expenses (${formatCurrency(baselineMonthlyBurn, currency?.locale, currency?.code)}/mo).`;
      lrTip = 'Prioritize building an initial 1-month emergency fund before increasing discretionary spending.';
    }
  }

  models.push({
    id: 'emergency-fund',
    badge: 'EMERGENCY FUND',
    category: 'Emergency Cushion',
    tone: lrTone,
    title: lrTitle,
    metric: lrMetric,
    description: lrDesc,
    recommendation: lrTip,
    domain: 'runway',
  });

  // Model 6: Monthly Savings Habit
  const last3Trends = monthlyTrends.slice(-3);
  const positiveMonths = last3Trends.filter((m) => m.netBalance >= 0).length;
  const consistencyScore = last3Trends.length > 0 ? (positiveMonths / last3Trends.length) * 100 : 100;

  models.push({
    id: 'savings-habit',
    badge: 'SAVINGS HABIT',
    category: 'Monthly Habit',
    tone: consistencyScore === 100 ? 'optimal' : consistencyScore >= 66 ? 'positive' : 'caution',
    title: `${positiveMonths} of ${Math.max(last3Trends.length, 1)} Months in the Green`,
    metric: `${consistencyScore.toFixed(0)}% Positive Months`,
    description: `Over the past ${last3Trends.length || 1} months, you earned more than you spent in ${positiveMonths} of them, reflecting steady financial discipline.`,
    recommendation: consistencyScore === 100
      ? 'Consistent multi-month savings streak! Keep up this disciplined momentum.'
      : 'Strive for 3 consecutive months of positive net savings to establish a rock-solid financial foundation.',
    domain: 'trajectory',
  });

  // Composite Health Score calculation (0 - 100)
  let healthScore = 70;
  if (hasMonthlyActivity) {
    if (savingsRate >= 35) healthScore += 18;
    else if (savingsRate >= 20) healthScore += 12;
    else if (savingsRate >= 10) healthScore += 6;
    else if (savingsRate > 0) healthScore += 2;
    else healthScore -= 12;
  }

  if (baselineMonthlyBurn > 0) {
    if (runwayMonths >= 6) healthScore += 12;
    else if (runwayMonths >= 3) healthScore += 8;
    else if (runwayMonths >= 1) healthScore += 4;
    else healthScore -= 8;
  } else if (totalBalance > 5000) {
    healthScore += 6;
  }

  if (last3Trends.length > 0) {
    if (consistencyScore === 100) healthScore += 10;
    else if (consistencyScore >= 66) healthScore += 5;
    else healthScore -= 5;
  }

  healthScore = Math.max(10, Math.min(98, healthScore));

  const runwayText = baselineMonthlyBurn > 0
    ? (runwayMonths >= 24 ? '24+ mo' : `${runwayMonths.toFixed(1)} mo`)
    : formatCurrency(totalBalance, currency?.locale, currency?.code);
  const streakText = `${positiveMonths}/${Math.max(last3Trends.length, 1)} green`;

  return {
    models,
    healthScore,
    totalEvaluated: models.length,
    runwayText,
    streakText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

const AnalyticsPage = () => {
  const { token } = useContext(AuthContext);
  const { currency } = useCurrency();
  const { timeFilter } = useTimeFilter();
  const {
    activeWalletId,
    summary,
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
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [isRerunningTelemetry, setIsRerunningTelemetry] = useState(false);
  const [telemetryTimestamp, setTelemetryTimestamp] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const handleRerunTelemetry = () => {
    setIsRerunningTelemetry(true);
    setTimeout(() => {
      setIsRerunningTelemetry(false);
      setTelemetryTimestamp(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 650);
  };

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

  const diagnosticReport = useMemo(() => {
    return generateAlgorithmicDiagnostics(analyticsData, summary, currency);
  }, [analyticsData, summary, currency]);

  const filteredModels = useMemo(() => {
    if (selectedDomain === 'all') return diagnosticReport.models;
    return diagnosticReport.models.filter((m) => m.domain === selectedDomain);
  }, [diagnosticReport.models, selectedDomain]);

  const insights = analyticsData?.insights || [];

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 px-4 sm:px-6 lg:px-8 pb-16 font-sans antialiased text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 sm:space-y-8">
          
          {/* Top Hero Card - Obsidian billing reference style */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/40 relative z-20"
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 relative z-30">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Analytics & Trends
                </h1>
                <p className="text-[11px] sm:text-xs lg:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>Deep financial health overview, category allocations and multi-period comparisons</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <WalletSelector align="right" />
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
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
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

          {/* Automated Intelligence & Quantitative Diagnostics Engine */}
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/30">
              
              {/* Header: Title + Telemetry Status + Re-run Diagnostic Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-md shadow-blue-500/10 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        Financial Health & Smart Insights
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {diagnosticReport.models.length} Key Insights
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <span>Personalized guidance on your savings, spending pace, emergency cushion, and habits</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5">
                    Updated: {telemetryTimestamp}
                  </div>

                  <button
                    type="button"
                    onClick={handleRerunTelemetry}
                    disabled={isRerunningTelemetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRerunningTelemetry ? 'animate-spin' : ''}`} />
                    <span>{isRerunningTelemetry ? 'Analyzing...' : 'Refresh Insights'}</span>
                  </button>
                </div>
              </div>

              {/* Composite Financial Health Meter Banner */}
              <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/30 dark:from-[#0b0e17] dark:via-[#0e1322] dark:to-[#0c192c] border border-slate-200/80 dark:border-white/[0.07]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#161c2b] border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Gauge className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                          {diagnosticReport.healthScore}
                        </span>
                        <span className="text-xs font-mono text-slate-400">/ 100</span>
                        <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                          {diagnosticReport.healthScore >= 80 ? 'Great Financial Shape' : diagnosticReport.healthScore >= 65 ? 'Steady Cash Flow' : 'Needs Attention'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Overall score based on your savings rate, spending pace, emergency cushion, and monthly habits.
                      </p>
                    </div>
                  </div>

                  {/* 4 Mini Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-white/[0.06]">
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#161c2b]/80 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Savings Rate</span>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {periods?.thisMonth?.income > 0 ? `${((periods.thisMonth.income - periods.thisMonth.expense) / periods.thisMonth.income * 100).toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#161c2b]/80 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Daily Spending</span>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency((periods?.thisMonth?.expense || 0) / (new Date().getDate() || 1), currency?.locale, currency?.code)}/d
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#161c2b]/80 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Emergency Buffer</span>
                      <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 truncate block">
                        {diagnosticReport.runwayText || '0 mo'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#161c2b]/80 border border-slate-200/60 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Recent Habit</span>
                      <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 truncate block">
                        {diagnosticReport.streakText || 'Consistent'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/70 dark:bg-white/10 rounded-full h-2 mt-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${diagnosticReport.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Domain Filter Ribbon */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-3 mt-4 border-b border-slate-100 dark:border-white/[0.06] text-xs">
                {[
                  { id: 'all', label: `All Insights (${diagnosticReport.models.length})` },
                  { id: 'growth', label: 'Savings' },
                  { id: 'velocity', label: 'Spending Pace' },
                  { id: 'risk', label: 'Categories' },
                  { id: 'dynamics', label: 'Cash Flow' },
                  { id: 'runway', label: 'Emergency Fund' },
                  { id: 'trajectory', label: 'Savings Habit' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedDomain(tab.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-150 ${
                      selectedDomain === tab.id
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Financial Health Insights Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
                {filteredModels.map((item) => {
                  const isOptimal = item.tone === 'optimal';
                  const isPositive = item.tone === 'positive';
                  const isCaution = item.tone === 'caution';
                  const isWarning = item.tone === 'warning';

                  const borderClass = isOptimal
                    ? 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-500/40'
                    : isPositive
                    ? 'border-blue-500/30 dark:border-blue-500/20 hover:border-blue-500/40'
                    : isCaution
                    ? 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/40'
                    : 'border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/40';

                  const badgeClass = isOptimal
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : isPositive
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                    : isCaution
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';

                  const metricTextClass = isOptimal
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isPositive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isCaution
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';

                  const IconComp = isOptimal
                    ? CheckCircle2
                    : isPositive
                    ? ShieldCheck
                    : isCaution
                    ? AlertTriangle
                    : ShieldAlert;

                  const statusLabel = isOptimal ? 'Healthy' : isPositive ? 'Good' : isCaution ? 'Notice' : 'Attention';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0c101a] border ${borderClass} transition-all duration-200 hover:shadow-lg flex flex-col justify-between`}
                    >
                      <div>
                        {/* Top Meta: Badge + Category + Status */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${badgeClass}`}>
                              {item.badge}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              {item.category}
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider ${badgeClass}`}>
                            <IconComp className="w-2.5 h-2.5" />
                            {statusLabel}
                          </span>
                        </div>

                        {/* Metric Highlight */}
                        <div className="mb-2">
                          <span className={`text-lg sm:text-xl font-extrabold font-mono tracking-tight block ${metricTextClass}`}>
                            {item.metric}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            {item.title}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      </div>

                      {/* Smart Tip recommendation box */}
                      <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-start gap-2 bg-slate-100/60 dark:bg-white/[0.02] p-2.5 rounded-xl">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <span className="font-bold text-slate-900 dark:text-white mr-1.5 text-[10px] uppercase tracking-wider">Smart Tip:</span>
                          <span className="text-slate-600 dark:text-zinc-300">{item.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Period Performance Breakdown (Executive 4-Period Grid) */}
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Scale className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Period Performance Breakdown</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">Direct period-over-period cashflow reconciliation</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <ObsidianPeriodStat title="All Time Cumulative" period={periods.allTime} currency={currency} />
                <ObsidianPeriodStat title="This Year YTD" period={periods.thisYear} currency={currency} />
                <ObsidianPeriodStat title="This Month" period={periods.thisMonth} currency={currency} />
                <ObsidianPeriodStat title="Last Month" period={periods.lastMonth} currency={currency} />
              </div>
            </div>
          </motion.div>
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
    <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/15 transition-all duration-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-lg shadow-black/5 dark:shadow-black/20">
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider truncate">
            {label}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-700 dark:text-zinc-200 flex-shrink-0">
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="font-mono font-bold text-base sm:text-xl lg:text-2xl tracking-tight text-slate-900 dark:text-white truncate">
          {formatCurrency(value, currency.locale, currency.code)}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 truncate">
          {trendLabel}
        </span>
        {badgeText && (
          <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md border font-mono flex-shrink-0 ${badgeStyles}`}>
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