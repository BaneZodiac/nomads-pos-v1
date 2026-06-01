import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const headers = ['Product Name', 'SKU', 'Price', 'Cost Price', 'Barcode', 'Description', 'Tax Rate', 'Unit', 'Low Stock Qty']
  const sample = ['Sample Product', 'SKU-001', '9.99', '4.50', '123456789', 'Product description', '5', 'pcs', '10']
  const ws = XLSX.utils.aoa_to_sheet([headers, sample])
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="products-template.xlsx"',
    },
  })
}
