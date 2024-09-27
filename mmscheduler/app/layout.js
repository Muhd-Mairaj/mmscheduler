import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { Fredoka } from 'next/font/google'

const fredoka = Fredoka({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fredoka'
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fredoka.className}>
      <body className={fredoka.className}>{children}</body>
    </html>
  )
}