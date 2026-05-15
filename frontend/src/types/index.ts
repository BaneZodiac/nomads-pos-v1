export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  isActive: boolean;
  createdAt: string;
  subscription?: Subscription;
  settings?: TenantSettings;
  _count?: { users: number; products: number; sales: number; customers: number; suppliers: number; locations: number };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  billingCycle: string;
  trialDays: number;
  maxUsers: number;
  maxLocations: number;
  maxProducts: number;
  maxCustomers: number;
  maxInvoices: number;
  maxSuppliers: number;
  features?: string;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: string;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
  autoRenew: boolean;
}

export interface TenantSettings {
  id: string;
  tenantId: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptTheme: string;
  barcodeFormat: string;
  taxRate: number;
  taxName: string;
  enableDiscount: boolean;
  enableLoyalty: boolean;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  invoicePrefix: string;
  receiptPrefix: string;
  lowStockAlert: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  tenantId?: string;
  roleId?: string;
  role?: Role;
  locationId?: string;
  location?: Location;
  lastLoginAt?: string;
}

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  action: string;
  scope: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  taxRate: number;
  unit: string;
  minStock: number;
  isActive: boolean;
  hasVariants: boolean;
  image?: string;
  stocks?: Stock[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock: number;
  attributes?: string;
  isActive: boolean;
}

export interface Stock {
  id: string;
  productId: string;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  loyaltyPoints: number;
  totalSpent: number;
  notes?: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  balance: number;
  notes?: string;
  isActive: boolean;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customer?: Customer;
  userId: string;
  user?: User;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  status: string;
  paymentMethod: string;
  shiftId?: string;
  notes?: string;
  items: SaleItem[];
  payments: Payment[];
  returns?: Return[];
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  reference?: string;
}

export interface Return {
  id: string;
  saleId: string;
  reason: string;
  totalAmount: number;
  status: string;
  items: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId?: string;
  supplier?: Supplier;
  orderNo: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  dueDate?: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Shift {
  id: string;
  userId: string;
  user?: User;
  locationId?: string;
  location?: Location;
  openingCash: number;
  closingCash?: number;
  openingTime: string;
  closingTime?: string;
  totalSales: number;
  totalReturns: number;
  note?: string;
  status: string;
}

export interface DashboardData {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  totalTransactions: number;
  recentSales: Sale[];
  topProducts: any[];
  lowStockCount: number;
  lowStockItems: Product[];
  weeklySales: any[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
