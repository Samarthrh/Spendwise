import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Receipt,
  PieChart,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20">
              <ScanLine className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">Spend<span className="text-emerald-700">Wise</span></span>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-xs md:text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Bill Scanning & Financial Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
            Effortless Expense Tracking, <br className="hidden sm:inline" />
            <span className="text-emerald-700">Powered by Smart OCR.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Scan physical grocery bills, restaurant receipts, and PDFs with your phone or camera. SpendWise extracts retailer details and itemized lines into a clean, editable ledger in seconds.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-md shadow-emerald-700/20 flex items-center justify-center space-x-2"
            >
              <span>Start Managing for Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium bg-white text-slate-700 hover:text-slate-900 border border-slate-200 transition"
            >
              Explore Live Demo
            </Link>
          </div>

          {/* Value Props Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <ScanLine className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Smart Bill OCR Scanning</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Snap a photo of any receipt from DMart, Trends, supermarkets, or restaurants. Extract store name, items, tax, and totals automatically.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <PieChart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Budget Utilization & Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Set monthly category budgets and overall limits. Receive real-time progress bars and alerts when approaching 80% or 100% capacity.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Dynamic Financial Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compare multi-month income versus expenses, analyze top spending categories, and export records to CSV with one click.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 SpendWise. Modern Personal Finance & Smart Bill Scanning.</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bank-grade Privacy</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
