'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users, UserCircle,
  FileBarChart, Settings, Store, ChevronLeft, ChevronRight,
  LogOut, Menu, X, Receipt, Truck, Shield, BarChart3
} from 'lucide-react'
import { useState } from 'react'

const tenantLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT', 'SUPPORT'] },
  { href: '/pos', label: 'POS Billing', icon: ShoppingCart, roles: ['TENANT_ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/products', label: 'Products', icon: Package, roles: ['TENANT_ADMIN', 'MANAGER', 'CASHIER'] },
  { href: '/inventory', label: 'Inventory', icon: Boxes, roles: ['TENANT_ADMIN', 'MANAGER'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'] },
  { href: '/sales', label: 'Sales', icon: Receipt, roles: ['TENANT_ADMIN', 'MANAGER', 'CASHIER', 'ACCOUNTANT'] },
  { href: '/reports', label: 'Reports', icon: FileBarChart, roles: ['TENANT_ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { href: '/users', label: 'Team', icon: UserCircle, roles: ['TENANT_ADMIN'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['TENANT_ADMIN'] },
]

const superAdminLinks = [
  { href: '/admin/dashboard', label: 'Platform', icon: BarChart3, roles: ['SUPER_ADMIN'] },
  { href: '/admin/tenants', label: 'Tenants', icon: Store, roles: ['SUPER_ADMIN'] },
  { href: '/admin/plans', label: 'Plans', icon: Shield, roles: ['SUPER_ADMIN'] },
  { href: '/admin/users', label: 'Users', icon: UserCircle, roles: ['SUPER_ADMIN'] },
  { href: '/admin/settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  { href: '/admin/audit', label: 'Audit Logs', icon: FileBarChart, roles: ['SUPER_ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = session?.user?.role || 'CASHIER'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const links = isSuperAdmin ? superAdminLinks : tenantLinks.filter(l => l.roles.includes(role))

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="no-print fixed top-4 left-4 z-40 lg:hidden btn btn-ghost p-2"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside className={cn(
        "no-print fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-gray-100 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          {!collapsed && (
            <Link href={isSuperAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-stone-900">Nomads POS</span>
            </Link>
          )}
          {collapsed && (
            <Link href={isSuperAdmin ? '/admin/dashboard' : '/dashboard'} className="mx-auto">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            </Link>
          )}
          <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false) }} className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "sidebar-link",
                isActive(link.href) ? "sidebar-link-active" : "sidebar-link-inactive",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className={cn("sidebar-link sidebar-link-inactive", collapsed && "justify-center px-2")}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
          {!collapsed && session?.user && (
            <div className="mt-2 px-3 py-2 text-xs text-gray-500 whitespace-nowrap overflow-visible">
              {session.user.name} · {session.user.role.replace('_', ' ')}
            </div>
          )}
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}
    </>
  )
}
