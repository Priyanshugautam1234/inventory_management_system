import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, ShoppingCart, Menu, X, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import DashboardPage from './components/DashboardPage';
import ProductPage from './components/ProductPage';
import CustomerPage from './components/CustomerPage';
import OrderPage from './components/OrderPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]); // List of { id, message, type }
  const [confirmConfig, setConfirmConfig] = useState(null); // { title, message, onConfirm }

  // --- Toast Handler ---
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Confirmation Dialog Handler ---
  const showConfirm = (config) => {
    setConfirmConfig(config);
  };

  const handleConfirm = () => {
    if (confirmConfig?.onConfirm) {
      confirmConfig.onConfirm();
    }
    setConfirmConfig(null);
  };

  // Close mobile sidebar on tab change
  const navigateTo = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Render matching page view
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage addToast={addToast} />;
      case 'products':
        return <ProductPage addToast={addToast} showConfirm={showConfirm} />;
      case 'customers':
        return <CustomerPage addToast={addToast} showConfirm={showConfirm} />;
      case 'orders':
        return <OrderPage addToast={addToast} showConfirm={showConfirm} />;
      default:
        return <DashboardPage addToast={addToast} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* --- MOBILE NAVBAR TOP --- */}
      <header className="bg-slate-900 text-white p-4 flex md:hidden justify-between items-center shadow-md">
        <div className="flex items-center gap-2.5">
          <Package className="text-indigo-400" size={24} />
          <span className="font-extrabold text-base tracking-wider uppercase">InventoryPro</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-300 hover:text-white p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* --- SIDEBAR NAVIGATION (Desktop & Mobile Panel) --- */}
      <aside className={`
        bg-slate-900 text-white w-64 flex-shrink-0 flex flex-col border-r border-slate-800 transition-all duration-300 z-30
        fixed md:static inset-y-0 left-0 transform md:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Segment */}
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <Package className="text-indigo-400" size={28} />
          <span className="font-black text-lg tracking-wider uppercase bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">InventoryPro</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => navigateTo('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package size={18} />
            Products
          </button>

          <button
            onClick={() => navigateTo('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} />
            Customers
          </button>

          <button
            onClick={() => navigateTo('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingCart size={18} />
            Orders
          </button>
        </nav>

        {/* Footer Admin Tag */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 font-medium tracking-wide text-center">
          v1.0.0 Admin Portal
        </div>
      </aside>

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
        />
      )}

      {/* --- MAIN PAGE CONTENT --- */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderPage()}
      </main>

      {/* --- GLOBAL SUCCESS/ERROR TOAST OVERLAYS --- */}
      <div className="fixed top-5 right-5 space-y-2.5 z-[9999] max-w-xs sm:max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`
              flex items-center gap-3 p-4 rounded-xl border shadow-lg cursor-pointer pointer-events-auto transform translate-y-0 transition-transform duration-200 animate-slide-in
              ${
                toast.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }
            `}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
            )}
            <p className="text-sm font-medium pr-2 leading-relaxed">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* --- GLOBAL CONFIRMATION DIALOG OVERLAY --- */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-gray-200 overflow-hidden transform scale-100 transition-transform">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center gap-2.5 bg-gray-50 text-gray-900">
              <HelpCircle className="text-indigo-600 flex-shrink-0" size={20} />
              <h4 className="font-bold text-sm uppercase tracking-wide">{confirmConfig.title || 'Confirm Action'}</h4>
            </div>

            {/* Message Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm leading-relaxed">{confirmConfig.message}</p>
            </div>

            {/* Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-3">
              <button
                onClick={() => setConfirmConfig(null)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                No, Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-red-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm focus:outline-none"
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
