import React, { useState, memo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Edit3,
  Trash2,
  Calendar,
  Tag,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../utils/currency";

// =============================
// TransactionRow Component
// =============================
const TransactionRow = memo(({ transaction, onEdit, onDelete }) => {
  const { currency } = useCurrency();

  // Safety check for async/paginated data
  if (!transaction) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800/60 rounded-xl p-3 sm:p-3.5 animate-pulse">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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

  const isIncome = transaction.type === "income";

  return (
    <div className="group bg-white dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-800 rounded-xl p-3 sm:p-3.5 border border-gray-200/80 dark:border-gray-700/80 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-150 shadow-sm flex items-center justify-between gap-3 w-full">
      {/* Left side: Icon + Details */}
      <div className="flex items-center space-x-3 sm:space-x-3.5 flex-1 min-w-0">
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${
            isIncome
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}
        >
          {isIncome ? (
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
            {transaction.description || "No description"}
          </h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <div className="flex items-center space-x-1">
              <Tag className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate max-w-[120px]">{transaction.category}</span>
            </div>
            {transaction.wallet && (
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3 flex-shrink-0 text-blue-500" />
                <span className="truncate max-w-[130px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-300 text-[11px] font-medium">
                  {transaction.wallet.name}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Amount + Actions (zero layout shift) */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
        <div
          className={`text-sm sm:text-base font-bold whitespace-nowrap text-right ${
            isIncome
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, currency.locale, currency.code)}
        </div>

        {/* Action buttons: CSS-only opacity, never causes layout shifts or remeasures */}
        <div className="flex items-center space-x-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="Edit transaction"
            aria-label="Edit transaction"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction._id);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
TransactionRow.displayName = "TransactionRow";

// =============================
// TransactionList Component with TanStack Virtual
// =============================
const TransactionList = ({
  transactions,
  onDelete,
  onEdit,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  showHeader = true,
}) => {
  const parentRef = useRef(null);

  // Configure the virtualizer with stable estimation and larger overscan buffer
  const rowVirtualizer = useVirtualizer({
    count: hasMore ? transactions.length + 1 : transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 76, []), // Height per row including container padding
    overscan: 10, // Pre-render 10 items outside viewport for zero jitter
    getItemKey: useCallback(
      (index) => {
        if (index >= transactions.length) return "virtual-loader-row";
        return transactions[index]?._id || `tx-row-${index}`;
      },
      [transactions]
    ),
  });

  // Get virtual items
  const virtualItems = rowVirtualizer.getVirtualItems();

  // Handle infinite loading when reaching near the end
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    // Trigger load more when we're near the end
    if (
      lastItem.index >= transactions.length - 1 &&
      hasMore &&
      !isLoading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, transactions.length, virtualItems]);

  // Loading state for initial load
  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const listContent = (
    <div className={showHeader ? "p-2 sm:p-4" : ""}>
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
        <div
          ref={parentRef}
          className="h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{
            willChange: "scroll-position",
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const isLoaderRow = virtualRow.index > transactions.length - 1;
              const transaction = transactions[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="px-2 sm:px-3 py-1.5"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoaderRow ? (
                    hasMore ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                          Loading more transactions...
                        </span>
                      </div>
                    ) : null
                  ) : (
                    <TransactionRow
                      transaction={transaction}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (!showHeader) {
    return listContent;
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
            <div className="w-[185px] h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full" />
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {transactions.length} {hasMore ? "+ " : ""}transactions
          </div>
        </motion.div>
      </div>

      {/* Virtualized List Section */}
      {listContent}
    </motion.div>
  );
};

export default TransactionList;
