'use client'

import { usePathname } from 'next/navigation'
import { Sidebar }  from './sidebar'
import { BottomNav } from './bottom-nav'

/**
 * ConditionalShell — exibe o chrome do app (sidebar + bottomnav) apenas
 * em rotas da aplicação, ocultando-o na landing page pública.
 */
export function ConditionalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Landing page: sem chrome
  if (pathname === '/') {
    return <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">{children}</div>
  }

  // Páginas do app: chrome completo
  return (
    <>
      <Sidebar />
      <div
        className="relative flex flex-col flex-1 pb-16 md:pb-0 h-screen overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
      <BottomNav />
    </>
  )
}
