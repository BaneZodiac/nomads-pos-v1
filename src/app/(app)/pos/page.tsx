'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { PageLoading } from '@/components/ui/Loading'
import { SearchInput } from '@/components/ui/SearchInput'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, PAYMENT_METHODS, generateInvoiceNo } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Product, Customer, CartItem } from '@/types'
import {
  Search, Plus, Minus, Trash2, UserPlus, Printer, X,
  ShoppingCart, Barcode, Percent, DollarSign, CreditCard, Loader2
} from 'lucide-react'

export default function POSPage() {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => { searchRef.current?.focus() }, [])

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, custRes] = await Promise.all([
        fetch('/api/products?limit=500'),
        fetch('/api/customers?limit=500')
      ])
      const prodData = await prodRes.json()
      const custData = await custRes.json()
      if (prodData.success) setProducts(prodData.data || [])
      if (custData.success) setCustomers(custData.data || [])
    }
    fetchData()
  }, [])

  const filteredProducts = products.filter(p =>
    p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    )
  )

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone && c.phone.includes(customerSearch))
  )

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i
        )
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        costPrice: product.costPrice,
        quantity: 1,
        tax: product.taxRate,
        discount: 0,
        total: product.price,
        image: product.image,
      }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i
      const newQty = Math.max(1, i.quantity + delta)
      return { ...i, quantity: newQty, total: newQty * i.price }
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId))
  }

  const cartSubtotal = cart.reduce((sum, i) => sum + i.total, 0)
  const cartTaxTotal = cart.reduce((sum, i) => sum + (i.total * i.tax / 100), 0)
  const cartDiscount = discountType === 'percentage' ? cartSubtotal * (discount / 100) : discount
  const cartTotal = cartSubtotal + cartTaxTotal - cartDiscount
  const dueAmount = parseFloat(paidAmount) || 0
  const changeAmount = Math.max(0, dueAmount - cartTotal)

  const handleProductSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      addToCart(filteredProducts[0])
      setSearch('')
    }
  }

  const processSale = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    if (dueAmount < cartTotal && paymentMethod !== 'credit') {
      toast.error('Insufficient payment amount')
      return
    }

    setProcessing(true)
    const invoiceNo = generateInvoiceNo()

    const payload = {
      invoiceNo,
      items: cart,
      subtotal: cartSubtotal,
      taxTotal: cartTaxTotal,
      discountTotal: cartDiscount,
      total: cartTotal,
      paidAmount: dueAmount || cartTotal,
      changeAmount,
      paymentMethod,
      customerId: selectedCustomer?.id || null,
    }

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Sale completed!')
        setCart([])
        setSelectedCustomer(null)
        setPaidAmount('')
        setDiscount(0)
        setShowPaymentModal(false)
      } else {
        toast.error(data.error || 'Sale failed')
      }
    } catch {
      toast.error('Sale failed')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading') return <PageLoading />
  if (!session) return null

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleProductSearch}
              placeholder="Search products by name, SKU, or barcode... (Enter to add)"
              className="input pl-10"
            />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCustomerModal(true)}>
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Customer</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 content-start">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="card p-3 text-left hover:border-primary-300 hover:shadow-md transition-all group"
            >
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <PackageIcon className="w-8 h-8 text-primary-400" />
              </div>
              <p className="text-xs font-medium text-stone-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-400 truncate">{product.sku}</p>
              <p className="text-sm font-bold text-primary-600 mt-1">{formatCurrency(product.price)}</p>
            </button>
          ))}
          {filteredProducts.length === 0 && search && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <PackageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Selected Customer */}
        {selectedCustomer && (
          <div className="px-4 py-2 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-primary-700">{selectedCustomer.name}</span>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="text-primary-400 hover:text-primary-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Search and click products to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="btn btn-ghost btn-sm p-1">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="btn btn-ghost btn-sm p-1">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-semibold text-stone-900 w-20 text-right">{formatCurrency(item.total)}</p>
                <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Discount Input */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={discount || ''}
              onChange={e => setDiscount(Number(e.target.value))}
              placeholder="Discount"
              className="input flex-1 text-sm"
            />
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className="select w-24 text-sm"
            >
              <option value="percentage">%</option>
              <option value="fixed">$</option>
            </select>
          </div>
        </div>

        {/* Totals */}
        <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax</span>
            <span>{formatCurrency(cartTaxTotal)}</span>
          </div>
          {cartDiscount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Discount</span>
              <span>-{formatCurrency(cartDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-stone-900 pt-1 border-t border-gray-100">
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-4">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="btn btn-primary w-full btn-lg text-base"
          >
            <CreditCard className="w-5 h-5" />
            Charge {formatCurrency(cartTotal)}
          </button>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <Modal open={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Select Customer">
        <div className="space-y-4">
          <SearchInput value={customerSearch} onChange={setCustomerSearch} placeholder="Search customers..." />
          <div className="max-h-60 overflow-y-auto space-y-2">
            <button
              onClick={() => { setSelectedCustomer(null); setShowCustomerModal(false) }}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 text-sm text-gray-600"
            >
              Walk-in Customer (No customer)
            </button>
            {filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCustomer(c); setShowCustomerModal(false) }}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50"
              >
                <p className="text-sm font-medium text-stone-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone || c.email || 'No contact'}</p>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Complete Sale" size="sm">
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-3xl font-bold text-stone-900">{formatCurrency(cartTotal)}</p>
            <p className="text-sm text-gray-500 mt-1">Total Amount Due</p>
          </div>

          <div>
            <label className="label">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`btn border ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'} btn-sm`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Amount Received</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="number"
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                className="input pl-10 text-lg font-semibold"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {changeAmount > 0 && (
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-600">Change Due</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(changeAmount)}</p>
            </div>
          )}

          <button
            onClick={processSale}
            disabled={processing}
            className="btn btn-primary w-full btn-lg"
          >
            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
            {processing ? 'Processing...' : `Complete Sale`}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}
