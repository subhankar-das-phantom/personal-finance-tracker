import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FixedSizeList as List } from "react-window";
import {
  Edit3,
  Trash2,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";

// =============================
// TransactionRow Component
// =============================
const TransactionRow = memo(({ index, style, items, onEdit, onDelete }) => {
  const transaction = items[index];
  const [isActive, setIsActive] = useState(false);

  // Safety check for async/paginated data
  if (!transaction) {
    return (
      <div style={style}>
        <div className="mx-4 my-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <div style={style}>
      <motion.div
        onHoverStart={() => setIsActive(true)}
        onHoverEnd={() => setIsActive(false)}
        onTap={() => setIsActive(!isActive)}
        className="mx-4 my-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side (icon + details) */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div
              className={`p-2 rounded-lg flex-shrink-0 ${
                transaction.type === "income"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              }`}
            >
              {transaction.type === "income" ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {transaction.description || "No description"}
                </h3>
                <span
                  className={`text-lg sm:text-xl font-bold sm:ml-4 whitespace-nowrap ${
                    transaction.type === "income"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatAmount(transaction.amount)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{transaction.category}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(transaction.date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit/Delete Buttons */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-2 flex-shrink-0"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(transaction);
                  }}
                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors duration-200"
                  title="Edit transaction"
                >
                  <Edit3 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(transaction._id);
                  }}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  title="Delete transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});
TransactionRow.displayName = "TransactionRow";

// =============================
// TransactionList Component
// =============================
const TransactionList = ({ transactions, onDelete, onEdit, isLoading = false }) => {
  const ITEM_HEIGHT = 120;
  const LIST_HEIGHT = 600;

  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800"
    >
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Recent Transactions
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {transactions.length} transactions
          </div>
        </motion.div>
      </div>

      {/* List Section */}
      <div className="p-2 sm:p-4">
        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400"
          >
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No transactions found</p>
            <p className="text-sm text-center px-4">
              Try adjusting your filters or search terms
            </p>
          </motion.div>
        ) : (
          <List
            height={LIST_HEIGHT}
            itemCount={transactions.length}
            itemSize={ITEM_HEIGHT}
            width="100%"
            className="custom-scrollbar"
          >
            {({ index, style }) => {
              const tx = transactions[index];
              if (!tx) return null;
              return (
                <TransactionRow
                  index={index}
                  style={style}
                  items={transactions}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              );
            }}
          </List>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionList;
