import prisma from '@/lib/prisma'

export async function checkTenantLimit(
  tenantId: string,
  entity: 'users' | 'products' | 'locations',
  extra = 1
): Promise<{ allowed: boolean; message?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { maxUsers: true, maxProducts: true, maxLocations: true },
  })
  if (!tenant) return { allowed: false, message: 'Tenant not found' }

  let limit: number
  let count: number

  if (entity === 'users') {
    limit = tenant.maxUsers
    count = await prisma.user.count({ where: { tenantId } })
  } else if (entity === 'products') {
    limit = tenant.maxProducts
    count = await prisma.product.count({ where: { tenantId } })
  } else {
    limit = tenant.maxLocations
    count = await prisma.location.count({ where: { tenantId } })
  }

  if (limit === -1) return { allowed: true }

  if (count + extra > limit) {
    return {
      allowed: false,
      message: `${entity.charAt(0).toUpperCase() + entity.slice(1)} limit reached (${limit}). Upgrade your plan to add more.`,
    }
  }

  return { allowed: true }
}
