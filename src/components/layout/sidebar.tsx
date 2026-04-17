'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CopyPlus, Folder, Home, Palette, Settings, Zap, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { name: 'Dashboard',    href: '/dashboard', icon: Home     },
  { name: 'Criar',        href: '/create',    icon: CopyPlus },
  { name: 'Projetos',     href: '/projects',  icon: Folder   },
  { name: 'Brand Kit',    href: '/brand-kit', icon: Palette  },
  { name: 'Configuração', href: '/settings',  icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col',
        'w-[64px] hover:w-[228px]',
        'transition-[width] duration-250 ease-in-out',
        'border-r border-border bg-card h-screen sticky top-0 z-50 overflow-hidden',
        'shadow-[2px_0_16px_hsl(var(--primary)/0.06)]',
        'group',
      )}
    >
      {/* Logo — clicável, redireciona para a home */}
      <Link
        href="/"
        className="flex h-16 items-center px-[18px] w-[228px] shrink-0 border-b border-border hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(258 55% 56%), hsl(27 90% 57%))',
              boxShadow: '0 4px 12px hsl(258 55% 56% / 0.40)',
            }}
          >
            <Zap className="h-4 w-4 text-white fill-white" />
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <p className="font-bold text-sm text-foreground tracking-tight leading-none">ContentAI</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">Studio</p>
          </div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-4 w-[228px]">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon     = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={item.name}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 w-full',
                    'transition-all duration-150 text-sm',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={{ background: 'linear-gradient(180deg, hsl(258 55% 56%), hsl(27 90% 57%))' }}
                    />
                  )}
                  <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-primary' : '')} />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {item.name}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User dropdown */}
      <div className="mt-auto p-3 w-[228px] border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-secondary transition-colors outline-none overflow-hidden cursor-pointer text-left">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={undefined} />
              <AvatarFallback
                className="text-xs text-primary font-semibold"
                style={{ background: 'linear-gradient(135deg, hsl(258 55% 56% / 0.15), hsl(27 90% 57% / 0.10))' }}
              >
                <User className="h-3.5 w-3.5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-0">
              <span className="text-xs font-semibold leading-none truncate w-[148px] text-foreground">
                {user?.email?.split('@')[0] || 'ContentAI Studio'}
              </span>
              <span className="text-[11px] text-muted-foreground truncate w-[148px] mt-1">
                {user?.email || 'Plano Interno'}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right" className="w-52 mb-2 ml-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:bg-destructive/10 cursor-pointer text-sm"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
