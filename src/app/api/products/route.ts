import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId: user.tenantId },
        include: { category: true, stock: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where: { tenantId: user.tenantId } }),
    ])

    return NextResponse.json({ success: true, data: products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode || null,
        description: body.description || null,
        price: parseFloat(body.price) || 0,
        costPrice: parseFloat(body.costPrice) || 0,
        taxRate: parseFloat(body.taxRate) || 0,
        unit: body.unit || 'pcs',
        lowStockQty: parseInt(body.lowStockQty) || 5,
        trackStock: body.trackStock !== false,
        tenantId: user.tenantId,
        categoryId: body.categoryId || null,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Product with this SKU already exists' }, { status: 400 })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const body = await req.json()
    const product = await prisma.product.updateMany({
      where: { id, tenantId: user.tenantId },
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode,
        description: body.description,
        price: parseFloat(body.price) || 0,
        costPrice: parseFloat(body.costPrice) || 0,
        taxRate: parseFloat(body.taxRate) || 0,
        unit: body.unit,
        lowStockQty: parseInt(body.lowStockQty) || 5,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    await prisma.product.deleteMany({ where: { id, tenantId: user.tenantId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
