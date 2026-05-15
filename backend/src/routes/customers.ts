import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import { checkTenantQuota } from '../middleware/audit';

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

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    res.json({ success: true, data: customers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { tenantId: req.user!.tenantId!, isActive: true }, orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { name, email, phone, address, notes } = req.body;

    const quota = await checkTenantQuota(tenantId, 'customers');
    if (!quota.allowed) {
      res.status(403).json({ success: false, error: `Customer limit reached (${quota.current}/${quota.max})` });
      return;
    }

    const customer = await prisma.customer.create({ data: { name, email, phone, address, notes, tenantId } });
    res.status(201).json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
