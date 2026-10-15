import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Target, Calendar, Coins, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const BudgetList = ({ goals = [], onEdit, onDelete }) => {
  const { currency } = useCurrency();
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthStatus = (month, year) => {
    const now = new Date();
    const goalDate = new Date(year, month);
    const currentDate = new Date(now.getFullYear(), now.getMonth());

    if (goalDate < currentDate) {
      return { label: 'Past', badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
    } else if (goalDate.getTime() === currentDate.getTime()) {
      return { label: 'Current Active', badge: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    } else {
      return { label: 'Upcoming', badge: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
    }
  };

  if (goals.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2 opacity-50" />
        <p className="text-slate-700 dark:text-zinc-300 text-sm font-semibold">No targets configured</p>
        <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">Add monthly limits to prevent overspending</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const status = getMonthStatus(goal.month, goal.year);
        
        return (
          <div
            key={goal._id}
            className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-[#0b0e17] border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 flex items-center justify-center text-blue-500 flex-shrink-0">
                <Target className="w-4 h-4" />
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {goal.category}
                  </h4>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${status.badge}`}>
                    {status.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{months[goal.month]} {goal.year}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {formatCurrency(goal.amount, currency.locale, currency.code)}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                  Cap Limit
                </div>
              </div>

              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-white/[0.06] pl-2 sm:pl-3">
                <button
                  onClick={() => onEdit(goal)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-500 hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
                  title="Edit target"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(goal._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
                  title="Delete target"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetList;
