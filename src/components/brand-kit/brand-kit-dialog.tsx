'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BrandKit } from '@/lib/api/brand-kits'
import { LivePreview } from './live-preview'
import { Loader2, Upload, Palette, Type, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const FONTS = [
  'Inter', 'Montserrat', 'Poppins', 'Playfair Display',
  'Roboto', 'Open Sans', 'Lato', 'Oswald', 'Raleway',
]

const formSchema = z.object({
  name:            z.string().min(1, 'Nome é obrigatório').max(50),
  primary_color:   z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  secondary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  accent_color:    z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  font_title:      z.string().min(1, 'Fonte do título é obrigatória'),
  font_body:       z.string().min(1, 'Fonte do texto é obrigatória'),
  tone_of_voice:   z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BrandKitDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  initialData?: BrandKit | null
  onSave:       (data: Partial<BrandKit>, logoFile?: File) => Promise<void>
}

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="size-6 rounded-md flex items-center justify-center bg-muted">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Color swatch picker ────────────────────────────────────────────────────────
function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative flex items-center gap-2">
        {/* Color preview + picker */}
        <label className="relative cursor-pointer shrink-0">
          <div
            className="h-9 w-9 rounded-lg border-2 border-white/80 shadow-md ring-1 ring-black/10 transition-transform hover:scale-105"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
        {/* Hex text input */}
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (/^#([0-9A-F]{3}){1,2}$/i.test(v)) onChange(v)
            else if (v.startsWith('#') && v.length <= 7) onChange(v)
          }}
          disabled={disabled}
          maxLength={7}
          className={cn(
            'flex-1 h-9 rounded-lg border border-border/70 bg-background/60 px-2.5',
            'text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
            'disabled:opacity-50',
          )}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

export function BrandKitDialog({ open, onOpenChange, initialData, onSave }: BrandKitDialogProps) {
  const [logoFile,     setLogoFile]     = useState<File | null>(null)
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name:            '',
      primary_color:   '#1a1a2e',
      secondary_color: '#4a4a6a',
      accent_color:    '#7c3aed',
      font_title:      'Inter',
      font_body:       'Inter',
      tone_of_voice:   '',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name:            initialData.name,
          primary_color:   initialData.primary_color   || '#1a1a2e',
          secondary_color: initialData.secondary_color || '#4a4a6a',
          accent_color:    initialData.accent_color    || '#7c3aed',
          font_title:      initialData.font_title      || 'Inter',
          font_body:       initialData.font_body       || 'Inter',
          tone_of_voice:   initialData.tone_of_voice   || '',
        })
        setLogoPreview(initialData.logo_url || null)
      } else {
        reset({
          name:            '',
          primary_color:   '#1a1a2e',
          secondary_color: '#4a4a6a',
          accent_color:    '#7c3aed',
          font_title:      'Inter',
          font_body:       'Inter',
          tone_of_voice:   '',
        })
        setLogoPreview(null)
      }
      setLogoFile(null)
    }
  }, [open, initialData, reset])

  const formValues = watch()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo deve ter menos de 2MB')
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      await onSave({ ...data }, logoFile || undefined)
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Erro ao salvar Brand Kit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] md:h-[820px] flex flex-col p-0 gap-0 overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <DialogHeader className="relative px-6 py-5 border-b overflow-hidden shrink-0">
          <div
            className="absolute -top-6 -left-6 w-48 h-24 rounded-full pointer-events-none opacity-15 blur-3xl"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
          />
          <div className="relative">
            <DialogTitle className="text-lg font-bold tracking-tight">
              {initialData ? 'Editar Brand Kit' : 'Criar Novo Brand Kit'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Defina cores, tipografia e tom de voz para geração de conteúdo com IA.
            </p>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

          {/* ── Form side ──────────────────────────────────────────────── */}
          <div className="w-full md:w-1/2 overflow-y-auto p-6 border-r">
            <form id="brand-kit-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nome do Brand Kit
                </label>
                <Input
                  {...register('name')}
                  placeholder="Ex: Minha Empresa Principal"
                  className="border-border/70 bg-background/60 focus:border-primary/50"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Cores */}
              <div>
                <SectionLabel icon={Palette} label="Paleta de Cores" />
                <div className="grid grid-cols-3 gap-3">
                  <Controller
                    control={control}
                    name="primary_color"
                    render={({ field }) => (
                      <ColorField
                        label="Primária"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="secondary_color"
                    render={({ field }) => (
                      <ColorField
                        label="Secundária"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="accent_color"
                    render={({ field }) => (
                      <ColorField
                        label="Destaque"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Tipografia */}
              <div>
                <SectionLabel icon={Type} label="Tipografia" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Fonte Título</label>
                    <Controller
                      control={control}
                      name="font_title"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="border-border/70 bg-background/60">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Fonte Texto</label>
                    <Controller
                      control={control}
                      name="font_body"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="border-border/70 bg-background/60">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {FONTS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div>
                <SectionLabel icon={ImageIcon} label="Logo da Marca" />
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border/70 bg-muted/40 shrink-0 overflow-hidden flex items-center justify-center group-hover:border-primary/40 transition-colors">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain bg-white"
                      />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {logoPreview ? 'Trocar logo' : 'Enviar logo'}
                    </span>
                    <span className="text-xs text-muted-foreground">PNG, JPG ou SVG · máx. 2 MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </label>
              </div>

              {/* Tom de voz */}
              <div>
                <SectionLabel icon={MessageSquare} label="Tom de Voz" />
                <Textarea
                  {...register('tone_of_voice')}
                  placeholder="Ex: Profissional, acolhedor, objetivo. Sempre usa termos técnicos. Evita emojis."
                  className="min-h-[90px] resize-none border-border/70 bg-background/60 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="border-border/70"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    border: 'none',
                    boxShadow: '0 4px 16px #8b5cf640',
                  }}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Salvando...' : 'Salvar Brand Kit'}
                </Button>
              </div>
            </form>
          </div>

          {/* ── Preview side ───────────────────────────────────────────── */}
          <div className="w-full md:w-1/2 bg-muted/20 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 px-2">
                Preview ao Vivo
              </span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <LivePreview
              primaryColor={formValues.primary_color}
              secondaryColor={formValues.secondary_color}
              accentColor={formValues.accent_color}
              fontTitle={formValues.font_title}
              fontBody={formValues.font_body}
              logoUrl={logoPreview}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
