import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import type { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface User {
    role: UserRole
    tenantId?: string | null
    locationId?: string | null
    tenantSlug?: string | null
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      tenantId?: string | null
      locationId?: string | null
      tenantSlug?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tenantId?: string | null
    locationId?: string | null
    tenantSlug?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { tenant: true },
          })

          if (!user || !user.isActive) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          if (user.tenant && (!user.tenant.isActive || (user.tenant.expiresAt && new Date() > user.tenant.expiresAt))) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            tenantId: user.tenantId,
            locationId: user.locationId,
            tenantSlug: user.tenant?.slug || null,
            image: user.avatar,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.locationId = user.locationId
        token.tenantSlug = user.tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name || '',
        email: token.email || '',
        role: token.role,
        tenantId: token.tenantId,
        locationId: token.locationId,
        tenantSlug: token.tenantSlug,
        image: token.picture,
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'nomads-pos-secret-key-change-in-production',
}

export async function getCurrentUser() {
  const { getServerSession } = await import('next-auth')
  const session = await getServerSession(authOptions)
  return session?.user
}

export function canAccess(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const hierarchy: Record<string, number> = {
    SUPER_ADMIN: 100,
    TENANT_ADMIN: 80,
    MANAGER: 60,
    ACCOUNTANT: 40,
    CASHIER: 20,
    SUPPORT: 10,
  }
  return requiredRoles.some(r => hierarchy[userRole] >= hierarchy[r])
}
