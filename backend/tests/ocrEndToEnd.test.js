const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { parseReceiptText } = require('../src/services/ocr/receiptParser');

describe('SpendWise OCR & End-to-End Bill Workflow Verification', () => {
  it('should parse DMart grocery receipt lines with high accuracy', () => {
    const rawDMart = `
      AVENUE SUPERMARTS LTD.
      DMART SUPERMARKET
      Plot 42, Hiranandani Estate, Thane West
      GSTIN: 27AABCA1234F1Z5
      Invoice No: DM-2026-9814
      Date: 12/10/2026 Time: 14:35

      --------------------------------------------------
      ITEM                        QTY    PRICE    TOTAL
      --------------------------------------------------
      Daawat Basmati Rice 5kg       1    18.50    18.50
      Fortune Sunflower Oil 5L      1    22.00    22.00
      Raw California Almonds 500g   2    14.00    28.00
      Surf Excel Detergent 3kg      1    15.00    15.00
      Colgate Toothpaste Twin       2     6.00    12.00

      --------------------------------------------------
      Sub Total:                                  95.50
      GST Tax:                                     4.50
      Total Savings / Discount:                   10.00
      Grand Total:                               100.00
      --------------------------------------------------
      Mode of Payment: UPI
      Thank you for shopping at DMart!
    `;

    const parsed = parseReceiptText(rawDMart, 96);

    assert.strictEqual(parsed.retailerName, 'DMart Supermarket');
    assert.strictEqual(parsed.invoiceNumber, 'DM-2026-9814');
    assert.strictEqual(parsed.paymentMethod, 'UPI');
    assert.strictEqual(parsed.suggestedCategory, 'Groceries');
    assert.strictEqual(parsed.subtotal, 95.50);
    assert.strictEqual(parsed.taxAmount, 4.50);
    assert.strictEqual(parsed.discountAmount, 10.00);
    assert.strictEqual(parsed.calculatedTotal, 100.00);
    assert.strictEqual(parsed.items.length >= 4, true);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });

  it('should parse Reliance Trends apparel receipt lines correctly', () => {
    const rawTrends = `
      RELIANCE TRENDS
      Phoenix Marketcity Mall
      Invoice No: RT-884102
      Date: 10/10/2026

      DNMX Slim Fit Chinos          1    45.00    45.00
      Netplay Oxford Shirt          2    38.00    76.00
      Performax Running Shoes       1    85.00    85.00

      Sub Total:                                 206.00
      Discount Savings:                           40.00
      GST / Tax:                                  10.00
      Grand Total:                               176.00
      Payment: Credit Card
    `;

    const parsed = parseReceiptText(rawTrends, 94);

    assert.strictEqual(parsed.retailerName, 'Reliance Trends');
    assert.strictEqual(parsed.invoiceNumber, 'RT-884102');
    assert.strictEqual(parsed.paymentMethod, 'Credit Card');
    assert.strictEqual(parsed.suggestedCategory, 'Shopping');
    assert.strictEqual(parsed.subtotal, 206.00);
    assert.strictEqual(parsed.discountAmount, 40.00);
    assert.strictEqual(parsed.calculatedTotal, 176.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });

  it('should parse real restaurant thermal bill (Shreeji Restaurant) with itemized lines and zero discrepancy', () => {
    const rawRestaurant = `
      Shreeji Restuarant
      1st Floor Patidar Complex
      Bhaktinandan Circle 80 Feet Road
      Surendranagar Mo:9664747568
      Name:
      Date: 16/08/26  Dine In: 19
      14:39
      Cashier: ak     Bill No.: 13485
      Token No.: 97
      Item              Qty.  Price  Amount
      Punjabi Fix Thali   2   210.00 420.00
      (Monday To
      Saturday)
      Mineral Water       1    20.00  20.00
      Total Qty: 3    Sub Total      440.00
      Grand Total ₹ 440.00
      Thanks
    `;

    const parsed = parseReceiptText(rawRestaurant, 92);

    assert.strictEqual(parsed.retailerName, 'Shreeji Restaurant');
    assert.strictEqual(parsed.invoiceNumber, '13485');
    assert.strictEqual(parsed.paymentMethod, 'Cash');
    assert.strictEqual(parsed.suggestedCategory, 'Food & Dining');
    assert.strictEqual(parsed.subtotal, 440.00);
    assert.strictEqual(parsed.printedTotal, 440.00);
    assert.strictEqual(parsed.calculatedTotal, 440.00);
    assert.strictEqual(parsed.items.length, 2);
    assert.strictEqual(parsed.items[0].name.includes('Punjabi Fix Thali'), true);
    assert.strictEqual(parsed.items[0].quantity, 2);
    assert.strictEqual(parsed.items[0].unitPrice, 210.00);
    assert.strictEqual(parsed.items[0].lineTotal, 420.00);
    assert.strictEqual(parsed.items[1].name.includes('Mineral Water'), true);
    assert.strictEqual(parsed.items[1].quantity, 1);
    assert.strictEqual(parsed.items[1].unitPrice, 20.00);
    assert.strictEqual(parsed.items[1].lineTotal, 20.00);
    assert.strictEqual(parsed.hasDiscrepancy, false);
  });
});
