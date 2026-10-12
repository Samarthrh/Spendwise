import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  HeartPulse,
  Film,
  GraduationCap,
  Sparkles,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  MoreHorizontal,
} from 'lucide-react';
import Modal from '../components/Modal';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New category form state
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a category name');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/categories', {
        name: name.trim(),
        type,
        color,
        icon,
      });

      if (res.data.success) {
        setIsAddModalOpen(false);
        setName('');
        fetchCategories();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this custom category?')) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || 'Could not delete category');
      }
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const colorPalette = [
    '#10b981', '#059669', '#3b82f6', '#0284c7', '#f59e0b',
    '#d97706', '#ec4899', '#db2777', '#8b5cf6', '#ef4444',
    '#14b8a6', '#64748b',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Categories & Classification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Default finance taxonomies and user-defined custom categories for expenses and income.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Expense Categories */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Expense Categories ({expenseCategories.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseCategories.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: c.color || '#10b981' }}
                    >
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.isCustom ? 'Custom Category' : 'Default Category'}
                      </span>
                    </div>
                  </div>

                  {c.isCustom && (
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Income Categories ({incomeCategories.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomeCategories.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                      style={{ backgroundColor: c.color || '#059669' }}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {c.isCustom ? 'Custom Category' : 'Default Category'}
                      </span>
                    </div>
                  </div>

                  {c.isCustom && (
                    <button
                      onClick={() => handleDeleteCategory(c._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Custom Category"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-md transition ${
                type === 'expense' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Expense Category
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-md transition ${
                type === 'income' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Income Category
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gym & Fitness, Pet Care, Gadgets"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Badge Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorPalette.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setColor(col)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition ring-offset-1 hover:scale-105"
                  style={{ backgroundColor: col }}
                >
                  {color === col && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
