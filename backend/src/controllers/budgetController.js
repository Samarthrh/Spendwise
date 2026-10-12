const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Helper to get current YYYY-MM
function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// @desc    Get budget for a specific period (default current month) with actual spent data
// @route   GET /api/budgets
exports.getBudgets = async (req, res, next) => {
  try {
    const period = req.query.period || getCurrentPeriod();
    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Fetch user to get default monthlyBudgetLimit if budget record doesn't exist
    const user = await User.findById(req.user.id);
    let budget = await Budget.findOne({ user: req.user.id, period });

    if (!budget) {
      // Create initial budget from user's preference
      budget = await Budget.create({
        user: req.user.id,
        period,
        overallLimit: user.monthlyBudgetLimit || 2000,
        categories: [],
      });
    }

    // 2. Aggregate actual expenses for this period
    const expenseAggregation = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalSpent = 0;
    const spendingByCategory = {};
    expenseAggregation.forEach((item) => {
      const rounded = Math.round(item.totalSpent * 100) / 100;
      spendingByCategory[item._id] = rounded;
      totalSpent += rounded;
    });
    totalSpent = Math.round(totalSpent * 100) / 100;

    // 3. Merge category limits with actual spending
    const categoryStatus = (budget.categories || []).map((cat) => {
      const spent = spendingByCategory[cat.category] || 0;
      const limit = cat.limit;
      const remaining = Math.max(0, Math.round((limit - spent) * 100) / 100);
      const percentage = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 1000) : 0;
      let status = 'normal';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        category: cat.category,
        limit,
        spent,
        remaining,
        percentage,
        status,
      };
    });

    const overallRemaining = Math.max(0, Math.round((budget.overallLimit - totalSpent) * 100) / 100);
    const overallPercentage = budget.overallLimit > 0 ? Math.min(Math.round((totalSpent / budget.overallLimit) * 100), 1000) : 0;
    let overallStatus = 'normal';
    if (overallPercentage >= 100) overallStatus = 'exceeded';
    else if (overallPercentage >= 80) overallStatus = 'warning';

    res.status(200).json({
      success: true,
      data: {
        _id: budget._id,
        period: budget.period,
        overallLimit: budget.overallLimit,
        totalSpent,
        remaining: overallRemaining,
        percentage: overallPercentage,
        status: overallStatus,
        categories: categoryStatus,
        allCategorySpending: spendingByCategory,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upsert budget limits (overall and categories)
// @route   POST /api/budgets
exports.upsertBudget = async (req, res, next) => {
  try {
    const { period = getCurrentPeriod(), overallLimit, categories = [] } = req.body;

    if (overallLimit === undefined || Number(overallLimit) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid overall budget limit',
      });
    }

    const validatedCategories = (categories || []).map((cat) => ({
      category: cat.category.trim(),
      limit: Math.max(0, Number(cat.limit) || 0),
    }));

    let budget = await Budget.findOne({ user: req.user.id, period });

    if (budget) {
      budget.overallLimit = Number(overallLimit);
      budget.categories = validatedCategories;
      await budget.save();
    } else {
      budget = await Budget.create({
        user: req.user.id,
        period,
        overallLimit: Number(overallLimit),
        categories: validatedCategories,
      });
    }

    // Also update user's default monthly limit
    await User.findByIdAndUpdate(req.user.id, { monthlyBudgetLimit: Number(overallLimit) });

    res.status(200).json({
      success: true,
      message: 'Budget settings updated successfully',
      data: budget,
    });
  } catch (err) {
    next(err);
  }
};
