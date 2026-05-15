import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todaySales, totalProducts, totalCustomers, totalSales,
      recentSales, topProducts, lowStock, salesByWeek,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: today } },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.product.count({ where: { tenantId, isActive: true } }),
      prisma.customer.count({ where: { tenantId, isActive: true } }),
      prisma.sale.aggregate({
        where: { tenantId },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where: { tenantId },
        include: { customer: true, user: true, items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.product.findMany({
        where: { tenantId, isActive: true },
        include: { stocks: true },
      }),
      prisma.sale.groupBy({
        by: ['createdAt'],
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        _sum: { grandTotal: true },
      }),
    ]);

    const lowStockItems = lowStock.filter(p => (p.stocks?.[0]?.quantity || 0) <= p.minStock);

    // Get top product details
    const topProductIds = topProducts.map(t => t.productId);
    const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } } });

    res.json({
      success: true,
      data: {
        todaySales: todaySales._sum.grandTotal || 0,
        todayTransactions: todaySales._count,
        totalProducts,
        totalCustomers,
        totalRevenue: totalSales._sum.grandTotal || 0,
        totalTransactions: totalSales._count,
        recentSales,
        topProducts: topProducts.map(t => ({
          ...t,
          product: topProductDetails.find(p => p.id === t.productId),
        })),
        lowStockCount: lowStockItems.length,
        lowStockItems,
        weeklySales: salesByWeek,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { startDate, endDate, groupBy } = req.query;

    const where: any = { tenantId };
    if (startDate) where.createdAt = { gte: new Date(startDate as string) };
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { customer: true, user: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.discountTotal, 0);
    const totalTax = sales.reduce((sum, s) => sum + s.taxTotal, 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    sales.forEach(s => {
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + s.grandTotal;
    });

    // By user
    const byUser: Record<string, { sales: number; revenue: number }> = {};
    sales.forEach(s => {
      const key = s.userId;
      if (!byUser[key]) byUser[key] = { sales: 0, revenue: 0 };
      byUser[key].sales += 1;
      byUser[key].revenue += s.grandTotal;
    });

    res.json({
      success: true,
      data: { totalSales, totalRevenue, totalDiscount, totalTax, avgOrderValue, paymentMethods, byUser, sales },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/profit', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const sales = await prisma.sale.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
    });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const sale of sales) {
      totalRevenue += sale.grandTotal;
      for (const item of sale.items) {
        totalCost += item.quantity * (item.product.costPrice || 0);
      }
    }
    totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    res.json({ success: true, data: { totalRevenue, totalCost, totalProfit, profitMargin } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: { stocks: true, category: true },
    });

    const totalStockValue = products.reduce((sum, p) => sum + ((p.stocks?.[0]?.quantity || 0) * p.costPrice), 0);
    const totalRetailValue = products.reduce((sum, p) => sum + ((p.stocks?.[0]?.quantity || 0) * p.sellingPrice), 0);
    const lowStock = products.filter(p => (p.stocks?.[0]?.quantity || 0) <= p.minStock);

    res.json({ success: true, data: { totalProducts: products.length, totalStockValue, totalRetailValue, lowStockCount: lowStock.length, lowStockItems: lowStock } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/best-sellers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { period } = req.query;
    const dateFilter: any = {};
    if (period === '7d') dateFilter.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
    else if (period === '30d') dateFilter.createdAt = { gte: new Date(Date.now() - 30 * 86400000) };

    const saleItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      where: { sale: { tenantId, ...dateFilter } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    });

    const productIds = saleItems.map(s => s.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, include: { category: true } });

    res.json({
      success: true,
      data: saleItems.map(s => ({
        product: products.find(p => p.id === s.productId),
        totalSold: s._sum.quantity,
        totalRevenue: s._sum.total,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
