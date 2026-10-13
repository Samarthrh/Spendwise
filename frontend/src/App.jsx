import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import AddTransactionModal from './components/AddTransactionModal';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import ScanBill from './pages/ScanBill';
import SavedBills from './pages/SavedBills';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import ProfileSettings from './pages/ProfileSettings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuth();
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Authenticated Application Shell */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Mobile Drawer Backdrop & Menu */}
                {mobileMenuOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className="w-64 bg-white min-h-screen p-5 space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="font-bold text-lg text-slate-900 pb-3 border-b border-slate-100">
                        Spend<span className="text-emerald-700">Wise</span>
                      </div>
                      <nav className="space-y-1 text-sm font-medium">
                        {[
                          { name: 'Dashboard', path: '/dashboard' },
                          { name: 'Transactions', path: '/transactions' },
                          { name: 'Scan Bill', path: '/scan-bill' },
                          { name: 'Saved Bills', path: '/saved-bills' },
                          { name: 'Budgets', path: '/budgets' },
                          { name: 'Categories', path: '/categories' },
                          { name: 'Settings', path: '/settings' },
                        ].map((item) => (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-lg transition ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`
                            }
                          >
                            {item.name}
                          </NavLink>
                        ))}
                      </nav>
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 md:pl-64 flex flex-col min-w-0">
                  <Navbar
                    onOpenAddTransaction={() => setIsAddTxModalOpen(true)}
                    onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                    mobileMenuOpen={mobileMenuOpen}
                  />

                  <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/scan-bill" element={<ScanBill />} />
                      <Route path="/saved-bills" element={<SavedBills />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/settings" element={<ProfileSettings />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>

                  {/* Mobile Bottom Navigation */}
                  <BottomNav />
                </div>
              </div>

              {/* Global Add Transaction Modal */}
              <AddTransactionModal
                isOpen={isAddTxModalOpen}
                onClose={() => setIsAddTxModalOpen(false)}
                onTransactionSaved={() => {
                  window.dispatchEvent(new Event('transaction-saved'));
                }}
              />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
