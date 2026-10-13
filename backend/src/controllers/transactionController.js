const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');

// @desc    Get all transactions with search, filter, sort, and pagination
// @route   GET /api/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      type,
      category,
      paymentMethod,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      limit = 20,
    } = req.query;

    // Auto-sync: Ensure every saved bill has a corresponding expense transaction
    const unlinkedBills = await Bill.find({
      user: req.user.id,
      $or: [{ linkedTransaction: null }, { linkedTransaction: { $exists: false } }],
    });

    if (unlinkedBills.length > 0) {
      for (const bill of unlinkedBills) {
        const amount = Number(bill.calculatedTotal || bill.printedTotal || 0);
        if (amount > 0) {
          const transaction = await Transaction.create({
            user: req.user.id,
            type: 'expense',
            amount,
            category: bill.suggestedCategory || 'Groceries',
            description: `Bill from ${bill.retailerName}${bill.invoiceNumber ? ` (#${bill.invoiceNumber})` : ''}`,
            date: bill.billDate || bill.createdAt,
            paymentMethod: bill.paymentMethod || 'Other',
            notes: `Created from scanned bill. Line items: ${bill.items?.length || 0}.`,
            sourceBill: bill._id,
          });
          bill.linkedTransaction = transaction._id;
          await bill.save();
        }
      }
    }

    const query = { user: req.user.id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate('sourceBill', 'retailerName invoiceNumber billDate printedTotal calculatedTotal');

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('sourceBill');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new manual transaction
// @route   POST /api/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      type = 'expense',
      amount,
      category,
      description,
      date,
      paymentMethod = 'Cash',
      notes,
      isRecurring = false,
      recurringFrequency = null,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount greater than zero',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category',
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a description',
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      amount: Math.round(Number(amount) * 100) / 100,
      category,
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      notes: notes ? notes.trim() : '',
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : null,
    });

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update an existing transaction
// @route   PUT /api/transactions/:id
exports.updateTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      date,
      paymentMethod,
      notes,
      isRecurring,
      recurringFrequency,
    } = req.body;

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (type) transaction.type = type;
    if (amount !== undefined) transaction.amount = Math.round(Number(amount) * 100) / 100;
    if (category) transaction.category = category;
    if (description) transaction.description = description.trim();
    if (date) transaction.date = new Date(date);
    if (paymentMethod) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes.trim();
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringFrequency !== undefined) transaction.recurringFrequency = recurringFrequency;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If linked to a source bill, unlink the bill so it can be re-linked or reviewed if needed
    if (transaction.sourceBill) {
      await Bill.findByIdAndUpdate(transaction.sourceBill, {
        linkedTransaction: null,
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export/csv
exports.exportTransactionsCsv = async (req, res, next) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Format CSV
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes', 'Is From Scanned Bill'];
    const rows = transactions.map((t) => [
      `"${new Date(t.date).toISOString().split('T')[0]}"`,
      `"${t.type}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${t.paymentMethod}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.sourceBill ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="spendwise-transactions-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};
