import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const [activeTenants, totalUsers, totalProducts, activePlans, superAdmins, totalRevenue] = await Promise.all([
      prisma.tenant.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.plan.count(),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.sale.aggregate({ _sum: { total: true } }),
    ])

    return NextResponse.json({
      success: true,
      data: { activeTenants, totalUsers, totalProducts, activePlans, superAdmins, totalRevenue: totalRevenue._sum.total || 0 },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
