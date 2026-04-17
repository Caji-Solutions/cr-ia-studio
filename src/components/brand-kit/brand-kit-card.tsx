'use client'

import { BrandKit } from '@/lib/api/brand-kits'
import { MoreVertical, Check, Trash2, Pencil, Star, Type } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BrandKitCardProps {
  kit: BrandKit
  onEdit: (kit: BrandKit) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function BrandKitCard({ kit, onEdit, onDelete, onSetDefault }: BrandKitCardProps) {
  const primary   = kit.primary_color   || '#1a1a2e'
  const secondary = kit.secondary_color || '#16213e'
  const accent    = kit.accent_color    || '#0f3460'

  return (
    <div
      className={cn(
        'group relative rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer',
        'bg-card hover:-translate-y-0.5',
        kit.is_default
          ? 'border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_24px_hsl(var(--primary)/0.10)]'
          : 'border-border/60 hover:border-border hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)]',
      )}
    >
      {/* ── Gradient header ───────────────────────────── */}
      <div
        className="relative h-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 55%, ${accent} 100%)`,
        }}
      >
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />

        {/* Decorative circle blobs */}
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-30 blur-2xl"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-20 blur-xl"
          style={{ backgroundColor: primary }}
        />

        {/* Logo or initials */}
        <div className="absolute top-3.5 left-3.5">
          {kit.logo_url ? (
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 overflow-hidden p-1 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kit.logo_url} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg border border-white/25 text-white"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
            >
              {kit.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Default badge */}
        {kit.is_default && (
          <div className="absolute top-3.5 right-12 flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/25 shadow-sm"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
            <Star className="h-2.5 w-2.5 text-yellow-300 fill-yellow-300" />
            <span className="text-[10px] font-semibold text-white tracking-wide">Padrão</span>
          </div>
        )}

        {/* Color swatches row */}
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5">
          {[primary, secondary, accent].map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border-[1.5px] border-white/50 shadow"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* ── Menu button ───────────────────────────────── */}
      <div className="absolute top-3 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'inline-flex items-center justify-center h-7 w-7 rounded-full outline-none transition-all',
              'text-white opacity-0 group-hover:opacity-100',
              'hover:bg-white/20',
            )}
            style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)' }}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(kit)} className="cursor-pointer">
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Editar
            </DropdownMenuItem>
            {!kit.is_default && (
              <DropdownMenuItem onClick={() => onSetDefault(kit.id)} className="cursor-pointer">
                <Check className="h-3.5 w-3.5 mr-2" />
                Definir como Padrão
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(kit.id)}
              className="text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Info ──────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-3">
        <h3 className="font-semibold text-[15px] leading-tight truncate">{kit.name}</h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <Type className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{kit.font_title} · {kit.font_body}</span>
        </div>
      </div>

      {/* ── Hover edit CTA ────────────────────────────── */}
      <div className="px-4 pb-4 -mt-0.5">
        <button
          onClick={() => onEdit(kit)}
          className={cn(
            'w-full h-8 rounded-xl text-xs font-semibold border transition-all duration-200',
            'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0',
            'border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          Editar Brand Kit
        </button>
      </div>
    </div>
  )
}
