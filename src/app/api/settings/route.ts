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

    // Tenant settings + tenant data
    if (!user.tenantId) return NextResponse.json({ success: false, error: 'No tenant' }, { status: 403 })
    const [settings, tenant] = await Promise.all([
      prisma.tenantSetting.findMany({ where: { tenantId: user.tenantId } }),
      prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true, email: true, phone: true, address: true, brandColor: true } }),
    ])
    return NextResponse.json({ success: true, data: { settings, tenant } })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()

    // Bulk save: { settings: [{ key, value }] }
    if (body.settings) {
      for (const s of body.settings) {
        await prisma.tenantSetting.upsert({
          where: { tenantId_key: { tenantId: user.tenantId, key: s.key } },
          update: { value: String(s.value) },
          create: { tenantId: user.tenantId, key: s.key, value: String(s.value) },
        })
      }
    }

    // Update tenant fields: { tenant: { name, email, phone, address, brandColor } }
    if (body.tenant) {
      await prisma.tenant.update({
        where: { id: user.tenantId },
        data: body.tenant,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
