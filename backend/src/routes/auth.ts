import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateToken, comparePassword } from '../utils/helpers';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, tenant: true, location: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    if (user.tenant && !user.tenant.isActive) {
      res.status(403).json({ success: false, error: 'Tenant account is deactivated' });
      return;
    }

    if (user.tenant) {
      const sub = await prisma.subscription.findUnique({ where: { tenantId: user.tenantId! }, include: { plan: true } });
      if (sub && sub.status === 'expired') {
        res.status(403).json({ success: false, error: 'Subscription expired' });
        return;
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = generateToken({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin,
      roleId: user.roleId,
      roleSlug: user.role?.slug,
      locationId: user.locationId,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          isSuperAdmin: user.isSuperAdmin,
          tenantId: user.tenantId,
          tenantName: user.tenant?.name,
          role: user.role,
          location: user.location,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { role: true, tenant: true, location: true },
    });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        isSuperAdmin: user.isSuperAdmin,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name,
        tenantSlug: user.tenant?.slug,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
