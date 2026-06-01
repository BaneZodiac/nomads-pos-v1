import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Test DB connection
    await prisma.$connect()
    
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({ select: { email: true, name: true, role: true } })
    const tenantCount = await prisma.tenant.count()
    
    return NextResponse.json({
      success: true,
      dbConnected: true,
      stats: { users: userCount, tenants: tenantCount },
      users,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextUrl: !!process.env.NEXTAUTH_URL,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      dbConnected: false,
      error: error.message,
      stack: error.stack?.substring(0, 500),
    })
  } finally {
    await prisma.$disconnect()
  }
}
