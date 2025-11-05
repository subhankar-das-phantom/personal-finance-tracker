// frontend/src/components/BudgetProgress.jsx
import React from 'react';
import { motion } from 'framer-motion';

const BudgetProgress = ({ progress }) => {
  if (!progress || !progress.budgetProgress) {
    return null;
  }

  const { budgetProgress, summary } = progress;

  const getStatusColor = (status) => {
    switch (status) {
      case 'over':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    >
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Current Month's Budget Progress</h3>
      <div className="space-y-4">
        {budgetProgress.map(item => (
          <div key={item.category}>
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300">{item.category}</span>
              <span className="text-gray-600 dark:text-gray-400">${item.actualSpent.toFixed(2)} / ${item.budgetAmount.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                className={`h-4 rounded-full ${getStatusColor(item.status)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <p className="text-lg font-semibold text-gray-800 dark:text-white">Overall Progress</p>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800 dark:text-white">${summary.totalSpent.toFixed(2)}</p>
            <p className="text-gray-600 dark:text-gray-400">of ${summary.totalBudget.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BudgetProgress;