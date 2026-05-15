import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';
import { config } from './config';

export async function runSeed() {
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@nomadpos.com' } });
  if (existingAdmin) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  const superAdminRole = await prisma.role.upsert({
    where: { id: 'super-admin-role' },
    update: {},
    create: {
      id: 'super-admin-role', name: 'Super Admin', slug: 'super_admin',
      description: 'Full system access', isSystem: true,
      permissions: { create: [{ action: 'all', scope: 'all' }] },
    },
  });

  const roles = [
    { id: 'tenant-admin-role', name: 'Tenant Admin', slug: 'tenant_admin', description: 'Full business access', permissions: ['manage_users', 'manage_products', 'manage_inventory', 'manage_sales', 'manage_settings', 'view_reports'] },
    { id: 'manager-role', name: 'Manager', slug: 'manager', description: 'Branch manager', permissions: ['manage_sales', 'approve_discounts', 'approve_returns', 'manage_shifts', 'view_reports'] },
    { id: 'cashier-role', name: 'Cashier', slug: 'cashier', description: 'POS operations', permissions: ['create_sale', 'process_return', 'manage_shift'] },
    { id: 'accountant-role', name: 'Accountant', slug: 'accountant', description: 'Financial access', permissions: ['view_finance', 'view_reports', 'export_data'] },
    { id: 'readonly-role', name: 'Read Only', slug: 'readonly', description: 'View-only', permissions: ['view_sales', 'view_products', 'view_reports'] },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id, name: role.name, slug: role.slug, description: role.description, isSystem: true,
        permissions: { create: role.permissions.map(p => ({ action: p, scope: 'all' })) },
      },
    });
  }

  const plans = [
    { name: 'Starter', slug: 'starter', price: 29, maxUsers: 2, maxLocations: 1, maxProducts: 100, maxCustomers: 50, maxInvoices: 200, maxSuppliers: 10, features: 'Basic POS, Inventory, Customer management' },
    { name: 'Growth', slug: 'growth', price: 59, maxUsers: 5, maxLocations: 2, maxProducts: 500, maxCustomers: 200, maxInvoices: 1000, maxSuppliers: 20, features: 'Advanced POS, Reports, Multi-location' },
    { name: 'Business', slug: 'business', price: 99, maxUsers: 15, maxLocations: 5, maxProducts: 2000, maxCustomers: 1000, maxInvoices: 5000, maxSuppliers: 50, features: 'Full features, API access, Priority support' },
    { name: 'Enterprise', slug: 'enterprise', price: 199, maxUsers: 999, maxLocations: 50, maxProducts: 99999, maxCustomers: 99999, maxInvoices: 99999, maxSuppliers: 9999, features: 'Unlimited, White-label, Dedicated support' },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({ where: { slug: plan.slug }, update: {}, create: { ...plan, billingCycle: 'monthly', trialDays: 14, isActive: true } });
  }

  const hashedPassword = await bcrypt.hash('admin123', config.saltRounds);
  await prisma.user.upsert({
    where: { email: 'admin@nomadpos.com' },
    update: {},
    create: { email: 'admin@nomadpos.com', password: hashedPassword, firstName: 'Super', lastName: 'Admin', isSuperAdmin: true, roleId: superAdminRole.id },
  });

  console.log('Seed completed: admin@nomadpos.com / admin123');
}
