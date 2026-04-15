import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react'

interface LivePreviewProps {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  fontTitle?: string
  fontBody?: string
  logoUrl?: string | null
}

const getGoogleFontUrl = (fontName: string) => {
  if (!fontName) return null
  const formattedName = fontName.replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;600;700&display=swap`
}

export function LivePreview({
  primaryColor = '#000000',
  secondaryColor = '#666666',
  accentColor = '#blue-500',
  fontTitle = 'Inter',
  fontBody = 'Inter',
  logoUrl
}: LivePreviewProps) {
  // Dynamically load selected fonts via injected stylesheet
  useEffect(() => {
    const urls = [getGoogleFontUrl(fontTitle), getGoogleFontUrl(fontBody)].filter(Boolean) as string[]
    // Dedup
    const uniqueUrls = Array.from(new Set(urls))

    const links = uniqueUrls.map(url => {
      const link = document.createElement('link')
      link.href = url
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      return link
    })

    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      })
    }
  }, [fontTitle, fontBody])

  return (
    <div className="w-full flex-1 flex items-center justify-center bg-muted/30 rounded-xl p-4 md:p-8 min-h-[400px]">
      <Card 
        className="w-full max-w-[320px] overflow-hidden shadow-2xl transition-all duration-300 border-none"
        style={{
          fontFamily: fontBody ? `"${fontBody}", sans-serif` : 'inherit',
          backgroundColor: '#ffffff'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50 bg-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div 
                  className="h-full w-full"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold" style={{ color: primaryColor }}>@suamarca</span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Content Area */}
        <div 
          className="aspect-square w-full p-6 flex flex-col justify-center gap-4 relative overflow-hidden"
          style={{ backgroundColor: secondaryColor }}
        >
          {/* Decorative shapes to test colors */}
          <div 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: accentColor }}
          />
          <div 
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ backgroundColor: primaryColor }}
          />

          <h2 
            className="text-2xl font-bold leading-tight relative z-10"
            style={{ 
              fontFamily: fontTitle ? `"${fontTitle}", sans-serif` : 'inherit',
              color: '#ffffff'
            }}
          >
            Sua mensagem principal com muito impacto
          </h2>
          <p className="text-sm opacity-90 text-white relative z-10 font-medium">
            O corpo de texto será renderizado aqui com a fonte que você selecionar logo ao lado.
          </p>

          <div 
            className="mt-4 px-4 py-2 rounded-full text-xs font-bold text-center self-start relative z-10 shadow-lg"
            style={{ backgroundColor: accentColor, color: '#ffffff' }}
          >
            AÇÃO ⚡
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-white">
          <div className="flex items-center justify-between mb-2 text-muted-foreground">
            <div className="flex items-center gap-4">
              <Heart className="h-5 w-5" style={{ color: primaryColor }} />
              <MessageCircle className="h-5 w-5" />
              <Send className="h-5 w-5" />
            </div>
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold mr-2" style={{ color: primaryColor }}>@suamarca</span>
            <span className="text-xs" style={{ color: '#333' }}>
              Este é o resultado das suas escolhas aplicadas no design do conteúdo.
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
