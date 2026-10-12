const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const User = require('../models/User');

// @desc    Get complete real-time dashboard summary calculated from database transactions
// @route   GET /api/reports/dashboard
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const period = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // 1. Current Month Totals (Income and Expense)
    const monthStats = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalExpense = 0;
    let totalIncome = 0;
    monthStats.forEach((s) => {
      if (s._id === 'expense') totalExpense = Math.round(s.total * 100) / 100;
      if (s._id === 'income') totalIncome = Math.round(s.total * 100) / 100;
    });

    const netSavings = Math.round((totalIncome - totalExpense) * 100) / 100;

    // 2. Budget status
    let budget = await Budget.findOne({ user: user._id, period });
    const budgetLimit = budget ? budget.overallLimit : (user.monthlyBudgetLimit || 2000);
    const remainingBudget = Math.max(0, Math.round((budgetLimit - totalExpense) * 100) / 100);
    const budgetUtilization = budgetLimit > 0 ? Math.min(Math.round((totalExpense / budgetLimit) * 100), 1000) : 0;

    let budgetStatus = 'normal';
    if (budgetUtilization >= 100) budgetStatus = 'exceeded';
    else if (budgetUtilization >= 80) budgetStatus = 'warning';

    // 3. Category Breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    const formattedCategoryBreakdown = categoryBreakdown.map((item) => ({
      category: item._id,
      amount: Math.round(item.total * 100) / 100,
      percentage: totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0,
      count: item.count,
    }));

    // 4. Last 6 Months Spending & Income Trend
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
    const monthlyTrendsAgg = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          date: { $gte: sixMonthsAgo, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Build continuous array for 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      const monthLabel = `${monthNames[m - 1]} ${y === currentYear ? '' : y}`.trim();

      const expItem = monthlyTrendsAgg.find((t) => t._id.year === y && t._id.month === m && t._id.type === 'expense');
      const incItem = monthlyTrendsAgg.find((t) => t._id.year === y && t._id.month === m && t._id.type === 'income');

      monthlyTrends.push({
        month: monthLabel,
        year: y,
        monthIndex: m,
        expense: expItem ? Math.round(expItem.total * 100) / 100 : 0,
        income: incItem ? Math.round(incItem.total * 100) / 100 : 0,
      });
    }

    // 5. Recent 5 Transactions
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .populate('sourceBill', 'retailerName invoiceNumber');

    res.status(200).json({
      success: true,
      data: {
        totalExpense,
        totalIncome,
        netSavings,
        budgetLimit,
        remainingBudget,
        budgetUtilization,
        budgetStatus,
        categoryBreakdown: formattedCategoryBreakdown,
        monthlyTrends,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed analytics and reports with customizable filters
// @route   GET /api/reports/analytics
exports.getAnalyticsReports = async (req, res, next) => {
  try {
    const { timeRange = 'month' } = req.query; // 'week', 'month', 'year', 'all'
    const now = new Date();
    let startDate = new Date();

    if (timeRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(2000, 0, 1);
    }

    const query = {
      user: req.user.id,
      date: { $gte: startDate, $lte: now },
    };

    // Category breakdown
    const categoryStats = await Transaction.aggregate([
      { $match: { ...query, type: 'expense' } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = categoryStats.reduce((acc, curr) => acc + curr.total, 0);

    const categories = categoryStats.map((c) => ({
      category: c._id,
      amount: Math.round(c.total * 100) / 100,
      percentage: totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0,
      count: c.count,
    }));

    // Payment methods breakdown
    const paymentStats = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Daily spending trend over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: thirtyDaysAgo, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalExpense: Math.round(totalExpense * 100) / 100,
        categories,
        paymentMethods: paymentStats.map((p) => ({
          method: p._id || 'Other',
          amount: Math.round(p.total * 100) / 100,
          count: p.count,
        })),
        dailySpending: dailyStats.map((d) => ({
          date: d._id,
          amount: Math.round(d.total * 100) / 100,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
