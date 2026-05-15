import { Response } from 'express';
import prisma from '../utils/prisma';

export const logAudit = async (
  params: {
    tenantId?: string;
    userId?: string;
    action: string;
    entity?: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }
): Promise<void> => {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const checkTenantQuota = async (tenantId: string, resource: string): Promise<{ allowed: boolean; current: number; max: number }> => {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription || subscription.status !== 'active') {
    return { allowed: false, current: 0, max: 0 };
  }

  const plan = subscription.plan;
  let current = 0;
  let max = 0;

  switch (resource) {
    case 'users': {
      current = await prisma.user.count({ where: { tenantId, isSuperAdmin: false } });
      max = plan.maxUsers;
      break;
    }
    case 'products': {
      current = await prisma.product.count({ where: { tenantId } });
      max = plan.maxProducts;
      break;
    }
    case 'customers': {
      current = await prisma.customer.count({ where: { tenantId } });
      max = plan.maxCustomers;
      break;
    }
    case 'locations': {
      current = await prisma.location.count({ where: { tenantId } });
      max = plan.maxLocations;
      break;
    }
  }

  return { allowed: current < max, current, max };
};
