import React, { useEffect, useState } from 'react';
import { Plus, Eye, Trash2, X, ShoppingBag, PlusCircle, Trash, EyeOff } from 'lucide-react';
import { api } from '../api';

export default function OrderPage({ addToast, showConfirm }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New Order Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([]); // List of { product_id, name, sku, quantity, price, max_stock }
  
  // Current Item Form state
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentItemQty, setCurrentItemQty] = useState('1');
  const [formError, setFormError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      addToast(err.message || 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndCustomers = async () => {
    try {
      const [prodData, custData] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(prodData);
      setCustomers(custData);
    } catch (err) {
      addToast(err.message || 'Failed to load products/customers details', 'error');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProductsAndCustomers();
  }, []);

  const openCreateModal = () => {
    setSelectedCustomerId('');
    setOrderItems([]);
    setCurrentItemId('');
    setCurrentItemQty('1');
    setFormError('');
    setCreateModalOpen(true);
    fetchProductsAndCustomers(); // Refresh lists
  };

  const addItemToOrder = () => {
    setFormError('');
    if (!currentItemId) return setFormError('Please select a product');
    
    const qty = parseInt(currentItemQty);
    if (isNaN(qty) || qty <= 0) return setFormError('Quantity must be greater than 0');

    const selectedProduct = products.find(p => p.id === parseInt(currentItemId));
    if (!selectedProduct) return setFormError('Product not found');

    // Check client-side stock availability
    if (selectedProduct.quantity_in_stock < qty) {
      return setFormError(`Insufficient stock! Available: ${selectedProduct.quantity_in_stock}`);
    }

    // Check if product is already added
    const existingIndex = orderItems.findIndex(item => item.product_id === selectedProduct.id);
    if (existingIndex > -1) {
      const totalQty = orderItems[existingIndex].quantity + qty;
      if (selectedProduct.quantity_in_stock < totalQty) {
        return setFormError(`Cannot add more. Combined qty (${totalQty}) exceeds available stock (${selectedProduct.quantity_in_stock}).`);
      }
      const updated = [...orderItems];
      updated[existingIndex].quantity = totalQty;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        product_id: selectedProduct.id,
        name: selectedProduct.name,
        sku: selectedProduct.sku,
        quantity: qty,
        price: selectedProduct.price,
        max_stock: selectedProduct.quantity_in_stock
      }]);
    }

    // Reset item selector
    setCurrentItemId('');
    setCurrentItemQty('1');
  };

  const removeOrderItem = (index) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCustomerId) return setFormError('Please select a customer');
    if (orderItems.length === 0) return setFormError('Please add at least one product to the order');

    const payload = {
      customer_id: parseInt(selectedCustomerId),
      items: orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };

    try {
      await api.post('/orders', payload);
      addToast('Order placed successfully', 'success');
      setCreateModalOpen(false);
      fetchOrders();
      fetchProductsAndCustomers(); // Refresh stock levels locally
    } catch (err) {
      setFormError(err.message || 'Failed to place order');
    }
  };

  const handleDeleteOrder = (order) => {
    showConfirm({
      title: 'Cancel & Delete Order',
      message: `Are you sure you want to cancel Order #${order.id}? The inventory levels for all items inside this order will be automatically restored. This action cannot be reversed.`,
      onConfirm: async () => {
        try {
          await api.delete(`/orders/${order.id}`);
          addToast('Order cancelled and inventory restored', 'success');
          fetchOrders();
          fetchProductsAndCustomers(); // Refresh stock levels locally
        } catch (err) {
          addToast(err.message || 'Failed to cancel order', 'error');
        }
      }
    });
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const data = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data);
      setDetailsModalOpen(true);
    } catch (err) {
      addToast(err.message || 'Failed to load order details', 'error');
    }
  };

  const getOrderTotalEstimate = () => {
    return orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Track orders, calculate billing totals, and manage fulfillment.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <Plus size={16} />
          Create Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <ShoppingBag className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="font-medium text-sm">No orders recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Click "Create Order" to build and place your first transaction.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-100 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-800 text-xs">#ORD-{order.id}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 text-base">${order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order.id)}
                        className="text-gray-500 hover:text-indigo-600 p-1.5 rounded hover:bg-gray-100 transition-all inline-flex items-center"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order)}
                        className="text-gray-500 hover:text-red-600 p-1.5 rounded hover:bg-gray-100 transition-all inline-flex items-center"
                        title="Cancel Order"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Place Order Modal overlay */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-200 overflow-hidden transform scale-100 transition-transform my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-indigo-600" />
                Place New Order
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handlePlaceOrder} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-150 font-medium">
                  {formError}
                </div>
              )}

              {/* 1. Customer Select */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Select Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">-- Choose registered customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Please register a customer first in Customer tab.</p>
                )}
              </div>

              {/* 2. Item Adder Segment */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">Add Catalog Items to Order</h4>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <select
                      value={currentItemId}
                      onChange={(e) => setCurrentItemId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.quantity_in_stock === 0}>
                          {p.name} (SKU: {p.sku}) — ${p.price.toFixed(2)} [Stock: {p.quantity_in_stock}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={currentItemQty}
                      onChange={(e) => setCurrentItemQty(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    <PlusCircle size={15} />
                    Add
                  </button>
                </div>
              </div>

              {/* 3. Items Basket List */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Order Items Basket ({orderItems.length})
                </label>

                {orderItems.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-sm">
                    No products added to the basket yet. Choose products above to compile.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs bg-white">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-2.5">Product</th>
                          <th className="px-4 py-2.5">SKU</th>
                          <th className="px-4 py-2.5">Price</th>
                          <th className="px-4 py-2.5 text-center">Qty</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                          <th className="px-4 py-2.5 text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orderItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors text-gray-700">
                            <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 font-mono text-[10px]">{item.sku}</td>
                            <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center font-semibold">{item.quantity}</td>
                            <td className="px-4 py-2 text-right font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeOrderItem(idx)}
                                className="text-gray-400 hover:text-red-600 p-1"
                              >
                                <Trash size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Estimate Summary Row */}
                        <tr className="bg-indigo-50/50 font-bold border-t border-indigo-100">
                          <td colSpan={4} className="px-4 py-3 text-right text-gray-700 uppercase tracking-wider text-[10px]">Estimated Total:</td>
                          <td className="px-4 py-3 text-right text-indigo-700 text-sm">${getOrderTotalEstimate().toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderItems.length === 0}
                  className={`rounded-lg px-5 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white ${
                    orderItems.length === 0 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer'
                  }`}
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal overlay */}
      {detailsModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-gray-200 overflow-hidden transform scale-100 transition-transform">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Order Details
                </h3>
                <p className="text-xs text-indigo-600 font-mono mt-0.5">#ORD-{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Customer summary */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customer Name</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Customer Email</p>
                  <p className="text-sm font-mono text-gray-700 mt-0.5">{selectedOrder.customer_email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date & Time Ordered</p>
                  <p className="text-sm text-gray-700 mt-0.5">{formatDate(selectedOrder.created_at)}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Purchased Products</h4>
                
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs bg-white">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-4 py-2.5 font-mono">SKU</th>
                        <th className="px-4 py-2.5 text-center">Qty</th>
                        <th className="px-4 py-2.5 text-right">Unit Price</th>
                        <th className="px-4 py-2.5 text-right">Item Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{item.product_name}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px]">{item.product_sku}</td>
                          <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-900">${(item.unit_price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Grand Total Row */}
                      <tr className="bg-gray-50/70 border-t border-gray-200 font-extrabold text-sm text-gray-900">
                        <td colSpan={4} className="px-4 py-3.5 text-right uppercase tracking-wider text-[10px] text-gray-500">Order Grand Total:</td>
                        <td className="px-4 py-3.5 text-right text-indigo-700 font-bold text-base">${selectedOrder.total_amount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm focus:outline-none"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
