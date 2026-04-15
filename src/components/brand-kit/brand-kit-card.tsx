import { BrandKit } from '@/lib/api/brand-kits'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Check, Trash, Edit, Star } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface BrandKitCardProps {
  kit: BrandKit
  onEdit: (kit: BrandKit) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
}

export function BrandKitCard({ kit, onEdit, onDelete, onSetDefault }: BrandKitCardProps) {
  return (
    <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md ${kit.is_default ? 'ring-2 ring-primary border-primary' : 'border-border/50'}`}>
      {kit.is_default && (
        <Badge className="absolute top-3 left-3 z-10 shadow-sm" variant="default">
          <Star className="h-3 w-3 mr-1 fill-current" />
          Padrão
        </Badge>
      )}

      <div className="absolute top-2 right-2 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-accent-foreground outline-none">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(kit)} className="cursor-pointer">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {!kit.is_default && (
              <DropdownMenuItem onClick={() => onSetDefault(kit.id)} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                Definir Padrão
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(kit.id)} 
              className="text-destructive focus:bg-destructive/10 cursor-pointer"
            >
              <Trash className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-24 w-full flex">
        <div className="flex-1 transition-transform group-hover:scale-105 origin-left" style={{ backgroundColor: kit.primary_color || '#cccccc' }} />
        <div className="flex-1 transition-transform group-hover:scale-105" style={{ backgroundColor: kit.secondary_color || '#999999' }} />
        <div className="flex-1 transition-transform group-hover:scale-105 origin-right" style={{ backgroundColor: kit.accent_color || '#666666' }} />
      </div>

      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-semibold text-lg">{kit.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {kit.font_title} / {kit.font_body}
          </p>
        </div>
        {kit.logo_url && (
          <div className="h-10 w-10 shrink-0 rounded-full bg-muted border overflow-hidden p-1">
            <img src={kit.logo_url} alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
