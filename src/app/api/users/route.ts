import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const where: any = {}
    if (user.tenantId) where.tenantId = user.tenantId

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, locationId: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN')) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const hashedPassword = await bcrypt.hash(body.password || 'password123', 10)

    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || 'CASHIER',
        tenantId: user.tenantId || body.tenantId,
        locationId: body.locationId || null,
        phone: body.phone || null,
      },
    })

    return NextResponse.json({ success: true, data: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } })
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 })
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
