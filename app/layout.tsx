import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  title: {
    default: 'Diligent Learning Hub',
    template: '%s | Diligent Learning Hub',
  },
  description:
    'Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@48,400,0,0"
        />
      </head>
      <body className="bg-white font-sans text-diligent-gray-5 antialiased">
        {children}
      </body>
    </html>
  )
}
