import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  Globe, 
  Check, 
  LogOut,
  ChevronRight,
  Settings,
  Palette,
  Calendar,
  Sparkles,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';

const ProfilePage = () => {
  const { user, token, logout, updateProfile, changePassword } = useContext(AuthContext);
  const { currency, updateCurrency } = useCurrency();
  const { theme, updateTheme } = useTheme();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const currencies = [
    { code: 'INR', locale: 'en-IN', name: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'USD', locale: 'en-US', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', locale: 'de-DE', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', locale: 'en-GB', name: 'British Pound (£)', symbol: '£' },
    { code: 'JPY', locale: 'ja-JP', name: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'AUD', locale: 'en-AU', name: 'Australian Dollar (A$)', symbol: 'A$' },
    { code: 'CAD', locale: 'en-CA', name: 'Canadian Dollar (C$)', symbol: 'C$' },
  ];
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (user) {
      setEditForm({ username: user.username, email: user.email });
    }
  }, [user]);

  const handleCurrencyChange = async (newCurrency) => {
    setIsUpdating(true);
    try {
      await updateCurrency(newCurrency);
      showSuccess('Display currency updated successfully');
    } catch (error) {
      console.error('Failed to update currency:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleColorThemeChange = async (colorId) => {
    setIsUpdating(true);
    try {
      await updateTheme({ color: colorId });
      showSuccess('Accent theme updated successfully');
    } catch (error) {
      console.error('Failed to update color theme:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    
    const res = await updateProfile(editForm);
    if (res.success) {
      showSuccess('Profile details updated successfully');
      setIsEditing(false);
    } else {
      setError(res.error);
    }
    setIsUpdating(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsUpdating(true);
    setError('');

    const res = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });

    if (res.success) {
      showSuccess('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } else {
      setError(res.error);
    }
    setIsUpdating(false);
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Date and Quarter badge
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const currentMonthIdx = today.getMonth();
  const currentYear = today.getFullYear();
  const fiscalQuarter = currentMonthIdx >= 3 && currentMonthIdx <= 5 ? 'Q1' :
                        currentMonthIdx >= 6 && currentMonthIdx <= 8 ? 'Q2' :
                        currentMonthIdx >= 9 && currentMonthIdx <= 11 ? 'Q3' : 'Q4';
  const fyYear = currentMonthIdx >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080b11] pt-20 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Top Hero Card - Obsidian style */}
        <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/5 dark:shadow-black/40 relative overflow-hidden">
          {/* Top row: Capsule date badge + Live status */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#161c2b] border border-slate-200 dark:border-white/[0.06] text-xs font-mono font-medium text-slate-700 dark:text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{formattedDate} • {fiscalQuarter} FY{fyYear}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Profile
            </div>
          </div>

          {/* User Details row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-blue-600/20 flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0 w-full">
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Username"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start pt-1">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-slate-200/50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-between gap-3 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white truncate">
                      {user?.username}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                      title="Edit Profile"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      {user?.email}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-500">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Personal Account
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preferences Section (Display Currency) */}
        <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Currency & Number Formatting</h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161c2b] text-slate-500 dark:text-zinc-400">
              Active: {currency.code} ({currency.symbol})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currencies.map((curr) => {
              const isSelected = currency.code === curr.code;
              return (
                <button
                  key={curr.code}
                  onClick={() => handleCurrencyChange(curr)}
                  disabled={isUpdating}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-200/80 dark:border-white/[0.05] bg-slate-50/70 dark:bg-[#0b0e17] hover:border-slate-300 dark:hover:border-white/10 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-[#161c2b] text-slate-700 dark:text-zinc-300'
                    }`}>
                      {curr.symbol}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{curr.code}</div>
                      <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{curr.name}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Accent Color Theme */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                Accent Theme Highlights
              </span>
            </div>
            <div className="flex items-center gap-3">
              {[
                { id: 'default', hex: '#2563eb', name: 'Obsidian Blue' },
                { id: 'pink', hex: '#ec4899', name: 'Ruby Pink' },
                { id: 'purple', hex: '#8b5cf6', name: 'Electric Purple' },
                { id: 'emerald', hex: '#10b981', name: 'Fintech Emerald' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleColorThemeChange(t.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    theme.color === t.id
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#10141e] scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: t.hex }}
                  title={t.name}
                >
                  {theme.color === t.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Section (Password) */}
        <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/30">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h2>
            </div>
          </div>

          {!showPasswordSection ? (
            <button
              onClick={() => setShowPasswordSection(true)}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Change Account Password →
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
              <Input
                label="Current Password"
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
              <Input
                label="New Password"
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <Input
                label="Confirm New Password"
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-slate-200/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sign Out Card */}
        <div className="bg-white dark:bg-[#10141e] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl p-5 shadow-xl shadow-black/5 dark:shadow-black/30 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sign Out Session</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Safely log out of this device</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
