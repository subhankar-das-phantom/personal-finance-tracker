import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Coins,
  Target,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const BudgetProgress = ({ progress }) => {
  const { currency } = useCurrency();
  
  if (!progress || !progress.budgetProgress) {
    return null;
  }

  const { budgetProgress } = progress;

  const calculateDaysInMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate();
  };

  const getCurrentDay = () => {
    return new Date().getDate();
  };

  const daysInMonth = calculateDaysInMonth();
  const currentDay = getCurrentDay();
  const daysRemaining = daysInMonth - currentDay;
  const monthProgress = (currentDay / daysInMonth) * 100;

  const getSpendingPace = (item) => {
    const expectedSpending = (item.budgetAmount * monthProgress) / 100;
    const difference = item.actualSpent - expectedSpending;
    const percentDiff = expectedSpending > 0 ? (difference / expectedSpending) * 100 : 0;

    if (Math.abs(percentDiff) < 10) {
      return { status: 'on-track', message: 'On Pace', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    } else if (difference > 0) {
      return { status: 'over-pace', message: `${Math.abs(percentDiff).toFixed(0)}% over pace`, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    } else {
      return { status: 'under-pace', message: `${Math.abs(percentDiff).toFixed(0)}% under pace`, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    }
  };

  return (
    <div className="bg-white dark:bg-[#10141e] rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.07]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Category Pacing</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 text-xs font-mono text-slate-600 dark:text-zinc-300">
          <Clock className="w-3 h-3 text-blue-500" />
          <span>{daysRemaining}d left</span>
        </div>
      </div>

      {/* Month Progression Bar */}
      <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0b0e17] border border-slate-100 dark:border-white/[0.04]">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-slate-600 dark:text-zinc-400">Month Timeline</span>
          <span className="font-mono text-slate-500 dark:text-zinc-400">
            Day {currentDay} of {daysInMonth} ({monthProgress.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-[#161c2b] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3.5">
        {budgetProgress.map((item, index) => {
          const pace = getSpendingPace(item);
          const percentCapped = Math.min(item.percentageUsed, 100);
          const isOver = item.percentageUsed >= 100;
          const isWarning = item.percentageUsed >= 80 && !isOver;

          return (
            <div
              key={item.category}
              className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0b0e17] border border-slate-200/80 dark:border-white/[0.05] transition-all hover:border-slate-300 dark:hover:border-white/10"
            >
              {/* Category Title & Amount */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${pace.color} hidden sm:inline-block`}>
                    {pace.message}
                  </span>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {formatCurrency(item.actualSpent, currency.locale, currency.code)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 ml-1">
                    / {formatCurrency(item.budgetAmount, currency.locale, currency.code)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative mb-2">
                <div className="w-full bg-slate-200 dark:bg-[#161c2b] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentCapped}%` }}
                  />
                </div>
              </div>

              {/* Sub-metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 font-mono pt-1">
                <span>
                  {item.remaining >= 0 ? (
                    <span className="text-emerald-500 font-semibold">
                      +{formatCurrency(item.remaining, currency.locale, currency.code)} left
                    </span>
                  ) : (
                    <span className="text-rose-500 font-semibold">
                      -{formatCurrency(Math.abs(item.remaining), currency.locale, currency.code)} overrun
                    </span>
                  )}
                </span>
                <span>
                  {item.percentageUsed.toFixed(0)}% consumed ({item.transactionCount || 0} txns)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgress;
