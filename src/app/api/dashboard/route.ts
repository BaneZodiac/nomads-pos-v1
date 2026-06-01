import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    if (user.role === 'SUPER_ADMIN') {
      const [tenants, users, totalSales] = await Promise.all([
        prisma.tenant.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.sale.aggregate({ _sum: { total: true } }),
      ])
      return NextResponse.json({ success: true, data: { activeTenants: tenants, totalUsers: users, totalRevenue: totalSales._sum.total || 0 } })
    }

    if (!user.tenantId) return NextResponse.json({ success: false, error: 'No tenant' }, { status: 403 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todaySales, todayTransactions, totalProducts, totalCustomers, lowStockItems, monthlySales] = await Promise.all([
      prisma.sale.aggregate({ where: { tenantId: user.tenantId, createdAt: { gte: today } }, _sum: { total: true } }),
      prisma.sale.count({ where: { tenantId: user.tenantId, createdAt: { gte: today } } }),
      prisma.product.count({ where: { tenantId: user.tenantId, isActive: true } }),
      prisma.customer.count({ where: { tenantId: user.tenantId } }),
      prisma.stock.count({ where: { product: { tenantId: user.tenantId }, quantity: { lte: prisma.stock.fields.minStock } } }),
      prisma.sale.aggregate({ where: { tenantId: user.tenantId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } }, _sum: { total: true } }),
    ])

    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      where: { sale: { tenantId: user.tenantId, createdAt: { gte: today } } },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    const topProductNames = await Promise.all(
      topProducts.map(async p => {
        const product = await prisma.product.findUnique({ where: { id: p.productId } })
        return { name: product?.name || 'Unknown', total: p._sum.total || 0 }
      })
    )

    const salesByPayment = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: { tenantId: user.tenantId, createdAt: { gte: today } },
      _sum: { total: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        todaySales: todaySales._sum.total || 0,
        todayTransactions,
        totalProducts,
        totalCustomers,
        lowStockItems,
        monthlySales: monthlySales._sum.total || 0,
        topProducts: topProductNames,
        salesByPayment: salesByPayment.map(s => ({ method: s.paymentMethod, total: s._sum.total || 0 })),
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
