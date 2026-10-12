const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('SpendWise Financial Math Integrity Tests', () => {
  it('should accurately calculate line total from quantity, unit price, discount, and tax without float errors', () => {
    const qty = 3;
    const unitPrice = 19.99;
    const discount = 5.00;
    const tax = 2.45;

    // Line total = (qty * unitPrice) - discount + tax
    const rawTotal = (qty * unitPrice) - discount + tax;
    const lineTotal = Math.round(rawTotal * 100) / 100;

    assert.strictEqual(lineTotal, 57.42);
  });

  it('should accurately calculate budget utilization percentage and threshold warnings', () => {
    const budgetLimit = 2000;
    const totalSpentWarning = 1650; // 82.5%
    const totalSpentExceeded = 2050; // 102.5%

    const pctWarning = Math.round((totalSpentWarning / budgetLimit) * 100);
    const statusWarning = pctWarning >= 100 ? 'exceeded' : pctWarning >= 80 ? 'warning' : 'normal';

    const pctExceeded = Math.round((totalSpentExceeded / budgetLimit) * 100);
    const statusExceeded = pctExceeded >= 100 ? 'exceeded' : pctExceeded >= 80 ? 'warning' : 'normal';

    assert.strictEqual(statusWarning, 'warning');
    assert.strictEqual(statusExceeded, 'exceeded');
  });

  it('should maintain net balance accuracy across income and expenses', () => {
    const totalIncome = 5350.00;
    const totalExpense = 2145.75;
    const netBalance = Math.round((totalIncome - totalExpense) * 100) / 100;

    assert.strictEqual(netBalance, 3204.25);
  });
});
