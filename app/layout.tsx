import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = { title: 'Foliom' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        {/* Anti-flash: koyu mod tercihini sayfa yüklenmeden önce uygula */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;0,900;1,400&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
