import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Product, Customer } from '../types';
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
      toast.success('Sale completed!');
      setCart([]);
      setShowPayment(false);
      setPaidAmount('');
      setCustomerId('');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
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

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = subtotal + totalTax - totalDiscount;

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length > 0) {
      addToCart(filtered[0]);
    }
  }, [filtered]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4">
      {/* Product Grid / Search */}
      <div className="flex-1 flex flex-col">
        <div className="mb-3">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or search products..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 content-start">
          {filtered.map(product => {
            const stock = product.stocks?.[0]?.quantity || 0;
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={stock < 1}
                className={`p-3 rounded-xl border text-left transition ${
                  stock < 1
                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                <p className="font-medium text-sm text-slate-900 truncate">{product.name}</p>
                <p className="text-xs text-slate-500">{product.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-blue-600">${product.sellingPrice}</span>
                  <span className={`text-xs ${stock <= product.minStock ? 'text-red-500' : 'text-slate-400'}`}>
                    {stock} left
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Cart ({cart.length})</h2>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-8">
            Search and select products to add
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="p-2 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1">{item.productName}</p>
                  <span className="text-sm font-bold ml-2">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center bg-white border rounded">-</button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center bg-white border rounded">+</button>
                  <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => updateDiscount(item.productId, parseFloat(e.target.value) || 0)}
                    placeholder="Disc"
                    className="ml-auto w-16 px-1 py-1 text-xs border rounded text-center"
                  />
                  <button onClick={() => updateQty(item.productId, 0)} className="text-red-500 text-xs hover:text-red-700 ml-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        <div className="p-3 border-t border-slate-200 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-red-600"><span>Discount</span><span>-${totalDiscount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>+${totalTax.toFixed(2)}</span></div>
          <div className="flex justify-between text-lg font-bold text-slate-900 pt-1 border-t">
            <span>Total</span><span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-3 space-y-2">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Walk-in Customer</option>
            {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={handleCheckout}
            disabled={!cart.length || saleMutation.isPending}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saleMutation.isPending ? 'Processing...' : `Charge $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Complete Payment</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm"><span>Total</span><span className="font-bold text-lg">${grandTotal.toFixed(2)}</span></div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile Payment</option>
                  <option value="split">Split Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount Received</label>
                <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-lg font-bold" step="0.01" />
              </div>
              {parseFloat(paidAmount) > grandTotal && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Change Due</span>
                  <span className="font-bold">${(parseFloat(paidAmount) - grandTotal).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowPayment(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handlePayment} disabled={parseFloat(paidAmount) < grandTotal || saleMutation.isPending} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                {saleMutation.isPending ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
