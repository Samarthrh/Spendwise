import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  DollarSign,
  Lock,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Cpu,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const { symbol } = useCurrency();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'USD');
  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(user?.monthlyBudgetLimit || 2000);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Demo seed state
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');

  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem('spendwise_gemini_api_key') || ''
  );
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || 'USD');
      setMonthlyBudgetLimit(user.monthlyBudgetLimit || 2000);
      if (user.geminiApiKey) {
        setGeminiApiKey(user.geminiApiKey);
        localStorage.setItem('spendwise_gemini_api_key', user.geminiApiKey);
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ text: '', type: '' });

    try {
      const cleanKey = geminiApiKey.trim();
      if (cleanKey) {
        localStorage.setItem('spendwise_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('spendwise_gemini_api_key');
      }

      const res = await api.put('/auth/profile', {
        name: name.trim(),
        currency,
        monthlyBudgetLimit: Number(monthlyBudgetLimit) || 2000,
        geminiApiKey: cleanKey,
      });

      if (res.data.success) {
        updateUser(res.data.user);
        setProfileMsg({ text: 'Profile & AI OCR preferences saved successfully!', type: 'success' });
        setTimeout(() => setProfileMsg({ text: '', type: '' }), 4000);
      }
    } catch (err) {
      setProfileMsg({
        text: err.response?.data?.message || 'Failed to update profile settings',
        type: 'error',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setPasswordMsg({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMsg({ text: '', type: '' }), 4000);
      }
    } catch (err) {
      setPasswordMsg({
        text: err.response?.data?.message || 'Failed to change password. Verify your current password.',
        type: 'error',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (window.confirm('Load rich sample financial data? This adds authentic DMart and Reliance Trends bills, multi-month trends, and category budgets to your account.')) {
      setDemoLoading(true);
      setDemoMsg('');
      try {
        const res = await api.post('/demo/seed');
        if (res.data.success) {
          setDemoMsg('Sample data loaded! Redirecting to Dashboard...');
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      } catch (err) {
        alert('Failed to load demo data: ' + (err.response?.data?.message || err.message));
      } finally {
        setDemoLoading(false);
      }
    }
  };

  const handleClearData = async () => {
    if (window.confirm('Reset all financial records? All your transactions, scanned bills, and budgets will be permanently deleted.')) {
      try {
        await api.post('/demo/clear');
        alert('All financial records have been reset.');
        window.location.href = '/dashboard';
      } catch (err) {
        alert('Failed to reset records: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-100">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, preferred currency symbol, monthly budgets, and demo data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Details & Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Personal Preferences</span>
          </h2>

          {profileMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-500 font-medium cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email cannot be changed directly for security purposes.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency Preference
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (CA$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Monthly Cap ({symbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={monthlyBudgetLimit}
                  onChange={(e) => setMonthlyBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="mt-2 w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs md:text-sm font-semibold transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>Security & Password</span>
          </h2>

          {passwordMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="mt-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs md:text-sm font-semibold transition shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>

        {/* Smart Bill OCR Engine Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-700" />
              <span>Smart Bill OCR Engine (Google Gemini 3.8 Flash Multimodal AI)</span>
            </h2>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Gemini 3.8 Flash Active (System-Wide Default)</span>
            </span>
          </div>

          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            SpendWise uses advanced multimodal AI vision to recognize any bill format with near 100% precision — including blurred thermal receipts, crumpled paper, and complex tables from <strong>DMart, Smart Bazaar, Flipkart, Amazon, Swiggy, FirstCry, Myntra, Ajio, Tanishq, Airtel, Jio, PhonePe, Google Pay, and Reliance Digital</strong>.
          </p>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl mb-4 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>System-Wide AI Key Enabled:</span>
              </span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              This system is pre-configured with a shared AI Vision key. <strong>All users on this website</strong> can scan bills and receipts immediately with full multimodal AI accuracy.
            </p>
            <p className="text-slate-500 text-[10px]">
              (Optional: You can paste your own personal API key below if you wish to override the system key for your account).
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>AI Vision API Key</span>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showApiKey ? 'Hide' : 'Show Key'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Saved securely in your browser & account. Leave empty to use SpendWise's built-in local OCR engine.
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="py-2 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs md:text-sm font-semibold transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'Saving...' : 'Save API Key'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Demo Controls & Data Reset */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Demo Playground & Data Management</span>
        </h2>

        {demoMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
            {demoMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Load Sample Data */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs text-emerald-950 mb-1">
                Seed Rich Sample Financial Dataset
              </h3>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                Immediately fill your SpendWise workspace with authentic DMart & Reliance Trends receipts, multi-month spending trends, categorized expenses, and budgets.
              </p>
            </div>
            <button
              onClick={handleSeedDemoData}
              disabled={demoLoading}
              className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoLoading ? 'Populating Records...' : 'Load Sample Financial Data'}</span>
            </button>
          </div>

          {/* Reset All Data */}
          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs text-rose-950 mb-1">
                Clear All Personal Financial Data
              </h3>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                Permanently wipes all transactions, scanned bills, and budget targets associated with your account so you can start completely fresh.
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Wipe All Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
