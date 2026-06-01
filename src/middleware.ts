import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const routeRoles: Record<string, string[]> = {
  '/pos': ['TENANT_ADMIN', 'MANAGER', 'CASHIER'],
  '/products': ['TENANT_ADMIN', 'MANAGER', 'CASHIER'],
  '/inventory': ['TENANT_ADMIN', 'MANAGER'],
  '/customers': ['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'],
  '/sales': ['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'],
  '/reports': ['TENANT_ADMIN', 'MANAGER', 'ACCOUNTANT'],
  '/settings': ['TENANT_ADMIN'],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    if (path.startsWith('/admin') && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    const matchedRoute = Object.keys(routeRoles).find(r => path === r || path.startsWith(r + '/'))
    if (matchedRoute && token.role !== 'SUPER_ADMIN' && !routeRoles[matchedRoute].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/pos/:path*', '/products/:path*', '/inventory/:path*', '/customers/:path*', '/sales/:path*', '/reports/:path*', '/admin/:path*', '/settings/:path*'],
}
