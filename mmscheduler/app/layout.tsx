import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { Fredoka } from 'next/font/google'
import { ThemeProvider } from './context/ThemeContext'

const fredoka = Fredoka({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fredoka'
})

// Inline script to prevent FOUC (Flash of Unstyled Content)
// This runs before React hydrates, setting the theme attribute immediately
const themeInitScript = `
  (function() {
    try {
      var stored = localStorage.getItem('mmscheduler-theme');
      if (stored === 'dark' || stored === 'light') {
        document.documentElement.setAttribute('data-theme', stored);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Safe: only suppresses warnings on <html>, not children. Needed for anti-FOUC theme script.
    <html lang="en" className={fredoka.className} suppressHydrationWarning>
      <head>
        {/* Safe: themeInitScript is a hardcoded constant, no user input. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }}/>
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}