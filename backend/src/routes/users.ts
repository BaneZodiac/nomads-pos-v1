import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireTenantAdmin, requireRole } from '../middleware/auth';
import { hashPassword } from '../utils/helpers';
import { checkTenantQuota } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isSuperAdmin: false };
    if (req.query.search) {
      where.OR = [
        { firstName: { contains: req.query.search as string } },
        { lastName: { contains: req.query.search as string } },
        { email: { contains: req.query.search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, include: { role: true, location: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { email, password, firstName, lastName, phone, roleId, locationId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ success: false, error: 'Required fields missing' });
      return;
    }

    const quota = await checkTenantQuota(tenantId, 'users');
    if (!quota.allowed) {
      res.status(403).json({ success: false, error: `User limit reached (${quota.current}/${quota.max})` });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already in use' });
      return;
    }

    const user = await prisma.user.create({
      data: { email, password: await hashPassword(password), firstName, lastName, phone, tenantId, roleId, locationId },
      include: { role: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, roleId, locationId, isActive } = req.body;
    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (phone !== undefined) data.phone = phone;
    if (roleId !== undefined) data.roleId = roleId;
    if (locationId !== undefined) data.locationId = locationId;
    if (isActive !== undefined) data.isActive = isActive;

    const user = await prisma.user.update({ where: { id: String(req.params.id) }, data, include: { role: true } });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Roles
router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      where: { OR: [{ tenantId: req.user!.tenantId }, { isSystem: true }] },
      include: { permissions: true },
    });
    res.json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/roles', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const role = await prisma.role.create({
      data: {
        name, slug, description, tenantId: req.user!.tenantId,
        permissions: { create: (permissions || []).map((p: any) => ({ action: p.action, scope: p.scope || 'all' })) },
      },
      include: { permissions: true },
    });
    res.status(201).json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/roles/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, permissions } = req.body;
    await prisma.permission.deleteMany({ where: { roleId: String(req.params.id) } });
    const role = await prisma.role.update({
      where: { id: String(req.params.id) },
      data: {
        name, description,
        permissions: { create: (permissions || []).map((p: any) => ({ action: p.action, scope: p.scope || 'all' })) },
      },
      include: { permissions: true },
    });
    res.json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
