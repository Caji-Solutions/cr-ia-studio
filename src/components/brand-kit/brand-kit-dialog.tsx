'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BrandKit } from '@/lib/api/brand-kits'
import { LivePreview } from './live-preview'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const FONTS = [
  'Inter', 'Montserrat', 'Poppins', 'Playfair Display', 
  'Roboto', 'Open Sans', 'Lato', 'Oswald', 'Raleway'
]

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  primary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  secondary_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  accent_color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Cor inválida'),
  font_title: z.string().min(1, 'Fonte do título é obrigatória'),
  font_body: z.string().min(1, 'Fonte do texto é obrigatória'),
  tone_of_voice: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BrandKitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: BrandKit | null
  onSave: (data: Partial<BrandKit>, logoFile?: File) => Promise<void>
}

export function BrandKitDialog({ open, onOpenChange, initialData, onSave }: BrandKitDialogProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      primary_color: '#000000',
      secondary_color: '#666666',
      accent_color: '#3b82f6',
      font_title: 'Inter',
      font_body: 'Inter',
      tone_of_voice: '',
    }
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          primary_color: initialData.primary_color || '#000000',
          secondary_color: initialData.secondary_color || '#666666',
          accent_color: initialData.accent_color || '#3b82f6',
          font_title: initialData.font_title || 'Inter',
          font_body: initialData.font_body || 'Inter',
          tone_of_voice: initialData.tone_of_voice || '',
        })
        setLogoPreview(initialData.logo_url || null)
      } else {
        reset({
          name: '',
          primary_color: '#000000',
          secondary_color: '#666666',
          accent_color: '#3b82f6',
          font_title: 'Inter',
          font_body: 'Inter',
          tone_of_voice: '',
        })
        setLogoPreview(null)
      }
      setLogoFile(null)
    }
  }, [open, initialData, reset])

  const formValues = watch()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
      <DialogContent className="max-w-5xl h-[90vh] md:h-[800px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{initialData ? 'Editar Brand Kit' : 'Criar Novo Brand Kit'}</DialogTitle>
          <DialogDescription>
            Defina as cores, tipografia e tom de voz que a IA utilizará para gerar conteúdo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Form Side */}
          <div className="w-full md:w-1/2 overflow-y-auto p-6 border-r">
            <form id="brand-kit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Brand Kit</label>
                <Input {...register('name')} placeholder="Ex: Minha Empresa Principal" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primária</label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" {...register('primary_color')} className="w-10 h-10 p-1 rounded cursor-pointer" />
                  </div>
                  {errors.primary_color && <p className="text-xs text-destructive">{errors.primary_color.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secundária</label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" {...register('secondary_color')} className="w-10 h-10 p-1 rounded cursor-pointer" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destaque</label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" {...register('accent_color')} className="w-10 h-10 p-1 rounded cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fonte Título</label>
                  <Controller
                    control={control}
                    name="font_title"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fonte Texto</label>
                  <Controller
                    control={control}
                    name="font_body"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Logo da Marca (Opcional)</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain bg-white" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tom de Voz da Marca</label>
                <Textarea 
                  {...register('tone_of_voice')} 
                  placeholder="Ex: Profissional, acolhedor, objetivo, sempre utiliza termos técnicos. Evitar emojis."
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Brand Kit
                </Button>
              </div>
            </form>
          </div>

          {/* Preview Side */}
          <div className="w-full md:w-1/2 bg-muted/20 p-6 flex flex-col">
            <h3 className="text-sm font-medium mb-4 text-center text-muted-foreground uppercase opacity-70">Preview ao Vivo</h3>
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
