import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/context/ToastContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taskflow.nexium.studio'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'TaskFlow | Intelligent Task Manager',
  description: 'Modern task manager application with authentication, filters, and real-time synchronization.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'TaskFlow | Intelligent Task Manager',
    description: 'Modern task manager application with authentication, filters, and real-time synchronization.',
    url: siteUrl,
    siteName: 'TaskFlow',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TaskFlow - Intelligent Task Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow | Intelligent Task Manager',
    description: 'Modern task manager application with authentication, filters, and real-time synchronization.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white"
        suppressHydrationWarning
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
