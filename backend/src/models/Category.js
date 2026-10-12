const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  { name: 'Groceries', type: 'expense', icon: 'ShoppingCart', color: '#10b981' },
  { name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f59e0b' },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#3b82f6' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Receipt', color: '#8b5cf6' },
  { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#14b8a6' },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#6366f1' },
  { name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#f97316' },
  { name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#059669' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#0284c7' },
  { name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#7c3aed' },
  { name: 'Gifts & Allowance', type: 'income', icon: 'Gift', color: '#db2777' },
  { name: 'Other Income', type: 'income', icon: 'Coins', color: '#475569' },
];

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['expense', 'income'],
      default: 'expense',
    },
    icon: {
      type: String,
      default: 'Tag',
    },
    color: {
      type: String,
      default: '#10b981',
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system default categories
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user custom categories
categorySchema.index({ user: 1, name: 1 });

module.exports = {
  Category: mongoose.model('Category', categorySchema),
  DEFAULT_CATEGORIES,
};
