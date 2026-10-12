import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Store,
  Calendar,
  FileDigit,
  CreditCard,
  Tag,
  Save,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const EditableBillForm = ({ initialBill, onSaved, onCancel }) => {
  const { symbol } = useCurrency();

  // Header bill fields
  const [retailerName, setRetailerName] = useState(initialBill.retailerName || '');
  const [retailerAddress, setRetailerAddress] = useState(initialBill.retailerAddress || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialBill.invoiceNumber || '');
  const [billDate, setBillDate] = useState(
    initialBill.billDate ? new Date(initialBill.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(initialBill.paymentMethod || 'Cash');
  const [category, setCategory] = useState(initialBill.suggestedCategory || 'Groceries');
  const [taxAmount, setTaxAmount] = useState(initialBill.taxAmount || 0);
  const [discountAmount, setDiscountAmount] = useState(initialBill.discountAmount || 0);
  const [additionalCharges, setAdditionalCharges] = useState(initialBill.additionalCharges || 0);
  const [printedTotal, setPrintedTotal] = useState(initialBill.printedTotal || '');

  // Line items
  const [items, setItems] = useState(() => {
    if (initialBill.items && initialBill.items.length > 0) {
      return initialBill.items.map((item, idx) => ({
        ...item,
        id: item._id || `item_${idx}_${Date.now()}`,
        quantity: item.quantity !== undefined ? item.quantity : 1,
        unitPrice: item.unitPrice !== undefined ? item.unitPrice : 0,
        discount: item.discount || 0,
        tax: item.tax || 0,
        lineTotal: item.lineTotal !== undefined ? item.lineTotal : 0,
        confidence: item.confidence !== undefined ? item.confidence : 85,
        isFlagged: Boolean(item.isFlagged || (item.confidence && item.confidence < 75)),
      }));
    }
    return [
      {
        id: `item_0_${Date.now()}`,
        name: 'Item 1',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
        lineTotal: 0,
        category: 'Groceries',
        confidence: 100,
        isFlagged: false,
      },
    ];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Automatically recalculate line totals and subtotals whenever items or adjustments change
  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const item = { ...updated[index] };

      if (field === 'name') {
        item.name = value;
      } else if (field === 'category') {
        item.category = value;
      } else {
        const numVal = Math.max(0, parseFloat(value) || 0);
        item[field] = numVal;

        // Recalculate lineTotal: (qty * unitPrice) - discount + tax
        const qty = field === 'quantity' ? numVal : item.quantity || 1;
        const price = field === 'unitPrice' ? numVal : item.unitPrice || 0;
        const disc = field === 'discount' ? numVal : item.discount || 0;
        const tax = field === 'tax' ? numVal : item.tax || 0;

        item.lineTotal = Math.round((qty * price - disc + tax) * 100) / 100;
        // User edited this field, so clear low-confidence flag
        item.isFlagged = false;
        item.confidence = 100;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random()}`,
        name: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        tax: 0,
        lineTotal: 0,
        category,
        confidence: 100,
        isFlagged: false,
      },
    ]);
  };

  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      alert('A bill must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = Math.round(
    items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0) * 100
  ) / 100;

  const finalGrandTotal = Math.round(
    (calculatedSubtotal + (parseFloat(taxAmount) || 0) - (parseFloat(discountAmount) || 0) + (parseFloat(additionalCharges) || 0)) * 100
  ) / 100;

  // Discrepancy detection between printed total and final calculated total
  const printedNum = printedTotal !== '' && printedTotal !== null ? parseFloat(printedTotal) : null;
  const hasDiscrepancy = printedNum !== null && !isNaN(printedNum) && Math.abs(printedNum - finalGrandTotal) > 0.05;
  const discrepancyDiff = hasDiscrepancy ? Math.abs(printedNum - finalGrandTotal).toFixed(2) : '0.00';

  const handleSaveBill = async () => {
    setError('');

    if (!retailerName.trim()) {
      setError('Please provide a retailer/store name');
      return;
    }

    if (items.length === 0) {
      setError('Please include at least one item on this bill');
      return;
    }

    if (finalGrandTotal <= 0) {
      setError('Total bill amount must be greater than zero');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        retailerName: retailerName.trim(),
        retailerAddress: retailerAddress.trim(),
        invoiceNumber: invoiceNumber.trim(),
        billDate,
        printedTotal: printedNum,
        subtotal: calculatedSubtotal,
        taxAmount: parseFloat(taxAmount) || 0,
        discountAmount: parseFloat(discountAmount) || 0,
        additionalCharges: parseFloat(additionalCharges) || 0,
        paymentMethod,
        category,
        items,
      };

      const res = await api.post(`/bills/${initialBill._id}/confirm`, payload);
      if (res.data.success) {
        onSaved(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save confirmed bill. Please review all fields.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Banner & Title */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review & Edit Bill</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Confidence {initialBill.confidenceScore || 85}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review the extracted bill data below, make any corrections, and confirm to record your expense.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveBill}
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Confirm & Save Bill'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Discrepancy Warning Alert Box */}
      {hasDiscrepancy && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">Printed Total Discrepancy Detected</p>
              <p className="mt-1 text-amber-800 leading-relaxed">
                The printed bill total is <strong>{symbol}{printedNum?.toFixed(2)}</strong>, but the calculated sum of items and taxes is <strong>{symbol}{finalGrandTotal.toFixed(2)}</strong> (Difference of {symbol}{discrepancyDiff}).
                Please check the line item quantities, prices, or taxes. You can adjust the items or keep the calculated total.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Bill Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
          {/* Retailer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span>Store / Retailer *</span>
            </label>
            <input
              type="text"
              required
              value={retailerName}
              onChange={(e) => setRetailerName(e.target.value)}
              placeholder="e.g. DMart, Reliance Trends"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Bill / Invoice Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <FileDigit className="w-3.5 h-3.5 text-slate-500" />
              <span>Invoice / Bill #</span>
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-98412"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Bill Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Bill Date *</span>
            </label>
            <input
              type="date"
              required
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span>Payment Method</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Store Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Store Address / Location
            </label>
            <input
              type="text"
              value={retailerAddress}
              onChange={(e) => setRetailerAddress(e.target.value)}
              placeholder="e.g. Thane West Branch, Mumbai"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden"
            />
          </div>

          {/* Primary Expense Category */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Overall Expense Category *</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden"
            >
              <option value="Groceries">Groceries</option>
              <option value="Shopping">Shopping</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Transport">Transport</option>
              <option value="Bills & Utilities">Bills & Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other Expense">Other Expense</option>
            </select>
          </div>
        </div>

        {/* Line Items Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Extracted Line Items ({items.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Orange border indicates an OCR field that needs your manual check. Line totals update automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-8">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Item Description *</th>
                  <th className="py-3 px-3 w-20 text-center">Qty</th>
                  <th className="py-3 px-3 w-28">Unit Price ({symbol})</th>
                  <th className="py-3 px-3 w-24">Disc ({symbol})</th>
                  <th className="py-3 px-3 w-24">Tax ({symbol})</th>
                  <th className="py-3 px-3 w-28 text-right">Line Total ({symbol})</th>
                  <th className="py-3 px-2 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={`hover:bg-slate-50/80 transition ${
                      item.isFlagged ? 'bg-amber-50/40 ring-1 ring-amber-300' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="Item name"
                          className={`w-full px-2.5 py-1.5 bg-transparent border rounded-md text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden ${
                            item.isFlagged ? 'border-amber-400' : 'border-slate-200'
                          }`}
                        />
                        {item.isFlagged && (
                          <span
                            title="Uncertain OCR confidence: Please verify spelling and price"
                            className="absolute right-2 top-2 text-amber-500"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full text-center px-1.5 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discount || 0}
                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.tax || 0}
                        onChange={(e) => handleItemChange(idx, 'tax', e.target.value)}
                        className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {symbol}{Number(item.lineTotal || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-3.5 rounded-xl border transition ${
                  item.isFlagged
                    ? 'border-amber-400 bg-amber-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-slate-400">Item #{idx + 1}</span>
                  <div className="flex items-center space-x-2">
                    {item.isFlagged && (
                      <span className="inline-flex items-center text-[10px] text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Check
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    placeholder="Item description"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500">Qty</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Price ({symbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Total ({symbol})</label>
                    <div className="py-1 px-1 font-bold text-slate-900 font-mono text-xs">
                      {symbol}{Number(item.lineTotal || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Totals & Adjustments Box */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-100">
          {/* Notes & Guidance */}
          <div className="w-full lg:max-w-md p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-600">
            <h4 className="font-semibold text-slate-800 flex items-center space-x-1.5 mb-1.5">
              <Info className="w-4 h-4 text-emerald-700" />
              <span>Automatic Expense Creation</span>
            </h4>
            <p className="leading-relaxed">
              When you confirm this bill, SpendWise will create an Expense transaction for <strong>{symbol}{finalGrandTotal.toFixed(2)}</strong> categorized under <strong>{category}</strong>. You can view all line items in the Saved Bills ledger.
            </p>
          </div>

          {/* Right Calculations Card */}
          <div className="w-full lg:w-80 space-y-2.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900">
                {symbol}{calculatedSubtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Tax / GST:</span>
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Discounts / Savings:</span>
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-emerald-700 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Other Charges:</span>
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={additionalCharges}
                  onChange={(e) => setAdditionalCharges(e.target.value)}
                  className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-900">Grand Total:</span>
              <span className="font-bold text-lg text-emerald-800 font-mono">
                {symbol}{finalGrandTotal.toFixed(2)}
              </span>
            </div>

            {printedNum !== null && (
              <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                <span>Printed on Bill:</span>
                <span className="font-mono">{symbol}{printedNum.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditableBillForm;
