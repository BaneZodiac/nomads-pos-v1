import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Product, Customer } from '../types';
import toast from 'react-hot-toast';

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export default function PosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/products/all');
      return data.data as Product[];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/customers/all');
      return data.data as Customer[];
    },
  });

  const saleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const { data } = await api.post('/sales', saleData);
      return data;
    },
    onSuccess: () => {
      toast.success('Sale completed successfully!', { duration: 3000 });
      setCart([]);
      setShowPayment(false);
      setPaidAmount('');
      setCustomerId('');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      searchRef.current?.focus();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Sale failed'),
  });

  const filtered = products?.filter(p =>
    p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
    )
  ) || [];

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    const stock = product.stocks?.[0]?.quantity || 0;

    if (existing) {
      if (existing.quantity >= stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice - item.discount + item.tax }
          : item
      ));
    } else {
      if (stock < 1) {
        toast.error('Out of stock');
        return;
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discount: 0,
        tax: product.taxRate ? (product.sellingPrice * product.taxRate / 100) : 0,
        total: product.sellingPrice,
      }]);
    }
    setSearch('');
    searchRef.current?.focus();
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty < 1) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: qty, total: qty * item.unitPrice - item.discount + item.tax }
        : item
    ));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, discount, total: item.quantity * item.unitPrice - discount + item.tax }
        : item
    ));
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      addToCart(filtered[0]);
    }
  }, [filtered]);

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = subtotal + totalTax - totalDiscount;
  const changeAmount = parseFloat(paidAmount) - grandTotal;

  const handleCheckout = () => {
    if (!cart.length) return toast.error('Cart is empty');
    setShowPayment(true);
    setPaidAmount(grandTotal.toFixed(2));
  };

  const handlePayment = () => {
    if (!paidAmount || parseFloat(paidAmount) < grandTotal) {
      toast.error('Insufficient payment');
      return;
    }
    saleMutation.mutate({
      customerId: customerId || undefined,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
      })),
      payments: [{ method: paymentMethod, amount: parseFloat(paidAmount) }],
      discountTotal: totalDiscount,
    });
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan barcode or search products..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(product => {
              const stock = product.stocks?.[0]?.quantity || 0;
              const isLowStock = stock <= product.minStock;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={stock < 1}
                  className={`p-4 rounded-xl border-2 transition-all text-left group ${
                    stock < 1
                      ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-4xl opacity-30 group-hover:opacity-60 transition">📦</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-slate-500 mb-2">{product.sku}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold text-blue-600">${product.sellingPrice}</span>
                    {stock > 0 && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isLowStock ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                        {stock} left
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && search && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col max-h-[calc(100vh-8rem)] lg:max-h-none">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Current Order</h2>
              <p className="text-sm text-slate-500">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium">Cart is empty</p>
              <p className="text-sm mt-1">Search and add products</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-slate-900 text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </div>
                  <button
                    onClick={() => updateQty(item.productId, 0)}
                    className="text-slate-400 hover:text-red-500 p-1 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-semibold text-slate-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                  >
                    +
                  </button>
                  <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                    placeholder="Disc"
                    className="w-16 px-2 py-1.5 text-sm text-center border rounded-lg"
                  />
                  <span className="text-base font-bold text-slate-900 w-20 text-right">
                    ${item.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>-${totalDiscount.toFixed(2)}</span>
            </div>
          )}
          {totalTax > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>+${totalTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t">
            <span>Total</span>
            <span className="text-blue-600">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-2 space-y-3">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">Walk-in Customer</option>
            {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={handleCheckout}
            disabled={!cart.length || saleMutation.isPending}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
          >
            {saleMutation.isPending ? 'Processing...' : `Charge $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900">Complete Payment</h3>
              <button onClick={() => setShowPayment(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Amount</span>
                <span className="text-3xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {['cash', 'card', 'mobile', 'split'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium capitalize border-2 transition ${
                      paymentMethod === method
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {method === 'mobile' ? 'Mobile' : method}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Received */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount Received</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-xl font-bold text-center focus:border-blue-500 focus:outline-none"
                step="0.01"
                autoFocus
              />
            </div>

            {/* Change */}
            {parseFloat(paidAmount) >= grandTotal && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 font-medium">Change Due</span>
                  <span className="text-2xl font-bold text-emerald-600">${changeAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-3 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={parseFloat(paidAmount) < grandTotal || saleMutation.isPending}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl transition disabled:opacity-50 shadow-lg"
              >
                {saleMutation.isPending ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}