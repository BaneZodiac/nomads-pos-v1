'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { PageLoading } from '@/components/ui/Loading'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') return <PageLoading />
  if (!session) redirect('/login')

  const isSuperAdmin = session.user?.role === 'SUPER_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className={`transition-all duration-300 ${isSuperAdmin ? '' : 'lg:ml-64'} p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8`}>
        {children}
      </main>
    </div>
  )
}
