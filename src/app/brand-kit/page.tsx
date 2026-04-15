'use client'

import { useEffect, useState, useCallback } from 'react'
import { BrandKit, getBrandKits, createBrandKit, updateBrandKit, deleteBrandKit, setDefaultBrandKit, uploadLogo } from '@/lib/api/brand-kits'
import { BrandKitCard } from '@/components/brand-kit/brand-kit-card'
import { BrandKitDialog } from '@/components/brand-kit/brand-kit-dialog'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brand Kits</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Identidades visuais para suas gerações de conteúdo.
          </p>
        </div>
        <Button onClick={() => handleCreateOrEditClick()} size="sm" className="w-full md:w-auto">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Novo Brand Kit
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : brandKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-lg">
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center mb-4">
            <Plus className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-medium text-foreground mb-1">Nenhum Brand Kit ainda</h2>
          <p className="text-muted-foreground text-xs mb-6 max-w-xs mx-auto">
            Crie seu primeiro Brand Kit para gerar conteúdo com a identidade visual da sua marca.
          </p>
          <Button onClick={() => handleCreateOrEditClick()} size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Criar primeiro Brand Kit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
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
