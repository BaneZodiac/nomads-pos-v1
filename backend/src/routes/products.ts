import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireTenantAdmin } from '../middleware/auth';
import { slugify, generateSku } from '../utils/helpers';
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
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, include: { category: true, stocks: true, variants: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user!.tenantId!, isActive: true },
      include: { category: true, stocks: true, variants: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId!;
    const { name, categoryId, description, costPrice, sellingPrice, wholesalePrice, taxRate, unit, minStock, barcode, hasVariants, variants } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Product name required' });
      return;
    }

    const quota = await checkTenantQuota(tenantId, 'products');
    if (!quota.allowed) {
      res.status(403).json({ success: false, error: `Product limit reached (${quota.current}/${quota.max})` });
      return;
    }

    const sku = generateSku(name);
    const product = await prisma.product.create({
      data: {
        tenantId, name, slug: slugify(name), sku, barcode, categoryId, description,
        costPrice: costPrice || 0, sellingPrice: sellingPrice || 0, wholesalePrice,
        taxRate: taxRate || 0, unit: unit || 'pc', minStock: minStock || 0, hasVariants: hasVariants || false,
        stocks: { create: { quantity: 0 } },
        ...(variants?.length ? {
          variants: { create: variants.map((v: any) => ({ name: v.name, sku: v.sku || generateSku(v.name), barcode: v.barcode, price: v.price, costPrice: v.costPrice, stock: v.stock || 0, attributes: v.attributes })) },
        } : {}),
      },
      include: { category: true, stocks: true, variants: true },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, categoryId, description, costPrice, sellingPrice, wholesalePrice, taxRate, unit, minStock, barcode, isActive } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (description !== undefined) data.description = description;
    if (costPrice !== undefined) data.costPrice = costPrice;
    if (sellingPrice !== undefined) data.sellingPrice = sellingPrice;
    if (wholesalePrice !== undefined) data.wholesalePrice = wholesalePrice;
    if (taxRate !== undefined) data.taxRate = taxRate;
    if (unit !== undefined) data.unit = unit;
    if (minStock !== undefined) data.minStock = minStock;
    if (barcode !== undefined) data.barcode = barcode;
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({ where: { id: String(req.params.id) }, data, include: { stocks: true } });
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.user!.tenantId! },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;
    const category = await prisma.category.create({
      data: { name, slug: slugify(name), parentId, tenantId: req.user!.tenantId! },
    });
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await prisma.category.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json({ success: true, data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stock movements
router.get('/stock-movements', async (req: Request, res: Response) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      where: { product: { tenantId: req.user!.tenantId! } },
      include: { product: true, location: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stock-adjust', async (req: Request, res: Response) => {
  try {
    const { productId, type, quantity, note, locationId } = req.body;
    if (!productId || !type || !quantity) {
      res.status(400).json({ success: false, error: 'productId, type, quantity required' });
      return;
    }

    const stock = await prisma.stock.upsert({
      where: { productId },
      update: quantity > 0 && (type === 'in' || type === 'adjustment')
        ? { quantity: { increment: quantity } }
        : { quantity: { decrement: quantity } },
      create: { productId, quantity: type === 'in' ? quantity : -quantity },
    });

    await prisma.stockMovement.create({
      data: { productId, type, quantity, note, locationId, userId: req.user!.id },
    });

    res.json({ success: true, data: stock });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Low stock alerts
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.user!.tenantId!, isActive: true },
      include: { stocks: true },
    });

    const lowStock = products.filter(p => {
      const stock = p.stocks?.[0]?.quantity || 0;
      return stock <= p.minStock;
    });

    res.json({ success: true, data: lowStock });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
