// frontend/src/components/BudgetList.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2 } from 'lucide-react';

const BudgetList = ({ goals = [], onEdit, onDelete }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
      className="space-y-4"
    >
      {goals.map(goal => (
        <motion.div
          key={goal._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between"
        >
          <div>
            <p className="font-semibold text-lg text-gray-800 dark:text-white">{goal.category}</p>
            <p className="text-gray-600 dark:text-gray-400">{months[goal.month]} {goal.year}</p>
          </div>
          <div className="flex items-center space-x-4">
            <p className="text-xl font-bold text-green-500">${goal.amount.toFixed(2)}</p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(goal)}
              className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Edit size={20} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(goal._id)}
              className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Trash2 size={20} />
            </motion.button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BudgetList;