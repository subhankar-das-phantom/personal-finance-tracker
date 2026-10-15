import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  Coins, 
  Calendar, 
  Tag, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Save,
  Plus,
  AlertCircle,
  X,
  Wallet
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useCurrency } from '../context/CurrencyContext';
import { AuthContext } from '../context/AuthContext';
import { useApi, globalMutate } from '../hooks/useApi';
import { formatCurrency } from '../utils/currency';

const TransactionForm = ({ onSubmit, transaction, isLoading = false, onClose }) => {
  const { activeWallets, activeWalletId } = useWallet();
  const { currency } = useCurrency();
  const { token } = useContext(AuthContext);

  // Dynamic categories from user history
  const { data: categoriesData, mutate: mutateCategories } = useApi(
    token ? 'transactions/categories' : null
  );

  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    customCategory: '',
    amount: '',
    date: '',
    description: '',
    walletId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Predefined baseline categories
  const standardCategories = {
    expense: [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
      'Bills & Utilities', 'Healthcare', 'Education', 'Travel'
    ],
    income: [
      'Salary', 'Freelance', 'Business', 'Investments', 
      'Rental', 'Gifts', 'Bonus'
    ]
  };

  // Dynamic custom categories derived from past transactions
  const customCategories = useMemo(() => {
    const list = formData.type === 'expense'
      ? (categoriesData?.customExpense || [])
      : (categoriesData?.customIncome || []);
    
    // Also include transaction.category if it's custom and not yet indexed
    if (transaction?.category) {
      const cat = transaction.category.trim();
      const stdList = standardCategories[formData.type] || [];
      if (cat && cat !== 'Other' && !stdList.includes(cat) && !list.includes(cat)) {
        return [...list, cat].sort();
      }
    }
    return list;
  }, [categoriesData, formData.type, transaction]);

  useEffect(() => {
    if (transaction) {
      const type = transaction.type || 'expense';
      const category = transaction.category ? transaction.category.trim() : '';
      const stdList = standardCategories[type] || [];
      const isKnown = stdList.includes(category) || customCategories.includes(category);
      const txWalletId = transaction.wallet?._id || transaction.wallet || '';
      
      setFormData({
        type: type,
        category: category,
        customCategory: (!isKnown && category !== 'Other') ? category : '',
        amount: transaction.amount || '',
        date: transaction.date ? transaction.date.substring(0, 10) : '',
        description: transaction.description || '',
        walletId: txWalletId || (activeWalletId !== 'all' ? activeWalletId : activeWallets[0]?._id || '')
      });
    } else {
      const defaultWallet = activeWalletId !== 'all' ? activeWalletId : (activeWallets[0]?._id || '');
      setFormData(prev => ({
        ...prev,
        walletId: prev.walletId || defaultWallet
      }));
    }
  }, [transaction, activeWalletId, activeWallets, customCategories]);

  const validateForm = () => {
    const newErrors = {};
    
    if (activeWallets.length > 0 && !formData.walletId) {
      newErrors.walletId = 'Please select a wallet';
    }
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (formData.category === 'Other' && (!formData.customCategory || !formData.customCategory.trim())) {
      newErrors.customCategory = 'Please specify a category';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!validateForm()) {
      return;
    }

    try {
      const finalCategory =
        formData.category === 'Other'
          ? (formData.customCategory || '').trim()
          : formData.category.trim();

      await onSubmit({
        ...formData,
        category: finalCategory,
        amount: parseFloat(formData.amount),
        walletId: formData.walletId || activeWallets[0]?._id
      });
      
      mutateCategories();
      globalMutate('transactions/categories');
      
      if (!transaction) {
        setFormData({
          type: 'expense',
          category: '',
          customCategory: '',
          amount: '',
          date: '',
          description: '',
          walletId: activeWalletId !== 'all' ? activeWalletId : (activeWallets[0]?._id || '')
        });
        setIsSubmitted(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#10141e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden w-full font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-[#161c2b] p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {formData.type === 'expense' ? (
              <TrendingDown className="w-5 h-5 text-rose-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {transaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Log financial cashflow entry to your ledger
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Transaction Type Segmented Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-slate-100 dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                handleChange('type', 'expense');
                handleChange('category', '');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
                formData.type === 'expense'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                handleChange('type', 'income');
                handleChange('category', '');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-150 ${
                formData.type === 'income'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Wallet Selection */}
        {activeWallets.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Assigned Wallet
            </label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={formData.walletId}
                onChange={(e) => handleChange('walletId', e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                  errors.walletId && isSubmitted
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } focus:outline-none`}
              >
                {activeWallets.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({formatCurrency(w.balance, currency?.locale || 'en-IN', w.currency || 'INR')})
                  </option>
                ))}
              </select>
            </div>
            {errors.walletId && isSubmitted && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.walletId}
              </p>
            )}
          </div>
        )}

        {/* Category & Amount Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('category', val);
                  if (val !== 'Other') {
                    handleChange('customCategory', '');
                  }
                }}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                  errors.category && isSubmitted
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } focus:outline-none`}
              >
                <option value="">Select category</option>
                <optgroup label="Standard Categories">
                  {standardCategories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
                {customCategories.length > 0 && (
                  <optgroup label="Your Custom Categories">
                    {customCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </optgroup>
                )}
                <option value="Other">+ New Custom Category / Other...</option>
              </select>
            </div>
            {errors.category && isSubmitted && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.category}
              </p>
            )}
          </div>


          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Amount
            </label>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-mono transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white placeholder-slate-400 ${
                  errors.amount && isSubmitted
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } focus:outline-none`}
              />
            </div>
            {errors.amount && isSubmitted && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.amount}
              </p>
            )}
          </div>
        </div>

        {/* Custom Category input if 'Other' */}
        {formData.category === 'Other' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Specific Reason / Name
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={formData.customCategory}
                onChange={(e) => handleChange('customCategory', e.target.value)}
                placeholder="Enter custom category"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white placeholder-slate-400 ${
                  errors.customCategory && isSubmitted
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                } focus:outline-none`}
              />
            </div>
            {errors.customCategory && isSubmitted && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.customCategory}
              </p>
            )}
          </div>
        )}

        {/* Date Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
            Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                errors.date && isSubmitted
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.date && isSubmitted && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.date}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
            Description
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g. Grocery run at Whole Foods"
              rows="2"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white placeholder-slate-400 resize-none ${
                errors.description && isSubmitted
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.description && isSubmitted && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.description}
            </p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/[0.06]">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : transaction ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{transaction ? 'Save Changes' : 'Add Transaction'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
