const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const Budget = require('../models/Budget');

// @desc    Seed rich sample financial data for demo exploration
// @route   POST /api/demo/seed
exports.seedSampleData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 1. Clear existing transactions, bills, and budgets for this user
    await Transaction.deleteMany({ user: userId });
    await Bill.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });

    // 2. Create Scanned Bills with detailed Line Items
    // Bill 1: DMart Supermarket
    const dmartDate = new Date(currentYear, currentMonth, 4, 15, 30);
    const dmartBill = await Bill.create({
      user: userId,
      retailerName: 'DMart Supermarket',
      retailerAddress: 'Plot 42, Hiranandani Estate, Thane West',
      invoiceNumber: 'DM-2026-9814',
      billDate: dmartDate,
      printedTotal: 124.50,
      subtotal: 119.50,
      taxAmount: 5.00,
      discountAmount: 12.00,
      additionalCharges: 0,
      calculatedTotal: 124.50,
      paymentMethod: 'UPI',
      ocrStatus: 'reviewed',
      reviewStatus: 'confirmed',
      suggestedCategory: 'Groceries',
      documentUrl: null,
      documentType: 'image',
      confidenceScore: 96,
      items: [
        {
          name: 'Daawat Basmati Rice 5kg',
          quantity: 1,
          unitPrice: 18.50,
          discount: 2.00,
          tax: 0.50,
          lineTotal: 17.00,
          category: 'Groceries',
          confidence: 98,
        },
        {
          name: 'Fortune Sunflower Oil 5L',
          quantity: 1,
          unitPrice: 22.00,
          discount: 3.00,
          tax: 1.00,
          lineTotal: 20.00,
          category: 'Groceries',
          confidence: 95,
        },
        {
          name: 'California Raw Almonds 500g',
          quantity: 2,
          unitPrice: 14.00,
          discount: 2.00,
          tax: 0.80,
          lineTotal: 26.80,
          category: 'Groceries',
          confidence: 94,
        },
        {
          name: 'Lindt Dark Chocolate 85%',
          quantity: 3,
          unitPrice: 5.50,
          discount: 1.50,
          tax: 0.70,
          lineTotal: 15.70,
          category: 'Food & Dining',
          confidence: 96,
        },
        {
          name: 'Surf Excel Detergent 3kg',
          quantity: 1,
          unitPrice: 16.00,
          discount: 2.00,
          tax: 1.00,
          lineTotal: 15.00,
          category: 'Groceries',
          confidence: 97,
        },
        {
          name: 'Colgate Total Toothpaste Twin Pack',
          quantity: 2,
          unitPrice: 6.50,
          discount: 1.50,
          tax: 0.50,
          lineTotal: 12.00,
          category: 'Healthcare',
          confidence: 99,
        },
        {
          name: 'Organic Honey 500g',
          quantity: 1,
          unitPrice: 18.00,
          discount: 0,
          tax: 0,
          lineTotal: 18.00,
          category: 'Groceries',
          confidence: 92,
        },
      ],
      rawText: 'DMART SUPERMARKET\nTax Invoice #DM-2026-9814\nSubtotal: $119.50\nGST 5%: $5.00\nTotal Savings: $12.00\nGrand Total: $124.50\nPaid via UPI',
      hasDiscrepancy: false,
    });

    // Create linked transaction for DMart Bill
    const dmartTx = await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 124.50,
      category: 'Groceries',
      description: 'Bill from DMart Supermarket (#DM-2026-9814)',
      date: dmartDate,
      paymentMethod: 'UPI',
      notes: 'Monthly staples and grocery shopping with Smart Bill Scanning.',
      sourceBill: dmartBill._id,
    });
    dmartBill.linkedTransaction = dmartTx._id;
    await dmartBill.save();

    // Bill 2: Reliance Trends
    const trendsDate = new Date(currentYear, currentMonth, 7, 18, 15);
    const trendsBill = await Bill.create({
      user: userId,
      retailerName: 'Reliance Trends',
      retailerAddress: 'Phoenix Marketcity Mall, Ground Floor',
      invoiceNumber: 'RT-884102',
      billDate: trendsDate,
      printedTotal: 189.00,
      subtotal: 180.00,
      taxAmount: 9.00,
      discountAmount: 40.00,
      additionalCharges: 0,
      calculatedTotal: 189.00,
      paymentMethod: 'Credit Card',
      ocrStatus: 'reviewed',
      reviewStatus: 'confirmed',
      suggestedCategory: 'Shopping',
      documentUrl: null,
      documentType: 'image',
      confidenceScore: 94,
      items: [
        {
          name: 'DNMX Slim Fit Cotton Chinos',
          quantity: 1,
          unitPrice: 45.00,
          discount: 10.00,
          tax: 2.25,
          lineTotal: 37.25,
          category: 'Shopping',
          confidence: 96,
        },
        {
          name: 'Netplay Oxford Formal Shirt',
          quantity: 2,
          unitPrice: 38.00,
          discount: 15.00,
          tax: 3.80,
          lineTotal: 64.80,
          category: 'Shopping',
          confidence: 93,
        },
        {
          name: 'Performax Athletic Running Shoes',
          quantity: 1,
          unitPrice: 85.00,
          discount: 15.00,
          tax: 2.95,
          lineTotal: 86.95,
          category: 'Shopping',
          confidence: 95,
        },
      ],
      rawText: 'RELIANCE TRENDS\nInvoice: RT-884102\nItems: 3\nNet Payable: $189.00\nPaid via Credit Card ending in 4092',
      hasDiscrepancy: false,
    });

    const trendsTx = await Transaction.create({
      user: userId,
      type: 'expense',
      amount: 189.00,
      category: 'Shopping',
      description: 'Bill from Reliance Trends (#RT-884102)',
      date: trendsDate,
      paymentMethod: 'Credit Card',
      notes: 'Workwear and running shoes.',
      sourceBill: trendsBill._id,
    });
    trendsBill.linkedTransaction = trendsTx._id;
    await trendsBill.save();

    // 3. Create Additional Transactions for Current Month
    const currentMonthTransactions = [
      // Income
      {
        user: userId,
        type: 'income',
        amount: 4500.00,
        category: 'Salary',
        description: 'Monthly Tech Salary - Senior Engineering',
        date: new Date(currentYear, currentMonth, 1, 9, 0),
        paymentMethod: 'Net Banking',
        notes: 'Direct deposit salary credit',
      },
      {
        user: userId,
        type: 'income',
        amount: 850.00,
        category: 'Freelance',
        description: 'Full-stack UI consulting project',
        date: new Date(currentYear, currentMonth, 5, 14, 0),
        paymentMethod: 'UPI',
        notes: 'Milestone 2 payout',
      },
      // Expenses
      {
        user: userId,
        type: 'expense',
        amount: 85.00,
        category: 'Food & Dining',
        description: 'Dinner at Olive Bistro & Bar',
        date: new Date(currentYear, currentMonth, 2, 20, 30),
        paymentMethod: 'Credit Card',
        notes: 'Weekend dinner with family',
      },
      {
        user: userId,
        type: 'expense',
        amount: 42.50,
        category: 'Transport',
        description: 'Fuel Refill at Shell Station',
        date: new Date(currentYear, currentMonth, 3, 11, 0),
        paymentMethod: 'Debit Card',
        notes: 'Full tank petrol',
      },
      {
        user: userId,
        type: 'expense',
        amount: 75.00,
        category: 'Bills & Utilities',
        description: 'High-speed Fiber Broadband Bill',
        date: new Date(currentYear, currentMonth, 6, 10, 0),
        paymentMethod: 'Net Banking',
        notes: 'Monthly Gigabit internet plan',
      },
      {
        user: userId,
        type: 'expense',
        amount: 32.00,
        category: 'Healthcare',
        description: 'Apollo Pharmacy Medicines & Multivitamins',
        date: new Date(currentYear, currentMonth, 8, 16, 20),
        paymentMethod: 'UPI',
        notes: 'Monthly vitamins & prescription refills',
      },
      {
        user: userId,
        type: 'expense',
        amount: 28.50,
        category: 'Entertainment',
        description: 'PVR Cinema Tickets - IMAX 3D',
        date: new Date(currentYear, currentMonth, 9, 19, 0),
        paymentMethod: 'UPI',
        notes: 'Movie night tickets and popcorn',
      },
      {
        user: userId,
        type: 'expense',
        amount: 14.50,
        category: 'Food & Dining',
        description: 'Artisan Coffee & Croissant at Blue Tokai',
        date: new Date(currentYear, currentMonth, 10, 9, 30),
        paymentMethod: 'Cash',
        notes: 'Morning coffee work session',
      },
    ];

    await Transaction.insertMany(currentMonthTransactions);

    // 4. Create Previous Months' Historical Data for Trends Chart
    const historyTransactions = [];
    for (let mOffset = 1; mOffset <= 5; mOffset++) {
      const prevDate = new Date(currentYear, currentMonth - mOffset, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth();

      // Salary
      historyTransactions.push({
        user: userId,
        type: 'income',
        amount: 4500.00,
        category: 'Salary',
        description: 'Monthly Salary Credit',
        date: new Date(prevYear, prevMonth, 1, 9, 0),
        paymentMethod: 'Net Banking',
      });

      // Bonus / Freelance in alternate months
      if (mOffset % 2 === 1) {
        historyTransactions.push({
          user: userId,
          type: 'income',
          amount: 600.00 + mOffset * 50,
          category: 'Freelance',
          description: 'Web development freelance contract',
          date: new Date(prevYear, prevMonth, 15, 12, 0),
          paymentMethod: 'Net Banking',
        });
      }

      // Expenses distributed across categories
      const expenses = [
        { cat: 'Groceries', base: 450 + (mOffset * 20), day: 5 },
        { cat: 'Food & Dining', base: 280 + (mOffset * 15), day: 10 },
        { cat: 'Shopping', base: 320 - (mOffset * 10), day: 14 },
        { cat: 'Transport', base: 120 + (mOffset * 5), day: 18 },
        { cat: 'Bills & Utilities', base: 150, day: 22 },
        { cat: 'Healthcare', base: 65, day: 25 },
      ];

      expenses.forEach((e) => {
        historyTransactions.push({
          user: userId,
          type: 'expense',
          amount: e.base,
          category: e.cat,
          description: `Monthly ${e.cat} expense`,
          date: new Date(prevYear, prevMonth, e.day, 14, 0),
          paymentMethod: 'Credit Card',
        });
      });
    }

    await Transaction.insertMany(historyTransactions);

    // 5. Create Realistic Budget for current month
    const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    await Budget.create({
      user: userId,
      period: currentPeriod,
      overallLimit: 2500,
      categories: [
        { category: 'Groceries', limit: 500 },
        { category: 'Food & Dining', limit: 350 },
        { category: 'Shopping', limit: 400 },
        { category: 'Transport', limit: 200 },
        { category: 'Bills & Utilities', limit: 250 },
        { category: 'Healthcare', limit: 150 },
        { category: 'Entertainment', limit: 150 },
      ],
    });

    res.status(200).json({
      success: true,
      message: 'Demo dataset successfully loaded! You now have realistic transactions, budgets, and scanned bills.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear all user data to start fresh
// @route   POST /api/demo/clear
exports.clearUserData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Transaction.deleteMany({ user: userId });
    await Bill.deleteMany({ user: userId });
    await Budget.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: 'All your financial records have been reset.',
    });
  } catch (err) {
    next(err);
  }
};
