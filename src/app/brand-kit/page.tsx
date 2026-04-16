'use client'

import { useEffect, useState, useCallback } from 'react'
import { BrandKit, getBrandKits, createBrandKit, updateBrandKit, deleteBrandKit, setDefaultBrandKit, uploadLogo } from '@/lib/api/brand-kits'
import { BrandKitCard } from '@/components/brand-kit/brand-kit-card'
import { BrandKitDialog } from '@/components/brand-kit/brand-kit-dialog'
import { Plus, Loader2, Sparkles, Palette } from 'lucide-react'
import { toast } from 'sonner'

export default function BrandKitPage() {
  const [brandKits,    setBrandKits]    = useState<BrandKit[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingKit,   setEditingKit]   = useState<BrandKit | null>(null)

  const loadBrandKits = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getBrandKits()
      setBrandKits(data)
    } catch {
      toast.error('Erro ao carregar Brand Kits')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadBrandKits() }, [loadBrandKits])

  const handleCreateOrEditClick = (kit?: BrandKit) => {
    setEditingKit(kit ?? null)
    setIsDialogOpen(true)
  }

  const handleSave = async (data: Partial<BrandKit>, logoFile?: File) => {
    let finalLogoUrl = data.logo_url

    if (logoFile) {
      toast.info('Fazendo upload da logo...')
      finalLogoUrl = await uploadLogo(logoFile)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { ...data, logo_url: finalLogoUrl }

    if (editingKit) {
      await updateBrandKit(editingKit.id, payload)
      toast.success('Brand Kit atualizado com sucesso!')
    } else {
      if (brandKits.length === 0) payload.is_default = true
      await createBrandKit(payload)
      toast.success('Brand Kit criado com sucesso!')
    }

    loadBrandKits()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este Brand Kit?')) return
    try {
      await deleteBrandKit(id)
      toast.success('Brand Kit excluído.')
      loadBrandKits()
    } catch {
      toast.error('Erro ao excluir Brand Kit')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultBrandKit(id)
      toast.success('Brand Kit padrão atualizado.')
      loadBrandKits()
    } catch {
      toast.error('Erro ao atualizar padrão')
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto w-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10 animate-section animate-section-1">
        <div className="relative">
          {/* Decorative glow */}
          <div
            className="absolute -top-4 -left-4 w-52 h-24 rounded-full pointer-events-none opacity-[0.14] blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(330 65% 58%), hsl(258 55% 56%))' }}
          />
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary opacity-70" />
            <span className="text-xs font-medium text-primary/70 uppercase tracking-widest">Identidade Visual</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Brand Kits</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Identidades visuais para suas gerações de conteúdo com IA.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : brandKits.length === 0 ? (

        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-border bg-card/50">
          <div
            className="size-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'linear-gradient(135deg, hsl(330 65% 58% / 0.12), hsl(258 55% 56% / 0.08))' }}
          >
            <Palette className="h-7 w-7 text-primary/60" />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2 font-display">Nenhum Brand Kit ainda</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto leading-relaxed">
            Crie seu primeiro Brand Kit para gerar conteúdo com a identidade visual da sua marca.
          </p>
          <button
            onClick={() => handleCreateOrEditClick()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', boxShadow: '0 4px 20px #ec489940' }}
          >
            <Plus className="h-4 w-4" />
            Criar primeiro Brand Kit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20 animate-section animate-section-2">
          {brandKits.map((kit) => (
            <BrandKitCard
              key={kit.id}
              kit={kit}
              onEdit={handleCreateOrEditClick}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <BrandKitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={editingKit}
        onSave={handleSave}
      />
    </div>
  )
}
