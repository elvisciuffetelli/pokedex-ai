import { ThemeToggle } from '@/components/ThemeToggle'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pokédex AI',
  description: 'Un\'app Pokémon con ricerca in linguaggio naturale e descrizioni AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className={inter.className}>
        <ThemeToggle />
        {children}
    </body>
    </html>
  )
}