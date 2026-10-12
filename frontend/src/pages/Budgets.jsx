import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const Budgets = () => {
  const { symbol, formatAmount } = useCurrency();

  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [editOverallLimit, setEditOverallLimit] = useState(2000);
  const [editCategories, setEditCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/budgets?period=${period}`);
      if (res.data.success) {
        setBudgetData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [period]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setAvailableCategories(res.data.data.filter((c) => c.type === 'expense'));
        }
      } catch (e) {
        console.warn('Could not load categories:', e);
      }
    };
    loadCategories();
  }, []);

  const openEditModal = () => {
    if (budgetData) {
      setEditOverallLimit(budgetData.overallLimit || 2000);
      setEditCategories(
        (budgetData.categories || []).map((c) => ({
          category: c.category,
          limit: c.limit,
        }))
      );
    }
    setIsEditModalOpen(true);
  };

  const handleAddCategoryBudget = () => {
    if (!newCatName || !newCatLimit || Number(newCatLimit) <= 0) return;

    if (editCategories.some((c) => c.category === newCatName)) {
      alert('A budget for this category is already added');
      return;
    }

    setEditCategories((prev) => [
      ...prev,
      { category: newCatName, limit: parseFloat(newCatLimit) },
    ]);
    setNewCatName('');
    setNewCatLimit('');
  };

  const handleRemoveCategoryBudget = (categoryName) => {
    setEditCategories((prev) => prev.filter((c) => c.category !== categoryName));
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/budgets', {
        period,
        overallLimit: Number(editOverallLimit),
        categories: editCategories,
      });
      setIsEditModalOpen(false);
      fetchBudget();
    } catch (err) {
      alert('Failed to update budget: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const {
    overallLimit = 2000,
    totalSpent = 0,
    remaining = 0,
    percentage = 0,
    status = 'normal',
    categories: categoryList = [],
  } = budgetData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Budget Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set spending targets, monitor category utilization, and prevent overspending.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Month Period Selector */}
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-emerald-600 outline-hidden"
          />

          <button
            onClick={openEditModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Budgets</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Main Overall Monthly Budget Hero Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Overall Monthly Spending Cap
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900 font-mono">
                    {formatAmount(totalSpent)}
                  </h2>
                  <span className="text-sm font-semibold text-slate-500">
                    of {formatAmount(overallLimit)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {status === 'exceeded' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Exceeded by {formatAmount(totalSpent - overallLimit)}</span>
                  </span>
                )}
                {status === 'warning' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Warning: &gt;80% Cap Reached</span>
                  </span>
                )}
                {status === 'normal' && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Safe: {formatAmount(remaining)} remaining</span>
                  </span>
                )}
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Utilization</span>
                <span
                  className={
                    status === 'exceeded'
                      ? 'text-rose-600'
                      : status === 'warning'
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }
                >
                  {percentage}%
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    status === 'exceeded'
                      ? 'bg-rose-500'
                      : status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category Budgets Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Category Spending Targets
                </h3>
                <p className="text-[11px] text-slate-500">
                  Calculated dynamically from real transactions saved in this period
                </p>
              </div>

              <button
                onClick={openEditModal}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                + Add Category Target
              </button>
            </div>

            {categoryList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryList.map((cat) => (
                  <div
                    key={cat.category}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{cat.category}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            cat.status === 'exceeded'
                              ? 'bg-rose-100 text-rose-700'
                              : cat.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cat.percentage}%
                        </span>
                      </div>

                      <div className="flex items-baseline space-x-1 mb-3">
                        <span className="text-xl font-bold text-slate-900 font-mono">
                          {formatAmount(cat.spent)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          / {formatAmount(cat.limit)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            cat.status === 'exceeded'
                              ? 'bg-rose-500'
                              : cat.status === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Remaining</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {formatAmount(cat.remaining)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center max-w-md mx-auto">
                <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">No Category Budgets Configured</h4>
                <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
                  Allocate individual spending limits for Groceries, Dining, Shopping, and more to keep category costs under control.
                </p>
                <button
                  onClick={openEditModal}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  Configure Category Limits
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit Budget Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Set Budget Limits — ${period}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveBudget} className="space-y-5">
          {/* Overall Limit Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monthly Overall Spending Limit ({symbol}) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-500 text-sm">
                {symbol}
              </span>
              <input
                type="number"
                step="50"
                min="0"
                required
                value={editOverallLimit}
                onChange={(e) => setEditOverallLimit(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your overall ceiling across all spending categories for this month.
            </p>
          </div>

          {/* Category Budgets Manager */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Category-Specific Limits
            </label>

            {/* Existing category list in edit form */}
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {editCategories.map((c, idx) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <span className="font-semibold text-slate-800">{c.category}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 font-mono">
                      {symbol}{Number(c.limit).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryBudget(c.category)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Category Budget Sub-form */}
            <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                Add New Category Target
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-medium"
                >
                  <option value="">Select Category...</option>
                  {availableCategories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center font-semibold text-slate-400 text-xs">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    step="25"
                    min="1"
                    placeholder="Limit"
                    value={newCatLimit}
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-hidden font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCategoryBudget}
                disabled={!newCatName || !newCatLimit}
                className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
              >
                Add Category Target
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Budget Settings'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
