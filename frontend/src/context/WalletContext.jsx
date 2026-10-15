import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useApi, globalMutate } from '../hooks/useApi';
import walletService from '../services/walletService';
import transferService from '../services/transferService';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { token } = useContext(AuthContext);

  // 'all' represents all-wallets combined view, or a specific wallet ID
  const [activeWalletId, setActiveWalletIdState] = useState(() => {
    return localStorage.getItem('activeWalletId') || 'all';
  });

  // Modal open states for quick global access
  const [isManageWalletsOpen, setIsManageWalletsOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Fetch all wallets (including archived for management)
  const {
    data: walletData,
    isLoading,
    mutate: mutateWallets,
  } = useApi(token ? 'wallets?includeArchived=true' : null);

  const wallets = walletData?.wallets || [];
  const activeWallets = wallets.filter((w) => !w.isArchived);
  const archivedWallets = wallets.filter((w) => w.isArchived);
  const summary = walletData?.summary || {
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalOpeningBalance: 0,
    count: 0,
  };

  // Find currently active wallet object if a specific wallet is selected
  const activeWallet =
    activeWalletId !== 'all' ? wallets.find((w) => w._id === activeWalletId) || null : null;

  // If active wallet was deleted or became invalid, fall back to 'all'
  useEffect(() => {
    if (activeWalletId !== 'all' && wallets.length > 0) {
      const exists = wallets.some((w) => w._id === activeWalletId);
      if (!exists) {
        setActiveWalletId('all');
      }
    }
  }, [wallets, activeWalletId]);

  const setActiveWalletId = (id) => {
    setActiveWalletIdState(id);
    localStorage.setItem('activeWalletId', id);
  };

  // Helper to revalidate all financial caches across the app
  const refreshAllFinancialData = () => {
    mutateWallets();
    globalMutate((key) => typeof key === 'string' && (key.startsWith('transactions') || key.startsWith('wallets') || key.startsWith('/budget')));
  };

  const createWallet = async ({ name, openingBalance = 0, currency }) => {
    try {
      const res = await walletService.createWallet({ name, openingBalance, currency });
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in createWallet:', err);
      throw err;
    }
  };

  const renameWallet = async (id, name) => {
    try {
      const res = await walletService.updateWallet(id, { name });
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in renameWallet:', err);
      throw err;
    }
  };

  const archiveWallet = async (id) => {
    try {
      const res = await walletService.archiveWallet(id);
      if (activeWalletId === id) {
        setActiveWalletId('all');
      }
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in archiveWallet:', err);
      throw err;
    }
  };

  const unarchiveWallet = async (id) => {
    try {
      const res = await walletService.unarchiveWallet(id);
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in unarchiveWallet:', err);
      throw err;
    }
  };

  const deleteWallet = async (id) => {
    try {
      const res = await walletService.deleteWallet(id);
      if (activeWalletId === id) {
        setActiveWalletId('all');
      }
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in deleteWallet:', err);
      throw err;
    }
  };

  const createTransfer = async (transferData) => {
    try {
      const res = await transferService.createTransfer(transferData);
      refreshAllFinancialData();
      return res.data;
    } catch (err) {
      console.error('Error in createTransfer:', err);
      throw err;
    }
  };

  const value = {
    wallets,
    activeWallets,
    archivedWallets,
    activeWallet,
    activeWalletId,
    setActiveWalletId,
    summary,
    isLoading,
    mutateWallets,
    createWallet,
    renameWallet,
    archiveWallet,
    unarchiveWallet,
    deleteWallet,
    createTransfer,
    refreshAllFinancialData,
    isManageWalletsOpen,
    setIsManageWalletsOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export default WalletContext;
