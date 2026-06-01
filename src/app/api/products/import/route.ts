import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import * as XLSX from 'xlsx'

function normalizeKey(key: string): string {
  const map: Record<string, string> = {
    'product name': 'name', 'productname': 'name', 'item name': 'name',
    'sku': 'sku', 'code': 'sku', 'item code': 'sku',
    'price': 'price', 'selling price': 'price', 'unit price': 'price', 'rate': 'price',
    'cost': 'costPrice', 'cost price': 'costPrice', 'costprice': 'costPrice', 'purchase price': 'costPrice',
    'barcode': 'barcode', 'bar code': 'barcode', 'upc': 'barcode', 'ean': 'barcode',
    'description': 'description', 'desc': 'description',
    'tax': 'taxRate', 'tax rate': 'taxRate', 'taxrate': 'taxRate', 'vat': 'taxRate',
    'unit': 'unit', 'uom': 'unit',
    'low stock': 'lowStockQty', 'lowstock': 'lowStockQty', 'low stock qty': 'lowStockQty', 'min stock': 'lowStockQty',
  }
  const cleaned = key.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ')
  return map[cleaned] || cleaned
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!sheet) {
      return NextResponse.json({ success: false, error: 'Excel file is empty' }, { status: 400 })
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)
    if (rawRows.length === 0) {
      return NextResponse.json({ success: false, error: 'No data rows found' }, { status: 400 })
    }

    const headers = Object.keys(rawRows[0])
    const colMap: Record<string, string> = {}
    for (const h of headers) {
      const mapped = normalizeKey(h)
      if (mapped) colMap[h] = mapped
    }

    const errors: { row: number; message: string }[] = []
    const toCreate: any[] = []

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i]
      const row: Record<string, any> = {}
      for (const [origKey, mappedKey] of Object.entries(colMap)) {
        row[mappedKey] = raw[origKey]
      }

      const rowNum = i + 2

      if (!row.name || String(row.name).trim() === '') {
        errors.push({ row: rowNum, message: 'Product name is required' })
        continue
      }

      const price = parseFloat(row.price)
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, message: `Invalid price: "${row.price}"` })
        continue
      }

      let sku = row.sku ? String(row.sku).trim() : ''
      if (!sku) {
        sku = `SKU-${Date.now()}-${i}`
      }

      const costPrice = parseFloat(row.costPrice) || 0
      const taxRate = parseFloat(row.taxRate) || 0
      const lowStockQty = parseInt(row.lowStockQty) || 5
      const unit = ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack'].includes(String(row.unit).toLowerCase())
        ? String(row.unit).toLowerCase() : 'pcs'

      toCreate.push({
        name: String(row.name).trim(),
        sku,
        barcode: row.barcode ? String(row.barcode).trim() : null,
        description: row.description ? String(row.description).trim() : null,
        price,
        costPrice,
        taxRate,
        unit,
        lowStockQty,
        trackStock: true,
        tenantId: user.tenantId,
      })
    }

    let created = 0
    let skipped = 0
    const skuErrors: { row: number; message: string; sku: string }[] = []

    for (const data of toCreate) {
      try {
        await prisma.product.create({ data })
        created++
      } catch (err: any) {
        skipped++
        if (err.code === 'P2002') {
          errors.push({ row: 0, message: `Duplicate SKU: "${data.sku}"` })
        } else {
          errors.push({ row: 0, message: `Failed to create "${data.name}": ${err.message}` })
        }
      }
    }

    if (created > 0) {
      const existing = await prisma.product.count({ where: { tenantId: user.tenantId } })
      await prisma.auditLog.create({
        data: {
          action: 'PRODUCTS_IMPORTED',
          entity: 'Product',
          details: `Imported ${created} products from Excel. Total: ${existing}`,
          userId: user.id,
          tenantId: user.tenantId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: { created, skipped: skipped + errors.length, errors, totalRows: rawRows.length },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
