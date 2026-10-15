import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeftRight,
  ArrowRight,
  ArrowDown,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const TransferModal = ({ isOpen, onClose }) => {
  const { activeWallets, activeWalletId, createTransfer } = useWallet();
  const { currency } = useCurrency();

  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default source wallet when opened
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);

      if (activeWalletId && activeWalletId !== 'all') {
        setFromWalletId(activeWalletId);
        // Find first destination different from active
        const dest = activeWallets.find((w) => w._id !== activeWalletId);
        setToWalletId(dest?._id || '');
      } else if (activeWallets.length >= 2) {
        setFromWalletId(activeWallets[0]._id);
        setToWalletId(activeWallets[1]._id);
      } else if (activeWallets.length === 1) {
        setFromWalletId(activeWallets[0]._id);
        setToWalletId('');
      }
    }
  }, [isOpen, activeWalletId, activeWallets]);

  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  const fromWallet = activeWallets.find((w) => w._id === fromWalletId);
  const toWallet = activeWallets.find((w) => w._id === toWalletId);

  const numAmount = parseFloat(amount) || 0;
  const isOverdraft = fromWallet && numAmount > 0 && fromWallet.balance < numAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fromWalletId || !toWalletId) {
      setError('Please select both source and destination wallets');
      return;
    }

    if (fromWalletId === toWalletId) {
      setError('Source and destination wallets must be different');
      return;
    }

    if (numAmount <= 0) {
      setError('Transfer amount must be greater than 0');
      return;
    }

    // Client idempotency key to prevent accidental duplicate submission
    const idempotencyKey = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      setIsSubmitting(true);
      await createTransfer({
        fromWalletId,
        toWalletId,
        amount: numAmount,
        date: date ? new Date(date) : new Date(),
        description: description.trim(),
        idempotencyKey,
      });

      setSuccess(`Successfully transferred ${formatCurrency(numAmount, currency)} from ${fromWallet?.name} to ${toWallet?.name}!`);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 bg-black/70"
            onClick={onClose}
          />
          {/* Centering Wrapper */}
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6 relative pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white dark:bg-[#10141e] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/80 dark:bg-[#161c2b]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Transfer Funds</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Move money seamlessly between your personal wallets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form Body */}
        {activeWallets.length < 2 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
              At least two active wallets required
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              To transfer money, create another wallet in the wallet management screen.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Visual Wallet Transfer Graphic */}
            <div className="flex flex-col sm:grid sm:grid-cols-11 items-center gap-3 p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
              {/* Source Column */}
              <div className="w-full sm:col-span-5">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  From Wallet
                </label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeWallets.map((w) => (
                    <option key={w._id} value={w._id} disabled={w._id === toWalletId}>
                      {w.name} ({formatCurrency(w.balance, currency?.locale || 'en-IN', w.currency || 'INR')})
                    </option>
                  ))}
                </select>
                {fromWallet && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                    Available: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(fromWallet.balance, currency?.locale || 'en-IN', fromWallet.currency || 'INR')}</span>
                  </div>
                )}
              </div>

              {/* Arrow Indicator */}
              <div className="w-full sm:col-span-1 flex justify-center py-0.5 sm:py-0">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-sm">
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:block" />
                  <ArrowDown className="w-3.5 h-3.5 sm:hidden" />
                </div>
              </div>

              {/* Destination Column */}
              <div className="w-full sm:col-span-5">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  To Wallet
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeWallets.map((w) => (
                    <option key={w._id} value={w._id} disabled={w._id === fromWalletId}>
                      {w.name} ({formatCurrency(w.balance, currency?.locale || 'en-IN', w.currency || 'INR')})
                    </option>
                  ))}
                </select>
                {toWallet && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                    Current: <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(toWallet.balance, { code: toWallet.currency })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overdraft Warning Banner */}
            {isOverdraft && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Notice: Transfer amount ({formatCurrency(numAmount, currency)}) exceeds the available balance in{' '}
                  <strong>{fromWallet?.name}</strong>. The wallet balance will become negative.
                </span>
              </div>
            )}

            {/* Amount & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Transfer Amount *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                  />
                  <div className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                    {fromWallet?.currency || currency?.code || 'INR'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Transfer Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Description / Memo (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Transfer to travel fund, ATM withdrawal, pocket money"
                maxLength={500}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Projected Balances Summary */}
            {numAmount > 0 && fromWallet && toWallet && (
              <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-gray-800/50 border border-blue-100 dark:border-gray-700 text-xs space-y-1">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{fromWallet.name} balance after:</span>
                  <span className="font-bold">
                    {formatCurrency(fromWallet.balance - numAmount, { code: fromWallet.currency })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>{toWallet.name} balance after:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(toWallet.balance + numAmount, { code: toWallet.currency })}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700">
                  Transfers do not affect your overall net balance or count as expenses/income.
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !fromWalletId || !toWalletId || numAmount <= 0}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>{isSubmitting ? 'Transferring...' : 'Confirm Transfer'}</span>
              </button>
            </div>
          </form>
        )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransferModal;
