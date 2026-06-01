import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.auditLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.purchaseItem.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.shiftLog.deleteMany()
  await prisma.stock.deleteMany()
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.location.deleteMany()
  await prisma.tenantSetting.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.systemSetting.deleteMany()

  // Create System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'app_name', value: 'Nomads POS' },
      { key: 'app_version', value: '1.0.0' },
      { key: 'default_currency', value: 'USD' },
      { key: 'default_tax_rate', value: '0' },
      { key: 'smtp_host', value: '' },
      { key: 'smtp_port', value: '587' },
    ],
  })

  // Create Plans
  const starter = await prisma.plan.create({
    data: {
      name: 'Starter',
      description: 'For small businesses just getting started',
      price: 29,
      billingCycle: 'monthly',
      trialDays: 14,
      maxUsers: 2,
      maxLocations: 1,
      maxProducts: 100,
      hasReports: true,
      hasApi: false,
      hasMultiStore: false,
      hasLoyalty: false,
      hasAiInsights: false,
    },
  })

  const professional = await prisma.plan.create({
    data: {
      name: 'Professional',
      description: 'For growing businesses with multiple needs',
      price: 79,
      billingCycle: 'monthly',
      trialDays: 14,
      maxUsers: 10,
      maxLocations: 3,
      maxProducts: 5000,
      hasReports: true,
      hasApi: true,
      hasMultiStore: true,
      hasLoyalty: true,
      hasAiInsights: true,
    },
  })

  const enterprise = await prisma.plan.create({
    data: {
      name: 'Enterprise',
      description: 'For large businesses with advanced requirements',
      price: 199,
      billingCycle: 'monthly',
      trialDays: 30,
      maxUsers: 100,
      maxLocations: 20,
      maxProducts: 100000,
      hasReports: true,
      hasApi: true,
      hasMultiStore: true,
      hasLoyalty: true,
      hasAiInsights: true,
    },
  })

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 10)
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@nomads.com',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  // Create a Demo Tenant
  const demoPassword = await bcrypt.hash('admin123', 10)
  const demo = await prisma.tenant.create({
    data: {
      name: 'Demo Cafe',
      slug: 'demo-cafe',
      email: 'admin@democafe.com',
      phone: '+1-555-0100',
      address: '123 Main Street, New York, NY 10001',
      brandColor: '#F97316',
      isActive: true,
      planId: professional.id,
      maxUsers: 10,
      maxProducts: 5000,
    },
  })

  const location = await prisma.location.create({
    data: {
      name: 'Main Branch',
      address: '123 Main Street, New York, NY 10001',
      phone: '+1-555-0100',
      tenantId: demo.id,
    },
  })

  const tenantAdmin = await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'admin@nomads.com',
      password: demoPassword,
      role: 'TENANT_ADMIN',
      tenantId: demo.id,
      locationId: location.id,
      isActive: true,
    },
  })

  // Create additional users
  const users = [
    { name: 'John Manager', email: 'manager@nomads.com', role: 'MANAGER' as UserRole },
    { name: 'Sarah Cashier', email: 'cashier@nomads.com', role: 'CASHIER' as UserRole },
    { name: 'Mike Accountant', email: 'accountant@nomads.com', role: 'ACCOUNTANT' as UserRole },
  ]
  const userPassword = await bcrypt.hash('password123', 10)
  for (const u of users) {
    await prisma.user.create({
      data: { ...u, password: userPassword, tenantId: demo.id, locationId: location.id },
    })
  }

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Beverages', slug: 'beverages', tenantId: demo.id } }),
    prisma.category.create({ data: { name: 'Food', slug: 'food', tenantId: demo.id } }),
    prisma.category.create({ data: { name: 'Snacks', slug: 'snacks', tenantId: demo.id } }),
    prisma.category.create({ data: { name: 'Dairy', slug: 'dairy', tenantId: demo.id } }),
    prisma.category.create({ data: { name: 'Bakery', slug: 'bakery', tenantId: demo.id } }),
  ])

  // Create Products
  const productsData = [
    { name: 'Espresso', sku: 'BEV-001', price: 3.50, costPrice: 0.80, category: 'beverages', tax: 0 },
    { name: 'Cappuccino', sku: 'BEV-002', price: 4.50, costPrice: 1.00, category: 'beverages', tax: 0 },
    { name: 'Latte', sku: 'BEV-003', price: 4.75, costPrice: 1.10, category: 'beverages', tax: 0 },
    { name: 'Mocha', sku: 'BEV-004', price: 5.25, costPrice: 1.30, category: 'beverages', tax: 0 },
    { name: 'Hot Chocolate', sku: 'BEV-005', price: 4.00, costPrice: 0.90, category: 'beverages', tax: 0 },
    { name: 'Iced Coffee', sku: 'BEV-006', price: 4.25, costPrice: 0.95, category: 'beverages', tax: 0 },
    { name: 'Green Tea', sku: 'BEV-007', price: 2.75, costPrice: 0.50, category: 'beverages', tax: 0 },
    { name: 'Orange Juice', sku: 'BEV-008', price: 3.50, costPrice: 0.75, category: 'beverages', tax: 0 },
    { name: 'Club Sandwich', sku: 'FOOD-001', price: 8.50, costPrice: 3.50, category: 'food', tax: 0 },
    { name: 'Caesar Salad', sku: 'FOOD-002', price: 7.75, costPrice: 3.00, category: 'food', tax: 0 },
    { name: 'Grilled Chicken', sku: 'FOOD-003', price: 12.00, costPrice: 5.00, category: 'food', tax: 0 },
    { name: 'Pasta Carbonara', sku: 'FOOD-004', price: 10.50, costPrice: 4.00, category: 'food', tax: 0 },
    { name: 'French Fries', sku: 'SNACK-001', price: 3.50, costPrice: 1.00, category: 'snacks', tax: 0 },
    { name: 'Onion Rings', sku: 'SNACK-002', price: 4.00, costPrice: 1.20, category: 'snacks', tax: 0 },
    { name: 'Chicken Wings', sku: 'SNACK-003', price: 7.00, costPrice: 2.50, category: 'snacks', tax: 0 },
    { name: 'Nachos', sku: 'SNACK-004', price: 6.50, costPrice: 2.00, category: 'snacks', tax: 0 },
    { name: 'Croissant', sku: 'BAKERY-001', price: 2.75, costPrice: 0.80, category: 'bakery', tax: 0 },
    { name: 'Muffin', sku: 'BAKERY-002', price: 3.25, costPrice: 1.00, category: 'bakery', tax: 0 },
    { name: 'Bagel', sku: 'BAKERY-003', price: 2.50, costPrice: 0.70, category: 'bakery', tax: 0 },
    { name: 'Cheesecake', sku: 'BAKERY-004', price: 5.50, costPrice: 2.00, category: 'bakery', tax: 0 },
    { name: 'Milk 1L', sku: 'DAIRY-001', price: 2.00, costPrice: 1.20, category: 'dairy', tax: 0 },
    { name: 'Yogurt', sku: 'DAIRY-002', price: 1.50, costPrice: 0.80, category: 'dairy', tax: 0 },
    { name: 'Butter', sku: 'DAIRY-003', price: 3.00, costPrice: 1.50, category: 'dairy', tax: 0 },
    { name: 'Cheese Block', sku: 'DAIRY-004', price: 4.50, costPrice: 2.20, category: 'dairy', tax: 0 },
  ]

  const products: any[] = []
  for (const p of productsData) {
    const cat = categories.find(c => c.slug === p.category)
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        price: p.price,
        costPrice: p.costPrice,
        taxRate: p.tax,
        unit: 'pcs',
        lowStockQty: 5,
        trackStock: true,
        tenantId: demo.id,
        categoryId: cat?.id || null,
      },
    })
    products.push(product)

    // Create stock entry
    await prisma.stock.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: Math.floor(Math.random() * 80) + 10,
        minStock: 5,
      },
    })
  }

  // Create Customers
  const customerData = [
    { name: 'Alice Johnson', email: 'alice@email.com', phone: '+1-555-0101' },
    { name: 'Bob Smith', email: 'bob@email.com', phone: '+1-555-0102' },
    { name: 'Carol White', email: 'carol@email.com', phone: '+1-555-0103' },
    { name: 'David Brown', email: 'david@email.com', phone: '+1-555-0104' },
    { name: 'Emma Davis', email: 'emma@email.com', phone: '+1-555-0105' },
  ]

  for (const c of customerData) {
    await prisma.customer.create({
      data: { ...c, tenantId: demo.id, loyaltyPts: Math.floor(Math.random() * 200) },
    })
  }

  // Create Suppliers
  const supplierData = [
    { name: 'Fresh Foods Supply', email: 'orders@freshfoods.com', phone: '+1-555-0201' },
    { name: 'Beverage Distributors Inc', email: 'info@beveragedist.com', phone: '+1-555-0202' },
    { name: 'Dairy Fresh Co', email: 'sales@dairyfresh.com', phone: '+1-555-0203' },
  ]

  for (const s of supplierData) {
    await prisma.supplier.create({
      data: { ...s, tenantId: demo.id },
    })
  }

  // Create some sample sales
  const allCustomers = await prisma.customer.findMany({ where: { tenantId: demo.id } })
  const today = new Date()

  for (let d = 6; d >= 0; d--) {
    const numSales = Math.floor(Math.random() * 5) + 1
    for (let s = 0; s < numSales; s++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      date.setHours(10 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

      const numItems = Math.floor(Math.random() * 4) + 1
      const selectedProducts = [...products].sort(() => Math.random() - 0.5).slice(0, numItems)

      let subtotal = 0
      const items: any[] = selectedProducts.map(p => {
        const qty = Math.floor(Math.random() * 3) + 1
        const total = p.price * qty
        subtotal += total
        return { productId: p.id, quantity: qty, price: p.price, costPrice: p.costPrice, tax: 0, discount: 0, total }
      })

      const taxTotal = 0
      const discountTotal = 0
      const total = subtotal + taxTotal - discountTotal
      const paymentMethods = ['cash', 'card', 'mobile']
      const invoiceNo = `INV-${date.getTime().toString(36).toUpperCase()}-${s}`

      const customer = Math.random() > 0.5 && allCustomers.length > 0
        ? allCustomers[Math.floor(Math.random() * allCustomers.length)]
        : null

      const profit = items.reduce((sum: number, i: any) => sum + ((i.price - i.costPrice) * i.quantity), 0)

      await prisma.sale.create({
        data: {
          invoiceNo,
          subtotal,
          taxTotal,
          discountTotal,
          total,
          profit,
          paidAmount: total,
          changeAmount: 0,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: 'completed',
          tenantId: demo.id,
          userId: tenantAdmin.id,
          customerId: customer?.id || null,
          createdAt: date,
          items: { create: items },
        },
      })
    }
  }

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      { action: 'SYSTEM_INIT', entity: 'System', details: 'Platform initialized with seed data', userId: superAdmin.id },
      { action: 'TENANT_CREATED', entity: 'Tenant', entityId: demo.id, details: `Created tenant: ${demo.name}`, userId: superAdmin.id },
      { action: 'SEED_COMPLETED', entity: 'System', details: 'Demo data seeded successfully', userId: superAdmin.id },
    ],
  })

  console.log('✅ Database seeded successfully!')
  console.log(`\n📧 Demo Credentials:`)
  console.log(`   Super Admin: superadmin@nomads.com / admin123`)
  console.log(`   Tenant Admin: admin@nomads.com / admin123`)
  console.log(`   Manager: manager@nomads.com / password123`)
  console.log(`   Cashier: cashier@nomads.com / password123`)
  console.log(`   Accountant: accountant@nomads.com / password123`)
  console.log(`\n📦 Created: 1 plan (${starter.name}), 24 products, 5 customers, 3 suppliers, ~${Math.floor(Math.random() * 20) + 10} sample sales`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
