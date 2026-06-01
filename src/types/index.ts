export type { Tenant, Plan, User, Location, Category, Product, Variant, Stock, Customer, Supplier, Sale, SaleItem, Payment, Purchase, PurchaseItem, ShiftLog, TenantSetting, SystemSetting, AuditLog, UserRole } from '@prisma/client'

export interface CartItem {
  productId: string
  name: string
  sku: string
  price: number
  costPrice: number
  quantity: number
  tax: number
  discount: number
  total: number
  image?: string | null
}

export interface PosCart {
  items: CartItem[]
  customerId?: string
  customerName?: string
  subtotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  paymentMethod: string
  paidAmount: number
  changeAmount: number
}

export interface DashboardStats {
  todaySales: number
  todayTransactions: number
  totalProducts: number
  totalCustomers: number
  lowStockItems: number
  monthlySales: number
  weeklySales: { date: string; amount: number }[]
  topProducts: { name: string; total: number }[]
  salesByPayment: { method: string; total: number }[]
}

export interface ReportData {
  sales: { date: string; count: number; total: number; profit: number }[]
  summary: {
    totalSales: number
    totalProfit: number
    totalTransactions: number
    avgOrderValue: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: Pagination
}
