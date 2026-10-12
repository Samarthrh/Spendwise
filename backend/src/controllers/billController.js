const fs = require('fs');
const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const { processBillDocument } = require('../services/ocr/ocrService');

// @desc    Upload receipt file, run OCR extraction, return initial parsed bill
// @route   POST /api/bills/scan
exports.uploadAndProcessBill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image or PDF bill file',
      });
    }

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = req.file.mimetype;
    const originalName = req.file.originalname;

    let parsedData;
    let ocrStatus = 'completed';

    try {
      parsedData = await processBillDocument(fileBuffer, mimeType, originalName);
    } catch (ocrError) {
      console.warn('OCR processing error:', ocrError.message);
      ocrStatus = 'failed';
      parsedData = {
        retailerName: 'Retail Store',
        retailerAddress: '',
        invoiceNumber: '',
        billDate: new Date(),
        billTime: null,
        printedTotal: null,
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        additionalCharges: 0,
        calculatedTotal: 0,
        paymentMethod: 'Cash',
        suggestedCategory: 'Groceries',
        items: [],
        rawText: '',
        confidenceScore: 0,
        hasDiscrepancy: false,
        discrepancyNote: 'OCR could not automatically read this document. You can still manually input or adjust the items below.',
      };
    }

    // Save pending bill document in database
    const bill = await Bill.create({
      user: req.user.id,
      retailerName: parsedData.retailerName,
      retailerAddress: parsedData.retailerAddress || '',
      invoiceNumber: parsedData.invoiceNumber || '',
      billDate: parsedData.billDate || new Date(),
      printedTotal: parsedData.printedTotal,
      subtotal: parsedData.subtotal || 0,
      taxAmount: parsedData.taxAmount || 0,
      discountAmount: parsedData.discountAmount || 0,
      additionalCharges: parsedData.additionalCharges || 0,
      calculatedTotal: parsedData.calculatedTotal || 0,
      paymentMethod: parsedData.paymentMethod || 'Cash',
      ocrStatus,
      reviewStatus: 'pending',
      suggestedCategory: parsedData.suggestedCategory || 'Groceries',
      documentUrl: `/uploads/${req.file.filename}`,
      documentType: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image',
      confidenceScore: parsedData.confidenceScore || 85,
      items: parsedData.items || [],
      rawText: parsedData.rawText || '',
      hasDiscrepancy: Boolean(parsedData.hasDiscrepancy),
      discrepancyNote: parsedData.discrepancyNote || '',
    });

    res.status(200).json({
      success: true,
      message: 'Bill uploaded and processed successfully. Please review and edit before saving.',
      data: bill,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all bills for current user
// @route   GET /api/bills
exports.getBills = async (req, res, next) => {
  try {
    const { status, reviewStatus } = req.query;
    const query = { user: req.user.id };

    if (status) query.ocrStatus = status;
    if (reviewStatus) query.reviewStatus = reviewStatus;

    const bills = await Bill.find(query)
      .sort({ createdAt: -1 })
      .populate('linkedTransaction');

    res.status(200).json({
      success: true,
      count: bills.length,
      data: bills,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get bill by ID
// @route   GET /api/bills/:id
exports.getBillById = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('linkedTransaction');

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm reviewed bill, recalculate totals, and create/link Expense Transaction
// @route   POST /api/bills/:id/confirm
exports.confirmAndSaveBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    const {
      retailerName,
      retailerAddress,
      invoiceNumber,
      billDate,
      printedTotal,
      subtotal,
      taxAmount = 0,
      discountAmount = 0,
      additionalCharges = 0,
      paymentMethod = 'Cash',
      category = 'Groceries',
      items = [],
    } = req.body;

    // Recalculate line totals and check math integrity
    let calculatedSubtotal = 0;
    const validatedItems = (items || []).map((item) => {
      const qty = Math.max(0.01, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const disc = Math.max(0, Number(item.discount) || 0);
      const tax = Math.max(0, Number(item.tax) || 0);
      // Item line total = (qty * unitPrice) - discount + tax
      const lineTotal = Math.round((qty * unitPrice - disc + tax) * 100) / 100;
      calculatedSubtotal += lineTotal;

      return {
        name: (item.name || 'Item').trim(),
        quantity: qty,
        unitPrice,
        discount: disc,
        tax,
        lineTotal,
        category: item.category || category,
        confidence: item.confidence || 100, // Manually reviewed items get high confidence
        isFlagged: false,
      };
    });

    const finalSubtotal = subtotal !== undefined && Number(subtotal) > 0 ? Number(subtotal) : Math.round(calculatedSubtotal * 100) / 100;
    const finalCalculatedTotal = Math.round(
      (finalSubtotal + Number(taxAmount) - Number(discountAmount) + Number(additionalCharges)) * 100
    ) / 100;

    if (finalCalculatedTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'The total bill amount must be greater than zero.',
      });
    }

    // Check for discrepancy between user printed total and final calculated total
    let hasDiscrepancy = false;
    let discrepancyNote = '';
    if (printedTotal !== undefined && printedTotal !== null && Number(printedTotal) > 0) {
      const diff = Math.abs(Number(printedTotal) - finalCalculatedTotal);
      if (diff > 0.05) {
        hasDiscrepancy = true;
        discrepancyNote = `Printed bill total (${Number(printedTotal).toFixed(2)}) differs from calculated total (${finalCalculatedTotal.toFixed(2)}) by ${diff.toFixed(2)}.`;
      }
    }

    // Update bill
    bill.retailerName = (retailerName || bill.retailerName || 'Retail Store').trim();
    if (retailerAddress !== undefined) bill.retailerAddress = retailerAddress.trim();
    if (invoiceNumber !== undefined) bill.invoiceNumber = invoiceNumber.trim();
    if (billDate) bill.billDate = new Date(billDate);
    if (printedTotal !== undefined) bill.printedTotal = printedTotal;
    bill.subtotal = finalSubtotal;
    bill.taxAmount = Number(taxAmount);
    bill.discountAmount = Number(discountAmount);
    bill.additionalCharges = Number(additionalCharges);
    bill.calculatedTotal = finalCalculatedTotal;
    bill.paymentMethod = paymentMethod;
    bill.suggestedCategory = category;
    bill.items = validatedItems;
    bill.reviewStatus = 'confirmed';
    bill.ocrStatus = 'reviewed';
    bill.hasDiscrepancy = hasDiscrepancy;
    bill.discrepancyNote = discrepancyNote;

    // Prevent duplicate transaction: If bill already has a linked transaction, update it instead of creating a new one!
    let transaction;
    if (bill.linkedTransaction) {
      transaction = await Transaction.findOne({
        _id: bill.linkedTransaction,
        user: req.user.id,
      });
    }

    const transactionDescription = `Bill from ${bill.retailerName}${bill.invoiceNumber ? ` (#${bill.invoiceNumber})` : ''}`;

    if (transaction) {
      transaction.amount = finalCalculatedTotal;
      transaction.category = category;
      transaction.description = transactionDescription;
      transaction.date = bill.billDate;
      transaction.paymentMethod = paymentMethod;
      transaction.notes = `Updated from confirmed bill. Items: ${validatedItems.length}.`;
      await transaction.save();
    } else {
      transaction = await Transaction.create({
        user: req.user.id,
        type: 'expense',
        amount: finalCalculatedTotal,
        category,
        description: transactionDescription,
        date: bill.billDate,
        paymentMethod,
        notes: `Created from scanned bill. Line items: ${validatedItems.length}.`,
        sourceBill: bill._id,
      });

      bill.linkedTransaction = transaction._id;
    }

    await bill.save();

    res.status(200).json({
      success: true,
      message: 'Bill confirmed and saved! Corresponding expense transaction created.',
      data: {
        bill,
        transaction,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete bill and its linked transaction
// @route   DELETE /api/bills/:id
exports.deleteBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
    }

    // Delete linked transaction if it exists
    if (bill.linkedTransaction) {
      await Transaction.findByIdAndDelete(bill.linkedTransaction);
    }

    // Optionally delete uploaded file if local
    if (bill.documentUrl && bill.documentUrl.startsWith('/uploads/')) {
      const fileName = bill.documentUrl.replace('/uploads/', '');
      const filePath = `${require('../config/env').UPLOAD_DIR}/${fileName}`;
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete file from uploads:', e.message);
        }
      }
    }

    await bill.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Bill and its corresponding transaction deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
