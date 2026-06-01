import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const tenants = await prisma.tenant.findMany({
      include: { plan: true, _count: { select: { users: true, products: true, sales: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: tenants })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    const tenant = await prisma.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        email: body.email || null,
        phone: body.phone || null,
        planId: body.planId || null,
        maxUsers: parseInt(body.maxUsers) || 5,
        maxProducts: parseInt(body.maxProducts) || 1000,
      },
    })

    // Create default admin user for tenant
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        name: `${body.name} Admin`,
        email: body.email || `admin@${body.slug}.com`,
        password: hashedPassword,
        role: 'TENANT_ADMIN',
        tenantId: tenant.id,
      },
    })

    // Create default location
    await prisma.location.create({
      data: { name: 'Main Store', tenantId: tenant.id },
    })

    return NextResponse.json({ success: true, data: tenant })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Tenant with this slug already exists' }, { status: 400 })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'SUPER_ADMIN') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })

    const body = await req.json()
    await prisma.tenant.update({ where: { id }, data: body })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
