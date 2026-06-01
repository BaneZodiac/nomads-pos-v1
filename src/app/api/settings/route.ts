import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (type === 'audit') {
      if (user.role !== 'SUPER_ADMIN' && !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

      const where: any = {}
      if (user.tenantId) where.tenantId = user.tenantId

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: { user: { select: { name: true, email: true } } },
          take: limit,
          skip: (page - 1) * limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ])

      return NextResponse.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
    }

    // System settings
    if (user.role === 'SUPER_ADMIN') {
      const settings = await prisma.systemSetting.findMany()
      return NextResponse.json({ success: true, data: settings })
    }

    // Tenant settings
    if (!user.tenantId) return NextResponse.json({ success: false, error: 'No tenant' }, { status: 403 })
    const settings = await prisma.tenantSetting.findMany({ where: { tenantId: user.tenantId } })
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const setting = await prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId: user.tenantId, key: body.key } },
      update: { value: body.value },
      create: { tenantId: user.tenantId, key: body.key, value: body.value },
    })

    return NextResponse.json({ success: true, data: setting })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
