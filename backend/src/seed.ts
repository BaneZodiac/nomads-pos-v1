import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';
import { config } from './config';

async function main() {
  console.log('Seeding database...');

  // Create super admin role
  const superAdminRole = await prisma.role.upsert({
    where: { id: 'super-admin-role' },
    update: {},
    create: {
      id: 'super-admin-role',
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Full system access',
      isSystem: true,
      permissions: {
        create: [
          { action: 'all', scope: 'all' },
        ],
      },
    },
  });

  // Create tenant admin role
  await prisma.role.upsert({
    where: { id: 'tenant-admin-role' },
    update: {},
    create: {
      id: 'tenant-admin-role',
      name: 'Tenant Admin',
      slug: 'tenant_admin',
      description: 'Full business access',
      isSystem: true,
      permissions: {
        create: [
          { action: 'manage_users', scope: 'all' },
          { action: 'manage_products', scope: 'all' },
          { action: 'manage_inventory', scope: 'all' },
          { action: 'manage_sales', scope: 'all' },
          { action: 'manage_settings', scope: 'all' },
          { action: 'view_reports', scope: 'all' },
        ],
      },
    },
  });

  // Create manager role
  await prisma.role.upsert({
    where: { id: 'manager-role' },
    update: {},
    create: {
      id: 'manager-role',
      name: 'Manager',
      slug: 'manager',
      description: 'Branch manager access',
      isSystem: true,
      permissions: {
        create: [
          { action: 'manage_sales', scope: 'branch' },
          { action: 'approve_discounts', scope: 'branch' },
          { action: 'approve_returns', scope: 'branch' },
          { action: 'manage_shifts', scope: 'branch' },
          { action: 'view_reports', scope: 'branch' },
        ],
      },
    },
  });

  // Create cashier role
  await prisma.role.upsert({
    where: { id: 'cashier-role' },
    update: {},
    create: {
      id: 'cashier-role',
      name: 'Cashier',
      slug: 'cashier',
      description: 'POS operations',
      isSystem: true,
      permissions: {
        create: [
          { action: 'create_sale', scope: 'own' },
          { action: 'process_return', scope: 'own' },
          { action: 'manage_shift', scope: 'own' },
        ],
      },
    },
  });

  // Create accountant role
  await prisma.role.upsert({
    where: { id: 'accountant-role' },
    update: {},
    create: {
      id: 'accountant-role',
      name: 'Accountant',
      slug: 'accountant',
      description: 'Financial access',
      isSystem: true,
      permissions: {
        create: [
          { action: 'view_finance', scope: 'all' },
          { action: 'view_reports', scope: 'all' },
          { action: 'export_data', scope: 'all' },
        ],
      },
    },
  });

  // Create read-only role
  await prisma.role.upsert({
    where: { id: 'readonly-role' },
    update: {},
    create: {
      id: 'readonly-role',
      name: 'Read Only',
      slug: 'readonly',
      description: 'View-only access',
      isSystem: true,
      permissions: {
        create: [
          { action: 'view_sales', scope: 'all' },
          { action: 'view_products', scope: 'all' },
          { action: 'view_reports', scope: 'all' },
        ],
      },
    },
  });

  // Create super admin user
  const hashedPassword = await bcrypt.hash('admin123', config.saltRounds);
  await prisma.user.upsert({
    where: { email: 'admin@nomadpos.com' },
    update: {},
    create: {
      email: 'admin@nomadpos.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      isSuperAdmin: true,
      roleId: superAdminRole.id,
    },
  });

  // Create subscription plans
  const plans = [
    { name: 'Starter', slug: 'starter', price: 29, maxUsers: 2, maxLocations: 1, maxProducts: 100, maxCustomers: 50, maxInvoices: 200, maxSuppliers: 10, features: 'Basic POS, Inventory, Customer management' },
    { name: 'Growth', slug: 'growth', price: 59, maxUsers: 5, maxLocations: 2, maxProducts: 500, maxCustomers: 200, maxInvoices: 1000, maxSuppliers: 20, features: 'Advanced POS, Reports, Multi-location, Supplier management' },
    { name: 'Business', slug: 'business', price: 99, maxUsers: 15, maxLocations: 5, maxProducts: 2000, maxCustomers: 1000, maxInvoices: 5000, maxSuppliers: 50, features: 'Full features, API access, Priority support, Advanced analytics' },
    { name: 'Enterprise', slug: 'enterprise', price: 199, maxUsers: 999, maxLocations: 50, maxProducts: 99999, maxCustomers: 99999, maxInvoices: 99999, maxSuppliers: 9999, features: 'Everything unlimited, White-label, Dedicated support, Custom integrations' },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: { ...plan, billingCycle: 'monthly', trialDays: 14, isActive: true },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Super Admin login: admin@nomadpos.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
