import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Globe,
  ChevronDown,
  Plus,
  ArrowLeftRight,
  Settings,
  Check,
  Archive,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../context/CurrencyContext';

const WalletSelector = ({ className = '' }) => {
  const {
    activeWallets,
    activeWallet,
    activeWalletId,
    setActiveWalletId,
    summary,
    setIsManageWalletsOpen,
    setIsTransferModalOpen,
  } = useWallet();

  const { currency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedTitle = activeWallet ? activeWallet.name : 'All Wallets';
  const selectedBalance = activeWallet ? activeWallet.balance : summary.totalBalance;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/70 shadow-sm transition-all duration-200 text-left group"
        aria-label="Select wallet"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          {activeWallet ? <Wallet className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {activeWallet ? 'Wallet' : 'Overview'}
            </span>
            {activeWallet?.isArchived && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded font-medium">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 truncate">
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
              {selectedTitle}
            </span>
            <span className="text-xs font-medium text-blue-600 dark:text-cyan-400">
              {formatCurrency(selectedBalance, currency)}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header / Summary */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="font-semibold uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-600 dark:text-cyan-400" />
                  Your Wallets ({activeWallets.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsTransferModalOpen(true);
                  }}
                  className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center space-x-1 font-medium"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Wallets List */}
            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {/* Option: All Wallets Combined Overview */}
              <button
                type="button"
                onClick={() => {
                  setActiveWalletId('all');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors duration-150 ${
                  activeWalletId === 'all'
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      activeWalletId === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm truncate">All Wallets Overview</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Combined net balance</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {formatCurrency(summary.totalBalance, currency)}
                  </span>
                  {activeWalletId === 'all' && <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400" />}
                </div>
              </button>

              {/* Individual Active Wallets */}
              {activeWallets.map((wallet) => {
                const isSelected = activeWalletId === wallet._id;
                return (
                  <button
                    key={wallet._id}
                    type="button"
                    onClick={() => {
                      setActiveWalletId(wallet._id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                          isSelected
                            ? 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm truncate">{wallet.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {wallet.transactionCount || 0} txns • {wallet.currency}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span
                        className={`text-xs font-bold ${
                          wallet.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(wallet.balance, { code: wallet.currency, locale: currency?.locale })}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-2 border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-800/80 flex items-center justify-between space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsManageWalletsOpen(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-gray-500" />
                <span>Manage</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletSelector;
