import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireSuperAdmin);

router.get('/', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, billingCycle, trialDays, maxUsers, maxLocations, maxProducts, maxCustomers, maxInvoices, maxSuppliers, features } = req.body;
    if (!name || price === undefined) {
      res.status(400).json({ success: false, error: 'Name and price required' });
      return;
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const plan = await prisma.subscriptionPlan.create({
      data: { name, slug, description, price, billingCycle: billingCycle || 'monthly', trialDays: trialDays || 14, maxUsers: maxUsers || 5, maxLocations: maxLocations || 1, maxProducts: maxProducts || 500, maxCustomers: maxCustomers || 200, maxInvoices: maxInvoices || 500, maxSuppliers: maxSuppliers || 20, features },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.subscriptionPlan.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.subscriptionPlan.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subscription management
router.post('/assign', async (req: Request, res: Response) => {
  try {
    const { tenantId, planId, trialDays } = req.body;
    if (!tenantId || !planId) {
      res.status(400).json({ success: false, error: 'Tenant ID and Plan ID required' });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      res.status(404).json({ success: false, error: 'Plan not found' });
      return;
    }

    const trial = trialDays ?? plan.trialDays;
    const now = new Date();
    const trialEndDate = trial > 0 ? new Date(now.getTime() + trial * 86400000) : null;
    const endDate = trialEndDate || new Date(now.getTime() + 30 * 86400000);

    const subscription = await prisma.subscription.upsert({
      where: { tenantId },
      update: { planId, status: 'active', startDate: now, endDate, trialEndDate, autoRenew: true },
      create: { tenantId, planId, status: 'active', startDate: now, endDate, trialEndDate, autoRenew: true },
    });

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const subs = await prisma.subscription.findMany({
      include: { tenant: true, plan: true },
      orderBy: { endDate: 'asc' },
    });
    res.json({ success: true, data: subs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    const sub = await prisma.subscription.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: sub });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
