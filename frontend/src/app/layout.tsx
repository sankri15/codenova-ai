import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'CodeNova – AI GitHub Codebase Intelligence',
  description:
    'CodeNova uses advanced AI to analyze, explain, and improve any GitHub repository in seconds. Chat with your codebase, debug errors, generate READMEs, and get actionable improvement suggestions.',
  keywords: ['AI', 'GitHub', 'codebase', 'analysis', 'developer tools', 'CodeNova', 'RAG', 'code review'],
  authors: [{ name: 'Sanjana Pal' }],
  openGraph: {
    title: 'CodeNova – AI GitHub Codebase Intelligence',
    description: 'Understand any GitHub codebase in seconds — powered by CodeNova AI',
    type: 'website',
  },
  themeColor: '#05050F',
}

import CustomCursor from '@/components/CustomCursor'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased text-white`}
        style={{ background: '#05050F' }}>
        <CustomCursor />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0D0D1A',
              color: '#fff',
              border: '1px solid rgba(255,107,53,0.25)',
              borderRadius: '14px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              padding: '12px 16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            },
            success: {
              iconTheme: { primary: '#00FF87', secondary: '#0D0D1A' },
            },
            error: {
              iconTheme: { primary: '#FF6B35', secondary: '#0D0D1A' },
            },
          }}
        />
      </body>
    </html>
  )
}
