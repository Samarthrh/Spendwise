const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: [0, 'Category budget limit cannot be negative'],
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    period: {
      type: String, // 'YYYY-MM' format
      required: true,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Period must be in YYYY-MM format'],
    },
    overallLimit: {
      type: Number,
      required: true,
      min: [0, 'Overall limit cannot be negative'],
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    categories: [categoryBudgetSchema],
  },
  {
    timestamps: true,
  }
);

// Unique budget per user per period
budgetSchema.index({ user: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
