'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#1C1917', color: '#fff', borderRadius: '12px' },
          success: { iconTheme: { primary: '#F97316', secondary: '#fff' } },
        }}
      />
    </SessionProvider>
  )
}
