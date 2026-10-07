import { Work_Sans, Xanh_Mono } from 'next/font/google'
import Nav from '@/components/Nav'
import './globals.css'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const xanhMono = Xanh_Mono({
  subsets: ['latin'],
  variable: '--font-xanh',
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata = {
  title: 'Watchlist',
  description: 'Your personal film library',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${workSans.variable} ${xanhMono.variable} h-full`}>
      <body className="min-h-full bg-neutral-950 text-neutral-200 antialiased">
        <Nav />
        <main className="px-8 py-12 max-w-screen-2xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
