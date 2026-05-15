import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';
import { logAudit } from '../middleware/audit';
import { hashPassword, slugify } from '../utils/helpers';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search ? { name: { contains: search } } : {};
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { include: { plan: true } },
          _count: { select: { users: true, products: true, sales: true } },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      success: true,
      data: tenants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, currency, timezone } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Tenant name required' });
      return;
    }

    const slug = slugify(name) + '-' + Date.now().toString(36);
    const tenant = await prisma.tenant.create({
      data: { name, slug, email, phone, address, currency, timezone },
    });

    await prisma.tenantSettings.create({ data: { tenantId: tenant.id } });

    await logAudit({ userId: req.user!.id, action: 'TENANT_CREATE', entity: 'Tenant', entityId: tenant.id, details: `Created tenant: ${name}` });

    res.status(201).json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: String(req.params.id) },
      include: {
        subscription: { include: { plan: true } },
        settings: true,
        _count: { select: { users: true, products: true, sales: true, customers: true, suppliers: true, locations: true } },
      },
    });
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant not found' });
      return;
    }
    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, currency, timezone, dateFormat, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address;
    if (currency !== undefined) data.currency = currency;
    if (timezone !== undefined) data.timezone = timezone;
    if (dateFormat !== undefined) data.dateFormat = dateFormat;
    if (isActive !== undefined) data.isActive = isActive;

    const tenant = await prisma.tenant.update({ where: { id: String(req.params.id) }, data });

    await logAudit({ userId: req.user!.id, action: 'TENANT_UPDATE', entity: 'Tenant', entityId: tenant.id });

    res.json({ success: true, data: tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.tenant.delete({ where: { id: String(req.params.id) } });
    await logAudit({ userId: req.user!.id, action: 'TENANT_DELETE', entity: 'Tenant', entityId: String(req.params.id) });
    res.json({ success: true, message: 'Tenant deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
