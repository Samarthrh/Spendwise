import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const AddTransactionModal = ({
  isOpen,
  onClose,
  onTransactionSaved,
  initialData = null,
  defaultType = 'expense',
}) => {
  const { symbol } = useCurrency();

  const [type, setType] = useState(defaultType || 'expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(defaultType === 'income' ? 'Salary' : 'Groceries');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data);
        }
      } catch (e) {
        console.warn('Could not load categories:', e);
      }
    };

    if (isOpen) {
      fetchCategories();
      if (initialData) {
        setType(initialData.type || 'expense');
        setAmount(initialData.amount || '');
        setCategory(initialData.category || (initialData.type === 'income' ? 'Salary' : 'Groceries'));
        setDescription(initialData.description || '');
        setDate(initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setPaymentMethod(initialData.paymentMethod || 'Cash');
        setNotes(initialData.notes || '');
        setIsRecurring(Boolean(initialData.isRecurring));
        setRecurringFrequency(initialData.recurringFrequency || 'monthly');
      } else {
        // Reset defaults matching the requested defaultType
        const initialType = defaultType === 'income' ? 'income' : 'expense';
        setType(initialType);
        setAmount('');
        setCategory(initialType === 'income' ? 'Salary' : 'Groceries');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('Cash');
        setNotes('');
        setIsRecurring(false);
        setRecurringFrequency('monthly');
      }
      setError('');
    }
  }, [isOpen, initialData, defaultType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        amount: parsedAmount,
        category,
        description: description.trim(),
        date,
        paymentMethod,
        notes: notes.trim(),
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null,
      };

      let res;
      if (initialData && initialData._id) {
        res = await api.put(`/transactions/${initialData._id}`, payload);
      } else {
        res = await api.post('/transactions', payload);
      }

      if (res.data.success) {
        onTransactionSaved(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : (type === 'income' ? 'Record Income' : 'Record Expense')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Groceries');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition ${
              type === 'expense'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Salary');
            }}
            className={`py-2 text-xs font-semibold rounded-md transition ${
              type === 'income'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Amount ({symbol}) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-semibold text-sm">
              {symbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold text-base focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
            />
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === 'income'
                ? 'e.g. Monthly Salary, Freelance project, Investment return'
                : 'e.g. DMart grocery run, Team lunch, Freelance gig'
            }
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
          />
        </div>

        {/* Category & Payment Method Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Transaction Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
          />
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any extra details or reference numbers..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden transition"
          />
        </div>

        {/* Recurring Switch */}
        <div className="pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
            />
            <span className="text-xs font-medium text-slate-700">Recurring Transaction</span>
          </label>
          {isRecurring && (
            <div className="mt-2 pl-6">
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update Record' : (type === 'income' ? 'Save Income' : 'Save Expense')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTransactionModal;
