import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const include = searchParams.get('include')

    const stock = await prisma.stock.findMany({
      where: { product: { tenantId: user.tenantId } },
      include: include === 'product' ? { product: true } : undefined,
    })

    return NextResponse.json({ success: true, data: stock })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
