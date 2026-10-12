import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  FileText,
  PieChart,
  BarChart3,
  Tag,
  Settings,
  LogOut,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { symbol } = useCurrency();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: Receipt },
    { name: 'Scan Bill', path: '/scan-bill', icon: ScanLine, highlight: true },
    { name: 'Saved Bills', path: '/saved-bills', icon: FileText },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Categories', path: '/categories', icon: Tag },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSeedDemo = async () => {
    if (window.confirm('Load demo financial data? This will add realistic transactions, budgets, and scanned bills to your account.')) {
      try {
        setLoadingDemo(true);
        await api.post('/demo/seed');
        window.location.reload();
      } catch (err) {
        alert('Failed to load demo data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoadingDemo(false);
      }
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-screen fixed left-0 top-0 bottom-0 z-30 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <NavLink to="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Spend<span className="text-emerald-700">Wise</span></span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">Finance & OCR</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                } ${item.highlight ? 'ring-1 ring-emerald-600/20 bg-emerald-50/50' : ''}`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </div>
              {item.highlight && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700 text-white tracking-wide">
                  Smart OCR
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Quick Demo Data Card */}
        <div className="pt-6">
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-slate-50 rounded-xl border border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Explore Demo Mode</span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
              Populate your dashboard with realistic DMart bills, multi-month trends, and budgets.
            </p>
            <button
              onClick={handleSeedDemo}
              disabled={loadingDemo}
              className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>{loadingDemo ? 'Populating...' : 'Load Sample Data'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center border border-slate-300">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
