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
      <div className="bg-slate-100 dark:bg-[#0b0e17] rounded-xl p-3 sm:p-3.5 animate-pulse border border-slate-200 dark:border-white/[0.05]">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-[#161c2b] rounded-lg flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-[#161c2b] rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#161c2b] rounded w-1/2"></div>
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
    <div className="group bg-white dark:bg-[#0b0e17] hover:bg-slate-50 dark:hover:bg-[#161c2b] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/[0.05] hover:border-slate-300 dark:hover:border-white/10 transition-all duration-150 shadow-sm flex items-center justify-between gap-3 w-full">
      {/* Left side: Squircle Icon + Details */}
      <div className="flex items-center space-x-3 sm:space-x-3.5 flex-1 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
            isIncome
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          }`}
        >
          {isIncome ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {transaction.description || "No description"}
          </h3>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            <div className="flex items-center space-x-1">
              <Tag className="h-3 w-3 flex-shrink-0 text-slate-400" />
              <span className="truncate max-w-[120px]">{transaction.category}</span>
            </div>
            {transaction.wallet && (
              <div className="flex items-center space-x-1">
                <Wallet className="h-3 w-3 flex-shrink-0 text-blue-500" />
                <span className="truncate max-w-[130px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-zinc-300 text-[10px] font-mono font-medium">
                  {transaction.wallet.name}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1 font-mono text-[11px]">
              <Calendar className="h-3 w-3 flex-shrink-0 text-slate-400" />
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Amount in Tabular Mono + Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 ml-2">
        <div
          className={`text-xs sm:text-sm font-mono font-extrabold whitespace-nowrap text-right ${
            isIncome
              ? "text-emerald-500"
              : "text-rose-500"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount, currency.locale, currency.code)}
        </div>

        {/* Action buttons: CSS-only opacity, never causes layout shifts */}
        <div className="flex items-center space-x-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction);
            }}
            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Edit transaction"
            aria-label="Edit transaction"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction._id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            title="Delete transaction"
            aria-label="Delete transaction"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
    estimateSize: useCallback(() => 76, []),
    overscan: 10,
    getItemKey: useCallback(
      (index) => {
        if (index >= transactions.length) return "virtual-loader-row";
        return transactions[index]?._id || `tx-row-${index}`;
      },
      [transactions]
    ),
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= transactions.length - 1 &&
      hasMore &&
      !isLoading &&
      onLoadMore
    ) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore, transactions.length, virtualItems]);

  if (isLoading && transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#10141e] rounded-2xl shadow-xl p-5 border border-slate-200/80 dark:border-white/[0.07]">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-[#0b0e17] rounded-xl border border-slate-200 dark:border-white/[0.05]"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  const listContent = (
    <div className={showHeader ? "p-2 sm:p-4" : ""}>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-zinc-500">
          <AlertCircle className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">No transactions found</p>
          <p className="text-xs text-center px-4">
            Try adjusting your filters, time range or search terms
          </p>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="h-[600px] overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{ willChange: "scroll-position" }}
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
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: "8px",
                  }}
                >
                  {isLoaderRow ? (
                    <div className="flex items-center justify-center p-3 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin mr-2 text-blue-500" />
                      <span>Loading more records...</span>
                    </div>
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
    <div className="bg-white dark:bg-[#10141e] rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/[0.07]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Recent Ledger Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Live synchronized records</p>
        </div>
        <div className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#161c2b] text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-white/5">
          {transactions.length} {hasMore ? "+ " : ""}txns
        </div>
      </div>

      {/* Virtualized List Section */}
      {listContent}
    </div>
  );
};

export default TransactionList;
