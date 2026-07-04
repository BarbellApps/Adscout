import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'AdScout — Ad Creative Intelligence',
  description: 'AI-powered ad creative research, competitor tracking, and generation platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#0B0B12', color: '#EDEDF5' }}>
        {children}
      </body>
    </html>
  )
}
