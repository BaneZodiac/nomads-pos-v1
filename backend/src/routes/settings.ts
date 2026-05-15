import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireTenantAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.tenantSettings.findUnique({ where: { tenantId: req.user!.tenantId! } });
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.tenantSettings.upsert({
      where: { tenantId: req.user!.tenantId! },
      update: req.body,
      create: { tenantId: req.user!.tenantId!, ...req.body },
    });
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Locations
router.get('/locations', async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({ where: { tenantId: req.user!.tenantId! } });
    res.json({ success: true, data: locations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/locations', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { name, address, phone } = req.body;
    const location = await prisma.location.create({ data: { name, address, phone, tenantId: req.user!.tenantId! } });
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/locations/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const location = await prisma.location.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: location });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/locations/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.location.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Location deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Shifts
router.get('/shifts', async (req: Request, res: Response) => {
  try {
    const where: any = { tenantId: req.user!.tenantId! };
    if (req.query.userId) where.userId = req.query.userId as string;
    if (req.query.status) where.status = req.query.status as string;

    const shifts = await prisma.shift.findMany({
      where,
      include: { user: true, location: true, sales: true },
      orderBy: { openingTime: 'desc' },
    });
    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/shifts/open', async (req: Request, res: Response) => {
  try {
    const { locationId, openingCash } = req.body;
    const existing = await prisma.shift.findFirst({
      where: { userId: req.user!.id, status: 'open' },
    });
    if (existing) {
      res.status(400).json({ success: false, error: 'You already have an open shift' });
      return;
    }

    const shift = await prisma.shift.create({
      data: { tenantId: req.user!.tenantId!, userId: req.user!.id, locationId, openingCash: openingCash || 0 },
    });
    res.status(201).json({ success: true, data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/shifts/:id/close', async (req: Request, res: Response) => {
  try {
    const { closingCash, note } = req.body;
    const sales = await prisma.sale.aggregate({
      where: { shiftId: String(req.params.id) },
      _sum: { grandTotal: true },
    });

    const shift = await prisma.shift.update({
      where: { id: String(req.params.id) },
      data: {
        status: 'closed',
        closingTime: new Date(),
        closingCash: closingCash || 0,
        totalSales: sales._sum?.grandTotal || 0,
        note,
      },
    });
    res.json({ success: true, data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.user!.isSuperAdmin) {
      // Super admin sees all
    } else {
      where.tenantId = req.user!.tenantId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: limit, include: { user: true }, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
