import React, { useEffect, useState } from 'react';
import { Package, Users, ShoppingBag, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api';

export default function DashboardPage({ addToast }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.get('/dashboard/summary');
      setSummary(data);
    } catch (err) {
      addToast(err.message || 'Failed to load dashboard summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const lowStockCount = summary?.low_stock_products?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Real-time overview of your products, customers, and stock levels.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Products Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 transition-transform hover:translate-y-[-2px] duration-200">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_products ?? 0}</h3>
          </div>
        </div>

        {/* Customers Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 transition-transform hover:translate-y-[-2px] duration-200">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Customers</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_customers ?? 0}</h3>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 transition-transform hover:translate-y-[-2px] duration-200">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-lg">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{summary?.total_orders ?? 0}</h3>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-5 transition-transform hover:translate-y-[-2px] duration-200`}>
          <div className={`p-4 rounded-lg ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
            <h3 className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</h3>
          </div>
        </div>
      </div>

      {/* Low Stock Section */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Low Stock Inventory
          </h2>
          <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-medium">
            Threshold: &lt; 10 units
          </span>
        </div>
        
        {lowStockCount === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="font-medium text-sm">All products are sufficiently stocked!</p>
            <p className="text-xs text-gray-400 mt-1">No products are currently below 10 units.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU / Code</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5 text-right">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {summary.low_stock_products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        product.quantity_in_stock === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {product.quantity_in_stock} units
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
