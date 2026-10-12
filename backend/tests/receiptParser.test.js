const { describe, it } = require('node:test');
const assert = require('node:assert');
const { parseReceiptText, parsePrice, suggestCategory } = require('../src/services/ocr/receiptParser');

describe('SpendWise Receipt Parser & Calculations Test Suite', () => {
  it('should parse prices correctly and handle currency symbols', () => {
    assert.strictEqual(parsePrice('$124.50'), 124.50);
    assert.strictEqual(parsePrice('₹1,499.00'), 1499.00);
    assert.strictEqual(parsePrice('€45.99'), 45.99);
    assert.strictEqual(parsePrice('0'), 0);
  });

  it('should auto-categorize correctly based on keywords', () => {
    assert.strictEqual(suggestCategory('DMart supermarket milk bread'), 'Groceries');
    assert.strictEqual(suggestCategory('Reliance Trends cotton shirt'), 'Shopping');
    assert.strictEqual(suggestCategory('McDonalds double cheeseburger meal'), 'Food & Dining');
    assert.strictEqual(suggestCategory('Apollo Pharmacy cough syrup'), 'Healthcare');
    assert.strictEqual(suggestCategory('Shell Petrol Gas Station'), 'Transport');
  });

  it('should extract retailer, line items, and detect total discrepancy accurately', () => {
    const sampleReceipt = `
      DMART SUPERMARKET
      Thane West Branch
      Invoice No: DM-98124
      Date: 12/10/2026

      Daawat Basmati Rice 5kg 1 18.50 18.50
      Fortune Sunflower Oil 1 22.00 22.00
      California Raw Almonds 2 14.00 28.00

      Subtotal: 68.50
      Tax: 3.50
      Grand Total: 72.00
      Paid via UPI
    `;

    const result = parseReceiptText(sampleReceipt, 95);

    assert.strictEqual(result.retailerName, 'DMart Supermarket');
    assert.strictEqual(result.invoiceNumber, 'DM-98124');
    assert.strictEqual(result.paymentMethod, 'UPI');
    assert.strictEqual(result.items.length >= 3, true);
    assert.strictEqual(result.subtotal, 68.50);
    assert.strictEqual(result.taxAmount, 3.50);
    assert.strictEqual(result.calculatedTotal, 72.00);
    assert.strictEqual(result.hasDiscrepancy, false);
  });

  it('should flag discrepancy when printed total differs from calculated items + tax', () => {
    const discrepancyReceipt = `
      SUPER STORE
      Invoice: SS-101
      Item A 1 10.00 10.00
      Subtotal: 10.00
      Grand Total: 50.00
    `;

    const result = parseReceiptText(discrepancyReceipt, 90);
    assert.strictEqual(result.hasDiscrepancy, true);
    assert.strictEqual(result.printedTotal, 50.00);
    assert.strictEqual(result.discrepancyNote.includes('differs from calculated total'), true);
  });
});
