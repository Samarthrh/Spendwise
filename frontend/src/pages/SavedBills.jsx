import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  FileText,
  ScanLine,
  Calendar,
  Store,
  CreditCard,
  ExternalLink,
  Trash2,
  Eye,
  CheckCircle,
  Tag,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const SavedBills = () => {
  const { symbol, formatAmount } = useCurrency();
  const location = useLocation();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bills');
      if (res.data.success) {
        setBills(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    if (location.state?.confirmedBillId) {
      setSuccessBanner('Bill confirmed and saved! Corresponding expense transaction was recorded.');
      setTimeout(() => setSuccessBanner(''), 5000);
    }
  }, [location.state]);

  const handleOpenDetail = (bill) => {
    setSelectedBill(bill);
    setIsDetailModalOpen(true);
  };

  const handleDeleteBill = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this bill? Its linked transaction will also be removed.')) {
      try {
        await api.delete(`/bills/${id}`);
        setBills((prev) => prev.filter((b) => b._id !== id));
        if (selectedBill?._id === id) {
          setIsDetailModalOpen(false);
        }
      } catch (err) {
        alert('Failed to delete bill: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Saved Bills & Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse all bills scanned with Smart OCR, inspect itemized lines, and check linked expense records.
          </p>
        </div>

        <Link
          to="/scan-bill"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm self-start"
        >
          <ScanLine className="w-4 h-4" />
          <span>Scan New Bill</span>
        </Link>
      </div>

      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <div
              key={bill._id}
              onClick={() => handleOpenDetail(bill)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate max-w-[180px]">
                        {bill.retailerName}
                      </h3>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(bill.billDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {bill.suggestedCategory || 'Groceries'}
                    </span>
                    {bill.billFormat && bill.billFormat !== 'standard' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {bill.billFormat.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-3 py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Invoice #:</span>
                    <span className="font-mono text-slate-700 font-medium">
                      {bill.invoiceNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Line Items:</span>
                    <span className="font-semibold text-slate-700">
                      {bill.items?.length || 0} items
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Payment:</span>
                    <span className="text-slate-700">{bill.paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Total Amount
                  </span>
                  <p className="text-base font-bold text-slate-900 font-mono">
                    {formatAmount(bill.calculatedTotal)}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleDeleteBill(bill._id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDetail(bill)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                    title="View Items"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-slate-900">No Scanned Bills Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
            Scan your physical receipts using your camera or upload bill PDFs to extract itemized lines and link them to your expenses.
          </p>
          <Link
            to="/scan-bill"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan First Bill</span>
          </Link>
        </div>
      )}

      {/* Bill Detail Modal */}
      {selectedBill && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Bill Details — ${selectedBill.retailerName}`}
          maxWidth={selectedBill?.columns?.length > 4 ? "max-w-4xl" : "max-w-2xl"}
        >
          <div className="space-y-4">
            {/* Top Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Store</span>
                <span className="font-semibold text-slate-800">{selectedBill.retailerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span>
                <span className="text-slate-800 font-medium">
                  {new Date(selectedBill.billDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Invoice #</span>
                <span className="font-mono text-slate-800 font-medium">
                  {selectedBill.invoiceNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment</span>
                <span className="text-slate-800 font-medium">{selectedBill.paymentMethod}</span>
              </div>
            </div>

            {selectedBill.retailerAddress && (
              <p className="text-[11px] text-slate-500 px-1">
                📍 {selectedBill.retailerAddress}
              </p>
            )}

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Itemized Line Breakdown ({selectedBill.items?.length || 0})
                </h4>
                {selectedBill.billFormat && selectedBill.billFormat !== 'standard' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 capitalize border border-emerald-200">
                    {selectedBill.billFormat.replace('_', ' ')} format
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse min-w-full">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-semibold border-b border-slate-200 sticky top-0">
                    <tr>
                      {selectedBill.columns && selectedBill.columns.length > 0 ? (
                        selectedBill.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`py-2 px-3 whitespace-nowrap ${
                              col.type === 'currency' ? 'text-right' : col.type === 'number' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {col.label}
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3 text-center">Qty</th>
                          <th className="py-2 px-3 text-right">Unit Price</th>
                          <th className="py-2 px-3 text-right">Line Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items?.map((item, idx) => (
                      <tr key={item._id || idx} className="hover:bg-slate-50/50">
                        {selectedBill.columns && selectedBill.columns.length > 0 ? (
                          selectedBill.columns.map((col) => {
                            const val = item[col.key];
                            if (col.type === 'currency') {
                              return (
                                <td key={col.key} className="py-2 px-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                                  {val !== undefined && val !== null ? formatAmount(val) : '—'}
                                </td>
                              );
                            }
                            if (col.type === 'number') {
                              return (
                                <td key={col.key} className="py-2 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                                  {val !== undefined && val !== null ? val : '—'}
                                </td>
                              );
                            }
                            return (
                              <td key={col.key} className="py-2 px-3 text-slate-800 font-medium whitespace-nowrap">
                                {val || '—'}
                              </td>
                            );
                          })
                        ) : (
                          <>
                            <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                            <td className="py-2 px-3 text-center text-slate-500 font-mono">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 font-mono">
                              {formatAmount(item.unitPrice)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                              {formatAmount(item.lineTotal)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 max-w-xs ml-auto">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-800">{formatAmount(selectedBill.subtotal)}</span>
              </div>
              {selectedBill.taxAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Tax / GST:</span>
                  <span className="font-mono text-slate-800">+{formatAmount(selectedBill.taxAmount)}</span>
                </div>
              )}
              {selectedBill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Savings / Discount:</span>
                  <span className="font-mono">-{formatAmount(selectedBill.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-800">
                  {formatAmount(selectedBill.calculatedTotal)}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={(e) => handleDeleteBill(selectedBill._id, e)}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bill & Transaction</span>
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SavedBills;
