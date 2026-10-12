import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, ScanLine, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const Navbar = ({ onOpenAddTransaction, onToggleMobileMenu, mobileMenuOpen }) => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();

  const currentDateFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 px-4 md:px-8 flex items-center justify-between">
      {/* Mobile brand & menu button */}
      <div className="flex items-center space-x-3 md:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <NavLink to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
            <ScanLine className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900">Spend<span className="text-emerald-700">Wise</span></span>
        </NavLink>
      </div>

      {/* Desktop breadcrumb / date badge */}
      <div className="hidden md:flex items-center space-x-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          Period: <strong className="ml-1 text-slate-900">{currentDateFormatted}</strong>
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
          Currency: <strong className="ml-1">{currency}</strong>
        </span>
      </div>

      {/* Right action controls */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <button
          onClick={() => navigate('/scan-bill')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition border border-emerald-200/80 shadow-xs"
        >
          <ScanLine className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">Scan Bill</span>
        </button>

        <button
          onClick={onOpenAddTransaction}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Entry</span>
        </button>

        {/* User initials bubble on desktop */}
        <NavLink
          to="/settings"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700 hover:ring-2 hover:ring-emerald-600 transition"
          title="Account Settings"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;
