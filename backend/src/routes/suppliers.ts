import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = { tenantId };
    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { phone: { contains: search } }];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ]);

    res.json({ success: true, data: suppliers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: req.user!.tenantId!, isActive: true }, orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    const supplier = await prisma.supplier.create({ data: { name, email, phone, address, notes, tenantId: req.user!.tenantId! } });
    res.status(201).json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: supplier });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.supplier.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Purchase orders
router.get('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { tenantId: req.user!.tenantId! },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: pos });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { supplierId, items, notes, dueDate } = req.body;
    const totalAmount = items.reduce((sum: number, i: any) => sum + i.quantity * i.unitCost, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId, supplierId, orderNo: `PO-${Date.now().toString(36).toUpperCase()}`, totalAmount, notes, dueDate: dueDate ? new Date(dueDate) : null,
        items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost, total: i.quantity * i.unitCost })) },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    res.status(201).json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/purchase-orders/:id', async (req: Request, res: Response) => {
  try {
    const po = await prisma.purchaseOrder.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: po });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
