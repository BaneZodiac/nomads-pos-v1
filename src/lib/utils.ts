import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', options || { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function generateInvoiceNo(): string {
  const prefix = 'INV'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}${random}`
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

export function calculateDiscount(amount: number, discountRate: number): number {
  return amount * (discountRate / 100)
}

export function getLowStockItems(stock: number, minStock: number): boolean {
  return stock <= minStock
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'mobile', label: 'Mobile Money', icon: '📱' },
  { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { id: 'split', label: 'Split Payment', icon: '🔀' },
]

export const USER_ROLES = [
  { id: 'SUPER_ADMIN', label: 'Super Admin', level: 100 },
  { id: 'TENANT_ADMIN', label: 'Tenant Admin', level: 80 },
  { id: 'MANAGER', label: 'Manager', level: 60 },
  { id: 'ACCOUNTANT', label: 'Accountant', level: 40 },
  { id: 'CASHIER', label: 'Cashier', level: 20 },
  { id: 'SUPPORT', label: 'Support', level: 10 },
]

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'badge-danger',
    TENANT_ADMIN: 'badge-primary',
    MANAGER: 'badge-warning',
    ACCOUNTANT: 'badge-info',
    CASHIER: 'badge-success',
    SUPPORT: 'badge-info',
  }
  return map[role] || 'badge-info'
}
