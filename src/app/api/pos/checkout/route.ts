import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { invoiceNo, items, subtotal, taxTotal, discountTotal, total, paidAmount, changeAmount, paymentMethod, customerId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 })
    }

    // Calculate profit
    const profit = items.reduce((sum: number, item: any) => sum + ((item.price - item.costPrice) * item.quantity), 0)

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        invoiceNo,
        subtotal,
        taxTotal,
        discountTotal,
        total,
        profit,
        paidAmount: paidAmount || total,
        changeAmount: changeAmount || 0,
        paymentMethod,
        status: 'completed',
        tenantId: user.tenantId,
        userId: user.id,
        customerId: customerId || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            costPrice: item.costPrice || 0,
            tax: item.tax || 0,
            discount: item.discount || 0,
            total: item.total,
          })),
        },
        payments: {
          create: {
            amount: paidAmount || total,
            method: paymentMethod || 'cash',
          },
        },
      },
      include: { items: true, customer: true },
    })

    // Update stock
    for (const item of items) {
      if (user.locationId) {
        const stock = await prisma.stock.findFirst({
          where: { productId: item.productId, locationId: user.locationId },
        })
        if (stock) {
          await prisma.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }
    }

    // Update customer loyalty points and total spent
    if (customerId) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          totalSpent: { increment: total },
          loyaltyPts: { increment: Math.floor(total / 10) },
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SALE_COMPLETED',
        entity: 'Sale',
        entityId: sale.id,
        details: `Invoice ${invoiceNo} - ${formatCurrency(total)}`,
        userId: user.id,
        tenantId: user.tenantId,
      },
    })

    return NextResponse.json({ success: true, data: sale })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
