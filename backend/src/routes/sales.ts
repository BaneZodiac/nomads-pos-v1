import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { generateInvoiceNo, calculateTotals } from '../utils/helpers';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const { search, status, startDate, endDate } = req.query;

    const where: any = { tenantId };
    if (search) where.invoiceNo = { contains: search as string };
    if (status) where.status = status as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where, skip, take: limit, include: { customer: true, user: true, items: { include: { product: true } }, payments: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ success: true, data: sales, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single sale
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await prisma.sale.findFirst({
      where: { id: String(req.params.id), tenantId: req.user!.tenantId! },
      include: { customer: true, user: true, items: { include: { product: true } }, payments: true, returns: { include: { items: true } } },
    });
    if (!sale) { res.status(404).json({ success: false, error: 'Sale not found' }); return; }
    res.json({ success: true, data: sale });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create POS sale
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { customerId, items, payments, discountTotal, notes, shiftId } = req.body;

    if (!items?.length) {
      res.status(400).json({ success: false, error: 'At least one item required' });
      return;
    }

    const { subtotal, taxTotal, grandTotal } = calculateTotals(items);
    const paidAmount = payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || grandTotal;
    const changeAmount = Math.max(0, paidAmount - grandTotal);

    const invoiceNo = generateInvoiceNo();
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });

    const sale = await prisma.sale.create({
      data: {
        tenantId, invoiceNo, customerId, userId: req.user!.id, subtotal,
        discountTotal: discountTotal || 0, taxTotal, grandTotal, paidAmount, changeAmount,
        status: paidAmount >= grandTotal ? 'completed' : 'partial', shiftId, notes,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId, variantId: item.variantId,
            quantity: item.quantity, unitPrice: item.unitPrice,
            discount: item.discount || 0, tax: item.tax || 0,
            total: item.quantity * item.unitPrice - (item.discount || 0) + (item.tax || 0),
          })),
        },
        payments: payments?.length ? {
          create: payments.map((p: any) => ({ method: p.method, amount: p.amount, reference: p.reference })),
        } : { create: { method: 'cash', amount: grandTotal } },
      },
      include: { customer: true, items: { include: { product: true } }, payments: true },
    });

    // Update stock
    for (const item of items) {
      await prisma.stock.upsert({
        where: { productId: item.productId },
        update: { quantity: { decrement: item.quantity } },
        create: { productId: item.productId, quantity: -item.quantity },
      });
      await prisma.stockMovement.create({
        data: { productId: item.productId, type: 'sale', quantity: -item.quantity, reference: invoiceNo, userId: req.user!.id },
      });
    }

    // Update customer total spent
    if (customerId) {
      await prisma.customer.update({ where: { id: customerId }, data: { totalSpent: { increment: grandTotal } } });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Return
router.post('/:id/return', async (req: Request, res: Response) => {
  try {
    const { reason, items } = req.body;
    const sale = await prisma.sale.findFirst({ where: { id: String(req.params.id), tenantId: req.user!.tenantId! } });
    if (!sale) { res.status(404).json({ success: false, error: 'Sale not found' }); return; }

    const totalAmount = items.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0);
    const returnRecord = await prisma.return.create({
      data: {
        saleId: sale.id, reason, totalAmount,
        items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
      },
      include: { items: true },
    });

    for (const item of items) {
      await prisma.stock.upsert({
        where: { productId: item.productId },
        update: { quantity: { increment: item.quantity } },
        create: { productId: item.productId, quantity: item.quantity },
      });
    }

    res.status(201).json({ success: true, data: returnRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
