import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Globe,
  ChevronDown,
  ArrowLeftRight,
  Settings,
  Check,
  Sparkles,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { formatCurrency } from '../utils/currency';
import { useCurrency } from '../context/CurrencyContext';

const WalletSelector = ({ className = '', align = 'auto' }) => {
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
  const [dropdownAlign, setDropdownAlign] = useState(() => (align === 'auto' ? 'right' : align));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (align !== 'auto') {
      setDropdownAlign(align);
      return;
    }
    const updateAlign = () => {
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const spaceRight = viewportWidth - rect.right;

        // If less than 350px on the right or located in the right half of the screen
        if (spaceRight < 340 || rect.left > viewportWidth / 2) {
          setDropdownAlign('right');
        } else {
          setDropdownAlign('left');
        }
      }
    };

    if (isOpen) {
      updateAlign();
      window.addEventListener('resize', updateAlign);
      return () => window.removeEventListener('resize', updateAlign);
    }
  }, [isOpen, align]);

  const selectedTitle = activeWallet ? activeWallet.name : 'All Wallets';
  const selectedBalance = activeWallet ? activeWallet.balance : summary.totalBalance;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#161c2b] hover:bg-slate-100 dark:hover:bg-[#1f273d] transition-all duration-150 text-left group shadow-sm"
        aria-label="Select wallet"
        aria-expanded={isOpen}
      >
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-600/30 flex-shrink-0">
          {activeWallet ? <Wallet className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
        </div>

        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
              {activeWallet ? 'Wallet' : 'Overview'}
            </span>
            {activeWallet?.isArchived && (
              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-medium">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2 truncate">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
              {selectedTitle}
            </span>
            <span className="text-xs font-mono font-bold text-blue-500">
              {formatCurrency(selectedBalance, currency)}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white transition-transform duration-150 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute ${
              dropdownAlign === 'left' ? 'left-0' : 'right-0'
            } mt-2 w-80 sm:w-88 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#10141e] border border-slate-200 dark:border-white/10 shadow-2xl shadow-black/40 z-50 overflow-hidden font-sans`}
          >
            {/* Header */}
            <div className="p-3 bg-slate-50 dark:bg-[#161c2b] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center text-[11px]">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-500" />
                Wallets ({activeWallets.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="text-blue-500 hover:text-blue-400 flex items-center space-x-1 font-semibold text-xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transfer</span>
              </button>
            </div>

            {/* Wallets List */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {/* Option: All Wallets Combined Overview */}
              <button
                type="button"
                onClick={() => {
                  setActiveWalletId('all');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors duration-150 ${
                  activeWalletId === 'all'
                    ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                    : 'hover:bg-slate-50 dark:hover:bg-[#161c2b] text-slate-700 dark:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeWalletId === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-[#161c2b] text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      All Wallets Overview
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                      Combined total balance
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.totalBalance, currency)}
                  </span>
                  {activeWalletId === 'all' && (
                    <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  )}
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors duration-150 ${
                      isSelected
                        ? 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                        : 'hover:bg-slate-50 dark:hover:bg-[#161c2b] text-slate-700 dark:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-[#161c2b] text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {wallet.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 truncate">
                          {wallet.transactionCount || 0} txns • {wallet.currency}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <span
                        className={`text-xs font-mono font-bold ${
                          wallet.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'
                        }`}
                      >
                        {formatCurrency(wallet.balance, { code: wallet.currency, locale: currency?.locale })}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="p-2 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#161c2b] flex items-center justify-between space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsTransferModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                <span>Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsManageWalletsOpen(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
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
