import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  Tag,
  ArrowUpRight,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b'];

const Reports = () => {
  const { symbol, formatAmount } = useCurrency();

  const [timeRange, setTimeRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/analytics?timeRange=${timeRange}`);
      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const handleExportCsv = () => {
    window.open('/api/transactions/export/csv', '_blank');
  };

  const {
    totalExpense = 0,
    categories = [],
    paymentMethods = [],
    dailySpending = [],
  } = reportData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Understand your spending trends, top cost categories, and payment channel breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time range switcher */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs">
            {['week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md capitalize transition ${
                  timeRange === range
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'all' ? 'All Time' : `This ${range}`}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Top Category Spending Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Expenses by Category</h3>
                <p className="text-[11px] text-slate-500">Ranking of your highest cost areas</p>
              </div>
              <span className="font-bold text-slate-900 font-mono text-sm">
                Total: {formatAmount(totalExpense)}
              </span>
            </div>

            <div className="h-64 w-full">
              {categories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categories} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <XAxis
                      dataKey="category"
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      stroke="#e2e8f0"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#e2e8f0" />
                    <Tooltip
                      formatter={(val) => [formatAmount(val), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  No expense records found for this time period.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Spending Trend (Last 30 Days) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1">Daily Spending Trajectory</h3>
              <p className="text-[11px] text-slate-500 mb-4">Daily outlays over the last 30 days</p>

              <div className="h-52 w-full">
                {dailySpending.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySpending} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d) => d.slice(5)} // MM-DD
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        stroke="#e2e8f0"
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#e2e8f0" />
                      <Tooltip
                        formatter={(val) => [formatAmount(val), 'Outlay']}
                        labelFormatter={(label) => `Date: ${label}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">
                    No daily transaction data recorded.
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">Payment Methods Breakdown</h3>
                <p className="text-[11px] text-slate-500 mb-4">Volume and count by payment channel</p>

                <div className="space-y-3">
                  {paymentMethods.map((pm, idx) => (
                    <div
                      key={pm.method}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{pm.method}</p>
                          <p className="text-[10px] text-slate-400">{pm.count} transactions</p>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-slate-800 text-sm">
                        {formatAmount(pm.amount)}
                      </span>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-center text-xs text-slate-400 py-8">
                      No payment data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
