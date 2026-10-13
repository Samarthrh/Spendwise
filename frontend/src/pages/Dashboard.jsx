import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PiggyBank,
  ScanLine,
  PlusCircle,
  FileText,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import AddTransactionModal from '../components/AddTransactionModal';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#ef4444', // red
  '#14b8a6', // teal
  '#64748b', // slate
];

const Dashboard = () => {
  const { symbol, formatAmount } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState('expense');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to fetch financial data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openAddModal = (type = 'expense') => {
    setModalType(type);
    setIsAddModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Calculating your financial statistics...</p>
        </div>
      </div>
    );
  }

  const {
    totalExpense = 0,
    totalIncome = 0,
    netSavings = 0,
    budgetLimit = 2000,
    remainingBudget = 0,
    budgetUtilization = 0,
    budgetStatus = 'normal',
    categoryBreakdown = [],
    monthlyTrends = [],
    recentTransactions = [],
  } = summary || {};

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hi, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here is your financial overview for this month.
          </p>
        </div>

        {/* Quick Actions Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openAddModal('expense')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => openAddModal('income')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          amount={formatAmount(totalExpense)}
          subtitle="This Month"
          icon={TrendingDown}
          color="rose"
          badge={totalExpense > 0 ? 'Active' : 'No spending'}
          badgeType="neutral"
        />

        <StatCard
          title="Total Income"
          amount={formatAmount(totalIncome)}
          subtitle="This Month"
          icon={TrendingUp}
          color="emerald"
          badge={totalIncome > 0 ? 'Recorded' : 'Zero'}
          badgeType={totalIncome > 0 ? 'positive' : 'neutral'}
        />

        <StatCard
          title="Remaining Budget"
          amount={formatAmount(remainingBudget)}
          subtitle={`Limit: ${formatAmount(budgetLimit)}`}
          icon={Wallet}
          color={budgetStatus === 'exceeded' ? 'rose' : budgetStatus === 'warning' ? 'amber' : 'blue'}
          badge={`${budgetUtilization}% used`}
          badgeType={budgetStatus === 'exceeded' ? 'negative' : budgetStatus === 'warning' ? 'warning' : 'positive'}
        />

        <StatCard
          title="Net Savings"
          amount={formatAmount(netSavings)}
          subtitle="Income vs Expenses"
          icon={PiggyBank}
          color="indigo"
          badge={netSavings >= 0 ? 'Surplus' : 'Deficit'}
          badgeType={netSavings >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Budget Utilization Indicator Progress Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2.5 gap-1">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Monthly Budget Utilization
            </span>
            <span className="ml-2 text-xs text-slate-500">
              ({formatAmount(totalExpense)} of {formatAmount(budgetLimit)})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {budgetStatus === 'exceeded' && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Budget Exceeded</span>
              </span>
            )}
            {budgetStatus === 'warning' && (
              <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Approaching Limit (&gt;80%)</span>
              </span>
            )}
            {budgetStatus === 'normal' && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                On Track ({100 - budgetUtilization}% left)
              </span>
            )}
            <Link to="/budgets" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 ml-2">
              Manage &rarr;
            </Link>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              budgetStatus === 'exceeded'
                ? 'bg-rose-500'
                : budgetStatus === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend (Last 6 Months) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Spending & Income Trend</h3>
              <p className="text-[11px] text-slate-500">6-Month historical cash flow overview</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-600">Income</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-600">Expense</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#e2e8f0" />
                <Tooltip
                  formatter={(val) => [formatAmount(val), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="Expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <h3 className="font-bold text-slate-900 text-sm">Category Breakdown</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">Monthly spending distribution</p>

            <div className="h-44 w-full flex items-center justify-center">
              {categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => [formatAmount(val), 'Spent']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  No expenses recorded this month.
                </div>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {categoryBreakdown.slice(0, 4).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-medium truncate max-w-[120px]">
                    {cat.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-semibold text-slate-900">{formatAmount(cat.amount)}</span>
                  <span className="text-[10px] text-slate-400">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Transactions</h3>
            <p className="text-[11px] text-slate-500">Latest recorded income, expenses, and scanned bills</p>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{tx.description}</span>
                        {tx.sourceBill && (
                          <span
                            title="Created via Smart Bill Scan"
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <ScanLine className="w-2.5 h-2.5 mr-0.5" />
                            Bill
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {tx.paymentMethod}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-bold font-mono whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatAmount(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add your first transaction manually or scan a shopping bill to begin tracking.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-3">
              <button
                onClick={() => openAddModal('expense')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition"
              >
                Add First Expense
              </button>
              <button
                onClick={() => navigate('/scan-bill')}
                className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200 transition"
              >
                Scan a Bill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        defaultType={modalType}
        onClose={() => setIsAddModalOpen(false)}
        onTransactionSaved={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default Dashboard;
