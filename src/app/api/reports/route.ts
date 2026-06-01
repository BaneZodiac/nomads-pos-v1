import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'today'

    let startDate: Date
    const now = new Date()
    switch (period) {
      case 'today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break
      case 'week': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()); break
      case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break
      case 'year': startDate = new Date(now.getFullYear(), 0, 1); break
      default: startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    const sales = await prisma.sale.findMany({
      where: { tenantId: user.tenantId, createdAt: { gte: startDate } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    })

    // Group by date
    const salesByDate: Record<string, { count: number; total: number; profit: number }> = {}
    sales.forEach(s => {
      const dateKey = s.createdAt.toISOString().split('T')[0]
      if (!salesByDate[dateKey]) salesByDate[dateKey] = { count: 0, total: 0, profit: 0 }
      salesByDate[dateKey].count++
      salesByDate[dateKey].total += s.total
      salesByDate[dateKey].profit += s.profit
    })

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0)
    const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0)
    const totalTransactions = sales.length

    return NextResponse.json({
      success: true,
      data: {
        sales: Object.entries(salesByDate).map(([date, data]) => ({ date, ...data })),
        summary: {
          totalSales,
          totalProfit,
          totalTransactions,
          avgOrderValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
