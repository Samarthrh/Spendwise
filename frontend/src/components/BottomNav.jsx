import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, ScanLine, PieChart, BarChart3 } from 'lucide-react';

const BottomNav = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-bottom shadow-lg">
      <div className="flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>Expenses</span>
        </NavLink>

        {/* Center Prominent Scan Button */}
        <NavLink
          to="/scan-bill"
          className={({ isActive }) =>
            `flex flex-col items-center -mt-4 py-1.5 px-3 text-[10px] font-semibold transition`
          }
        >
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 active:scale-95 transition-transform ring-4 ring-white">
            <ScanLine className="w-6 h-6" />
          </div>
          <span className="mt-1 text-emerald-800">Scan Bill</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span>Budgets</span>
        </NavLink>

        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span>Reports</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
