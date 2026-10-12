const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [0, 'Quantity cannot be negative'],
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative'],
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative'],
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    lineTotal: {
      type: Number,
      required: true,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    category: {
      type: String,
      default: 'Groceries',
    },
    confidence: {
      type: Number,
      default: 90, // 0 to 100%
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    retailerName: {
      type: String,
      default: 'Retail Store',
      trim: true,
    },
    retailerAddress: {
      type: String,
      default: '',
      trim: true,
    },
    invoiceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    billDate: {
      type: Date,
      default: Date.now,
    },
    printedTotal: {
      type: Number,
      default: null,
      set: (val) => (val !== null && val !== undefined ? Math.round(val * 100) / 100 : null),
    },
    subtotal: {
      type: Number,
      default: 0,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    additionalCharges: {
      type: Number,
      default: 0,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    calculatedTotal: {
      type: Number,
      required: true,
      default: 0,
      set: (val) => Math.round((val || 0) * 100) / 100,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
      default: 'Cash',
    },
    ocrStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'reviewed'],
      default: 'completed',
    },
    reviewStatus: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending',
    },
    suggestedCategory: {
      type: String,
      default: 'Groceries',
    },
    documentUrl: {
      type: String,
      default: null,
    },
    documentType: {
      type: String,
      enum: ['image', 'pdf', 'manual'],
      default: 'image',
    },
    linkedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    confidenceScore: {
      type: Number,
      default: 85,
    },
    items: [billItemSchema],
    rawText: {
      type: String,
      default: '',
    },
    hasDiscrepancy: {
      type: Boolean,
      default: false,
    },
    discrepancyNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

billSchema.index({ user: 1, billDate: -1 });

module.exports = mongoose.model('Bill', billSchema);
