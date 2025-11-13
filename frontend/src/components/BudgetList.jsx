import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Target, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

const BudgetList = ({ goals = [], onEdit, onDelete }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthStatus = (month, year) => {
    const now = new Date();
    const goalDate = new Date(year, month);
    const currentDate = new Date(now.getFullYear(), now.getMonth());

    if (goalDate < currentDate) {
      return { label: 'Past', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' };
    } else if (goalDate.getTime() === currentDate.getTime()) {
      return { label: 'Current', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' };
    } else {
      return { label: 'Upcoming', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
    }
  };

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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: { duration: 0.2 }
    }
  };

  if (goals.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No budget goals yet</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Create your first budget goal to get started</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <AnimatePresence mode="popLayout">
        {goals.map((goal, index) => {
          const status = getMonthStatus(goal.month, goal.year);
          
          return (
            <motion.div
              key={goal._id}
              variants={itemVariants}
              layout
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          {goal.category}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {months[goal.month]} {goal.year}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${goal.amount.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">budget</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(goal)}
                      className="p-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors duration-200"
                      title="Edit budget goal"
                    >
                      <Edit className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(goal._id)}
                      className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200"
                      title="Delete budget goal"
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <TrendingUp className="h-4 w-4" />
                    <span>Track your spending against this goal</span>
                  </div>
                  {status.label === 'Current' && (
                    <span className="text-green-600 dark:text-green-400 font-medium">Active Now</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default BudgetList;
