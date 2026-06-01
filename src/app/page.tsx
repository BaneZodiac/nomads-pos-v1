'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { PageLoading } from '@/components/ui/Loading'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <PageLoading />
  if (!session) redirect('/login')

  redirect('/dashboard')
}
