import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Wallet,
  Plus,
  Edit2,
  Check,
  Archive,
  RotateCcw,
  Trash2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/currency';

const WalletManagementModal = ({ isOpen, onClose }) => {
  const {
    wallets,
    activeWallets,
    archivedWallets,
    createWallet,
    renameWallet,
    archiveWallet,
    unarchiveWallet,
    deleteWallet,
    isLoading,
  } = useWallet();

  const { currency } = useCurrency();

  // Local state
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [isCreating, setIsCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }
    const balanceNum = parseFloat(newOpeningBalance) || 0;
    if (balanceNum < 0) {
      setError('Opening balance cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createWallet({
        name: newWalletName.trim(),
        openingBalance: balanceNum,
        currency: currency?.code || 'INR',
      });
      setNewWalletName('');
      setNewOpeningBalance('');
      setIsCreating(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRename = (wallet) => {
    setEditingWalletId(wallet._id);
    setEditingName(wallet.name);
    setError('');
  };

  const handleSaveRename = async (walletId) => {
    if (!editingName.trim()) {
      setError('Wallet name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await renameWallet(walletId, editingName.trim());
      setEditingWalletId(null);
      setEditingName('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to rename wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (walletId) => {
    try {
      setIsSubmitting(true);
      setError('');
      await archiveWallet(walletId);
      setConfirmArchiveId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to archive wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnarchive = async (walletId) => {
    try {
      setIsSubmitting(true);
      setError('');
      await unarchiveWallet(walletId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to restore wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (walletId) => {
    try {
      setIsSubmitting(true);
      setError('');
      await deleteWallet(walletId);
      setConfirmDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete wallet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentList = activeTab === 'active' ? activeWallets : archivedWallets;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Wallets</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Organize personal funds, purse balances & independent money pools
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Navigation Tabs & Action */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400 dark:border-cyan-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Active ({activeWallets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'archived'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400 dark:border-cyan-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
              }`}
            >
              Archived ({archivedWallets.length})
            </button>
          </div>

          {activeTab === 'active' && !isCreating && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Wallet</span>
            </button>
          )}
        </div>

        {/* Create Wallet Inline Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateWallet}
              className="p-6 bg-blue-50/40 dark:bg-gray-800/40 border-b border-blue-100/50 dark:border-gray-700 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Create Custom Wallet</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Wallet Name * (e.g., Boro Purse, ঘর কা پیسہ, Travel Fund)
                  </label>
                  <input
                    type="text"
                    required
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder="Enter user-defined wallet name..."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Opening Balance ({currency?.code || 'INR'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newOpeningBalance}
                    onChange={(e) => setNewOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    Existing money balance. Does not count as new income.
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Wallet'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Wallets List Content */}
        <div className="p-6 max-h-[440px] overflow-y-auto space-y-3">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">
                {activeTab === 'active'
                  ? 'No active wallets found. Click "New Wallet" to add one!'
                  : 'No archived wallets. Archived wallets preserve historical records.'}
              </p>
            </div>
          ) : (
            currentList.map((wallet) => {
              const isEditing = editingWalletId === wallet._id;
              const isConfirmingArchive = confirmArchiveId === wallet._id;
              const isConfirmingDelete = confirmDeleteId === wallet._id;

              return (
                <div
                  key={wallet._id}
                  className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between flex-wrap sm:flex-nowrap gap-3 sm:gap-0">
                    {/* Left: Info or inline edit */}
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-gray-700/80 border border-blue-100 dark:border-gray-600 flex items-center justify-center text-blue-600 dark:text-cyan-400 flex-shrink-0 mt-0.5">
                        <Wallet className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2.5 py-1 text-sm rounded-lg border border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                              autoFocus
                              maxLength={100}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(wallet._id)}
                              disabled={isSubmitting}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-lg"
                              title="Save name"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingWalletId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                              {wallet.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleStartRename(wallet)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded transition-colors"
                              title="Rename wallet"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Balance and metrics */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            Balance:{' '}
                            <span
                              className={`font-bold ${
                                wallet.balance >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400 font-semibold'
                              }`}
                            >
                              {formatCurrency(wallet.balance, currency?.locale || 'en-IN', wallet.currency || 'INR')}
                            </span>
                          </div>
                          {wallet.openingBalance > 0 && (
                            <div>
                              Opening:{' '}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {formatCurrency(wallet.openingBalance, currency?.locale || 'en-IN', wallet.currency || 'INR')}
                              </span>
                            </div>
                          )}
                          <div>
                            Activity:{' '}
                            <span className="font-medium">
                              {wallet.transactionCount || 0} txns • {wallet.transferCount || 0} transfers
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-1 flex-shrink-0 sm:ml-3">
                      {activeTab === 'active' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmArchiveId(isConfirmingArchive ? null : wallet._id)}
                            className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800/60 transition-colors flex items-center space-x-1"
                            title="Archive wallet"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(wallet._id)}
                            className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800/60 transition-colors flex items-center space-x-1"
                            title="Restore wallet"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>

                          {/* Safe delete button (only if 0 txns and 0 transfers) */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : wallet._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                            title="Delete wallet"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Confirmation banner for Archiving */}
                  {isConfirmingArchive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between"
                    >
                      <div className="pr-2">
                        <strong>Archive "{wallet.name}"?</strong> Transactions and balance history will be preserved,
                        but new transactions cannot be recorded against it.
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveId(null)}
                          className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(wallet._id)}
                          disabled={isSubmitting}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Confirmation banner for Deletion */}
                  {isConfirmingDelete && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center justify-between"
                    >
                      <div className="pr-2">
                        {wallet.transactionCount > 0 || wallet.transferCount > 0 ? (
                          <span>
                            Cannot delete: wallet has financial records ({wallet.transactionCount} transactions,{' '}
                            {wallet.transferCount} transfers). Keep it archived to preserve history.
                          </span>
                        ) : (
                          <span>Permanently delete "{wallet.name}"? This cannot be undone.</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Cancel
                        </button>
                        {wallet.transactionCount === 0 && wallet.transferCount === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(wallet._id)}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-gray-800/70 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>Wallets keep separate pools of money without altering total net worth.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WalletManagementModal;
