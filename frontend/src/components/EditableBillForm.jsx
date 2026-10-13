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
  Layers,
  Sparkles,
  ShoppingBag,
  Smartphone,
  Sliders,
  X,
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const formatDateForInput = (rawDate) => {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    return rawDate.split('T')[0];
  }
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DEFAULT_STANDARD_COLUMNS = [
  { key: 'name', label: 'Item Description', type: 'text', required: true, width: 'min-w-[200px]' },
  { key: 'category', label: 'Category', type: 'select', width: 'w-28' },
  { key: 'quantity', label: 'Qty', type: 'number', required: true, width: 'w-20' },
  { key: 'unitPrice', label: 'Unit Price', type: 'currency', required: true, width: 'w-28' },
  { key: 'discount', label: 'Disc', type: 'currency', width: 'w-24' },
  { key: 'tax', label: 'Tax', type: 'currency', width: 'w-24' },
  { key: 'lineTotal', label: 'Total', type: 'currency', required: true, width: 'w-28' },
];

const EditableBillForm = ({ initialBill, onSaved, onCancel }) => {
  const { symbol } = useCurrency();

  // Header bill fields
  const [retailerName, setRetailerName] = useState(initialBill.retailerName || '');
  const [retailerAddress, setRetailerAddress] = useState(initialBill.retailerAddress || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialBill.invoiceNumber || '');
  const [billDate, setBillDate] = useState(formatDateForInput(initialBill.billDate));
  const [paymentMethod, setPaymentMethod] = useState(initialBill.paymentMethod || 'Cash');
  const [category, setCategory] = useState(initialBill.suggestedCategory || 'Groceries');
  const [taxAmount, setTaxAmount] = useState(initialBill.taxAmount || 0);
  const [discountAmount, setDiscountAmount] = useState(initialBill.discountAmount || 0);
  const [additionalCharges, setAdditionalCharges] = useState(initialBill.additionalCharges || 0);
  const [printedTotal, setPrintedTotal] = useState(initialBill.printedTotal || '');
  const [billFormat, setBillFormat] = useState(initialBill.billFormat || 'standard');

  // Dynamic Columns State
  const [columns, setColumns] = useState(() => {
    if (initialBill.columns && initialBill.columns.length > 0) {
      return initialBill.columns;
    }
    return DEFAULT_STANDARD_COLUMNS;
  });

  // Modal for adding dynamic custom column
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text'); // text, number, currency

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

  // Keep state in sync whenever initialBill updates
  useEffect(() => {
    if (initialBill) {
      setRetailerName(initialBill.retailerName || '');
      setRetailerAddress(initialBill.retailerAddress || '');
      setInvoiceNumber(initialBill.invoiceNumber || '');
      setBillDate(formatDateForInput(initialBill.billDate));
      setPaymentMethod(initialBill.paymentMethod || 'Cash');
      setCategory(initialBill.suggestedCategory || 'Groceries');
      setTaxAmount(initialBill.taxAmount || 0);
      setDiscountAmount(initialBill.discountAmount || 0);
      setAdditionalCharges(initialBill.additionalCharges || 0);
      setPrintedTotal(
        initialBill.printedTotal !== null && initialBill.printedTotal !== undefined
          ? initialBill.printedTotal
          : ''
      );
      setBillFormat(initialBill.billFormat || 'standard');

      if (initialBill.columns && initialBill.columns.length > 0) {
        setColumns(initialBill.columns);
      } else {
        setColumns(DEFAULT_STANDARD_COLUMNS);
      }

      if (initialBill.items && initialBill.items.length > 0) {
        setItems(
          initialBill.items.map((item, idx) => ({
            ...item,
            id: item._id || `item_${idx}_${Date.now()}`,
            quantity: item.quantity !== undefined ? item.quantity : 1,
            unitPrice: item.unitPrice !== undefined ? item.unitPrice : 0,
            discount: item.discount || 0,
            tax: item.tax || 0,
            lineTotal: item.lineTotal !== undefined ? item.lineTotal : 0,
            confidence: item.confidence !== undefined ? item.confidence : 85,
            isFlagged: Boolean(item.isFlagged || (item.confidence && item.confidence < 75)),
          }))
        );
      }
    }
  }, [initialBill]);

  // Dynamic Column Addition
  const handleAddColumn = () => {
    if (!newColLabel.trim()) return;
    const cleanKey = newColLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (columns.some((c) => c.key === cleanKey)) {
      alert('A column with this name already exists.');
      return;
    }

    const newCol = {
      key: cleanKey,
      label: newColLabel.trim(),
      type: newColType,
      editable: true,
      width: 'w-28',
    };

    const totalIdx = columns.findIndex((c) => c.key === 'lineTotal');
    const updatedCols = [...columns];
    if (totalIdx !== -1) {
      updatedCols.splice(totalIdx, 0, newCol);
    } else {
      updatedCols.push(newCol);
    }
    setColumns(updatedCols);

    // Initialize the new property on all existing items
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        [cleanKey]: newColType === 'number' || newColType === 'currency' ? 0 : '',
      }))
    );

    setNewColLabel('');
    setShowAddColModal(false);
  };

  // Remove Column
  const handleRemoveColumn = (colKey) => {
    if (['name', 'quantity', 'lineTotal'].includes(colKey)) {
      alert('Core column cannot be removed.');
      return;
    }
    const colObj = columns.find((c) => c.key === colKey);
    if (confirm(`Remove column "${colObj ? colObj.label : colKey}"?`)) {
      setColumns((prev) => prev.filter((c) => c.key !== colKey));
    }
  };

  // Automatically recalculate line totals and subtotals whenever items or adjustments change
  const handleItemChange = (index, field, value) => {
    setItems((prevItems) => {
      const updated = [...prevItems];
      const item = { ...updated[index] };

      const colDef = columns.find((c) => c.key === field);
      const isNum = colDef && (colDef.type === 'number' || colDef.type === 'currency');

      if (field === 'name' || (!isNum && field !== 'category')) {
        item[field] = value;
      } else if (field === 'category') {
        item.category = value;
      } else {
        const numVal = field === 'lineTotal' ? parseFloat(value) || 0 : Math.max(0, parseFloat(value) || 0);
        item[field] = numVal;

        // Recalculate lineTotal if user did not directly edit lineTotal
        if (field !== 'lineTotal') {
          if (billFormat === 'jewelry' || item.grossPrice !== undefined) {
            // Jewelry formula: grossPrice + makingCharges - discount + cgst + sgst
            const gp = Number(item.grossPrice) || 0;
            const mc = Number(item.makingCharges) || 0;
            const disc = Number(item.discount) || 0;
            const cg = Number(item.cgst) || 0;
            const sg = Number(item.sgst) || 0;
            if (gp > 0) {
              item.lineTotal = Math.round((gp + mc - disc + cg + sg) * 100) / 100;
            }
          } else if (billFormat === 'ecommerce' || item.taxableValue !== undefined) {
            // E-Commerce formula: taxableValue + cgst + sgst OR grossAmount - discount
            const tv = Number(item.taxableValue) || 0;
            const cg = Number(item.cgst) || 0;
            const sg = Number(item.sgst) || 0;
            const gross = Number(item.grossAmount) || Number(item.unitPrice) || 0;
            const disc = Number(item.discount) || 0;
            if (tv > 0) {
              item.lineTotal = Math.round((tv + cg + sg) * 100) / 100;
            } else if (gross > 0) {
              item.lineTotal = Math.round((gross - disc) * 100) / 100;
            }
          } else {
            // Standard formula: (qty * unitPrice) - discount + tax
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPrice) || 0;
            const disc = Number(item.discount) || 0;
            const tax = Number(item.tax) || 0;
            item.lineTotal = Math.round((qty * price - disc + tax) * 100) / 100;
          }
        }
      }

      item.isFlagged = false;
      item.confidence = 100;
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem = {
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
    };
    columns.forEach((col) => {
      if (newItem[col.key] === undefined) {
        newItem[col.key] = col.type === 'number' || col.type === 'currency' ? 0 : '';
      }
    });
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (index) => {
    if (items.length <= 1) {
      alert('A bill must have at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const itemsSum = Math.round(
    items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0) * 100
  ) / 100;

  const printedNum = printedTotal !== '' && printedTotal !== null ? parseFloat(printedTotal) : null;
  const itemsSumMatchesPrinted = printedNum !== null && Math.abs(itemsSum - printedNum) <= 1.05;

  let calculatedSubtotal = itemsSum;
  let finalGrandTotal = itemsSum;

  if (itemsSumMatchesPrinted) {
    // Items already represent the complete tax-inclusive total (Flipkart, Tanishq, retail POS)
    finalGrandTotal = printedNum;
  } else {
    // Bill-level taxes / discounts apply on top of items subtotal (restaurant, standard)
    const t = parseFloat(taxAmount) || 0;
    const d = parseFloat(discountAmount) || 0;
    const a = parseFloat(additionalCharges) || 0;
    finalGrandTotal = Math.round((itemsSum + t - d + a) * 100) / 100;
  }

  // Discrepancy detection between printed total and final calculated total
  const hasDiscrepancy = printedNum !== null && !isNaN(printedNum) && Math.abs(printedNum - finalGrandTotal) > 0.05;
  const discrepancyDiff = hasDiscrepancy ? Math.abs(printedNum - finalGrandTotal).toFixed(2) : '0.00';

  // Format Helper Labels
  const formatBadgeConfig = {
    supermarket: { label: 'DMart / Smart Bazaar Supermarket', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ecommerce: { label: 'E-Commerce (Flipkart, Amazon, Myntra, Ajio)', icon: ShoppingBag, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    firstcry: { label: 'FirstCry / Kids Store Invoice', icon: ShoppingBag, color: 'bg-pink-100 text-pink-800 border-pink-200' },
    swiggy: { label: 'Swiggy / Food Delivery Order', icon: ShoppingBag, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    jewelry: { label: 'Jewelry Tax Invoice (Tanishq, Kalyan)', icon: Sparkles, color: 'bg-amber-100 text-amber-800 border-amber-200' },
    telecom: { label: 'Telecom / Utility (Airtel, Jio, Vi)', icon: Smartphone, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    payment_app: { label: 'Payment App (PhonePe, Google Pay, Paytm)', icon: CreditCard, color: 'bg-teal-100 text-teal-800 border-teal-200' },
    electronics: { label: 'Electronics Retail (Reliance Digital, Croma)', icon: Layers, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    standard: { label: 'Standard Retail Bill', icon: FileDigit, color: 'bg-slate-100 text-slate-800 border-slate-200' },
  }[billFormat] || { label: 'Dynamic Bill Format', icon: FileDigit, color: 'bg-slate-100 text-slate-800 border-slate-200' };

  const FormatIcon = formatBadgeConfig.icon;

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
        billFormat,
        columns,
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review & Edit Bill</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Confidence {initialBill.confidenceScore || 85}%
            </span>
            <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${formatBadgeConfig.color}`}>
              <FormatIcon className="w-3.5 h-3.5 mr-1" />
              <span>{formatBadgeConfig.label}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic columns automatically matched to this bill format. Add or remove custom columns as needed.
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
                The printed bill total is <strong>{symbol}{printedNum?.toFixed(2)}</strong>, but the calculated sum is <strong>{symbol}{finalGrandTotal.toFixed(2)}</strong> (Difference of {symbol}{discrepancyDiff}).
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
              <span>Store / Platform *</span>
            </label>
            <input
              type="text"
              required
              value={retailerName}
              onChange={(e) => setRetailerName(e.target.value)}
              placeholder="e.g. Flipkart, Tanishq, Airtel"
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
              placeholder="e.g. FAJ0WW2300097336, DOC/I/RJK/865"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs md:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-600 outline-hidden font-mono"
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
              Store / Seller Address
            </label>
            <input
              type="text"
              value={retailerAddress}
              onChange={(e) => setRetailerAddress(e.target.value)}
              placeholder="e.g. Ahmedabad, Gujarat, India"
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

        {/* Line Items Section with Dynamic Columns */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span>Extracted Line Items ({items.length})</span>
                <span className="text-xs font-normal text-slate-400 capitalize">({columns.length} columns)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Columns adapt dynamically to your bill. You can edit cells, add custom columns, or remove extra fields.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowAddColModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-300"
                title="Add a custom column to this bill table"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>+ Add Column</span>
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {/* Add Column Popup Modal */}
          {showAddColModal && (
            <div className="mb-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Add Dynamic Column to Table</span>
                <button
                  type="button"
                  onClick={() => setShowAddColModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="Column Name (e.g. Color, Warranty, Serial No)"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600 outline-hidden min-w-[200px]"
                />
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 outline-hidden"
                >
                  <option value="text">Text / Description</option>
                  <option value="number">Quantity / Numeric</option>
                  <option value="currency">Currency / Price ({symbol})</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Add Column
                </button>
              </div>
            </div>
          )}

          {/* Desktop Dynamic Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-8">#</th>
                  {columns.map((col) => {
                    const isRight = col.key === 'lineTotal';
                    const isCenter = col.type === 'number' || (col.type === 'currency' && !isRight);
                    return (
                      <th
                        key={col.key}
                        className={`py-3 px-3 ${col.width || 'min-w-[120px]'} ${
                          isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left'
                        }`}
                      >
                        <div className={`flex items-center space-x-1 ${isRight ? 'justify-end' : isCenter ? 'justify-center' : 'justify-start'}`}>
                          <span>{col.label}</span>
                          {!['name', 'quantity', 'lineTotal'].includes(col.key) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(col.key)}
                              className="text-slate-400 hover:text-red-500 ml-1 rounded"
                              title={`Remove "${col.label}" column`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
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
                    {columns.map((col) => {
                      const isLineTotal = col.key === 'lineTotal';
                      const isName = col.key === 'name';
                      const isSelect = col.type === 'select';
                      const isNum = col.type === 'number' || col.type === 'currency';

                      if (isLineTotal) {
                        return (
                          <td key={col.key} className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                            {symbol}{Number(item.lineTotal || 0).toFixed(2)}
                          </td>
                        );
                      }

                      if (isSelect && col.key === 'category') {
                        return (
                          <td key={col.key} className="py-2.5 px-3">
                            <select
                              value={item.category || category}
                              onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden"
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
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} className="py-2.5 px-3">
                          <div className="relative">
                            <input
                              type={isNum ? 'number' : 'text'}
                              step={isNum ? (col.type === 'number' && col.key === 'quantity' ? 'any' : '0.01') : undefined}
                              value={item[col.key] !== undefined ? item[col.key] : ''}
                              onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                              placeholder={col.label}
                              className={`w-full px-2.5 py-1.5 bg-transparent border rounded-md text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden ${
                                isNum ? 'font-mono text-center' : 'font-medium'
                              } ${
                                isName && item.isFlagged ? 'border-amber-400' : 'border-slate-200'
                              }`}
                            />
                            {isName && item.isFlagged && (
                              <span
                                title="Uncertain OCR confidence: Please verify spelling and price"
                                className="absolute right-2 top-2 text-amber-500"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

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

                <div className="space-y-2">
                  {columns.map((col) => {
                    const isLineTotal = col.key === 'lineTotal';
                    const isNum = col.type === 'number' || col.type === 'currency';

                    if (isLineTotal) {
                      return (
                        <div key={col.key} className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-[11px] font-semibold text-slate-600">{col.label}:</span>
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            {symbol}{Number(item.lineTotal || 0).toFixed(2)}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={col.key} className="flex flex-col">
                        <label className="text-[10px] font-medium text-slate-500 mb-0.5">{col.label}</label>
                        <input
                          type={isNum ? 'number' : 'text'}
                          step={isNum ? (col.type === 'number' && col.key === 'quantity' ? 'any' : '0.01') : undefined}
                          value={item[col.key] !== undefined ? item[col.key] : ''}
                          onChange={(e) => handleItemChange(idx, col.key, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                        />
                      </div>
                    );
                  })}
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
              When you confirm this bill, SpendWise will create an Expense transaction for <strong>{symbol}{finalGrandTotal.toFixed(2)}</strong> categorized under <strong>{category}</strong>. All line items and dynamic invoice columns are preserved in your ledger.
            </p>
          </div>

          {/* Right Calculations Card */}
          <div className="w-full lg:w-80 space-y-2.5 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Total / Subtotal:</span>
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
