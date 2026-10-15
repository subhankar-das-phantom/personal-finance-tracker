// frontend/src/components/BudgetForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Coins, Calendar, Tag, Save, Loader, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const BudgetForm = ({ onClose, onSubmit, goal = null }) => {
  const [formData, setFormData] = useState({
    category: '',
    customCategory: '',
    amount: '',
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { token } = useContext(AuthContext);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);

  useEffect(() => {
    if (goal) {
      setFormData({
        category: goal.category,
        customCategory: '',
        amount: goal.amount.toString(),
        month: goal.month,
        year: goal.year
      });
    }
  }, [goal]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const response = await api.get('/budget/categories');
        setAvailableCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [token]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (formData.category === 'Other' && (!formData.customCategory || !formData.customCategory.trim())) {
      newErrors.customCategory = 'Please specify a category';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
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
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const budgetData = {
        ...formData,
        category: formData.category === 'Other' ? formData.customCategory : formData.category,
        amount: parseFloat(formData.amount),
        month: parseInt(formData.month),
        year: parseInt(formData.year)
      };
      await onSubmit(budgetData);
    } catch (error) {
      console.error('Error saving budget goal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#10141e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-w-md w-full font-sans text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-[#161c2b] p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {goal ? 'Edit Budget Target' : 'Define Spending Cap'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Set monthly category limits to control outflows
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Category Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
            Expense Category
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                errors.category && isSubmitted
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } focus:outline-none`}
            >
              <option value="">Select a category</option>
              {[
                'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
                'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
              ].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              {availableCategories
                .filter(cat => ![
                  'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
                  'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Other'
                ].includes(cat.category))
                .map((cat) => (
                  <option key={cat.category} value={cat.category}>{cat.category}</option>
              ))}
            </select>
          </div>
          {errors.category && isSubmitted && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.category}
            </p>
          )}
        </div>

        {formData.category === 'Other' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Custom Category Label
            </label>
            <input
              type="text"
              value={formData.customCategory}
              onChange={(e) => handleChange('customCategory', e.target.value)}
              placeholder="e.g. Subscriptions"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                errors.customCategory && isSubmitted
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } focus:outline-none`}
            />
          </div>
        )}

        {/* Amount Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
            Monthly Cap Limit
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
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-mono font-semibold transition-all duration-150 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white ${
                errors.amount && isSubmitted
                  ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
              } focus:outline-none`}
            />
          </div>
          {errors.amount && isSubmitted && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.amount}
            </p>
          )}
        </div>

        {/* Month and Year Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Cycle Month
            </label>
            <select
              value={formData.month}
              onChange={(e) => handleChange('month', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Fiscal Year
            </label>
            <select
              value={formData.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0e17] text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Month/Year Display */}
        <div className="bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-white/[0.06] rounded-xl p-3 flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>Active for <strong className="text-slate-900 dark:text-white">{months[formData.month]} {formData.year}</strong></span>
        </div>

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{goal ? 'Update Target' : 'Set Cap Target'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;
