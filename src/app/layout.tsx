import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Syne } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Sidebar }         from '@/components/layout/sidebar'
import { BottomNav }       from '@/components/layout/bottom-nav'
import { TooltipProvider }  from '@/components/ui/tooltip'
import { Toaster }          from 'sonner'
import { ThemeProvider }    from '@/components/providers/theme-provider'
import { NProgressBar }     from '@/components/providers/nprogress-bar'
import { PageTransition }   from '@/components/motion/page-transition'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | ContentAI Studio',
    default:  'ContentAI Studio',
  },
  description: 'Ferramenta interna de criação de conteúdo com IA',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={cn('antialiased', jakarta.variable, syne.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen w-full bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="theme"
        >
          <TooltipProvider>
            <NProgressBar />
            <Sidebar />
            <div className="flex flex-col flex-1 pb-16 md:pb-0 h-screen overflow-hidden">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
            <BottomNav />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
