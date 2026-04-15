import type { MusicTrack } from '../types'

interface TrackConfig {
  /** Caminho relativo a /public */
  url: string
  /** Volume base 0.12–0.18 */
  volume: number
  /** Descrição do mood para referência */
  mood: string
}

/**
 * Adicione os arquivos MP3 em /public/audio/.
 * Sugestões royalty-free: Pixabay, Free Music Archive, ccMixter.
 * Duração recomendada: 30–60s (loop ativado no componente).
 */
export const TRACK_CONFIG: Record<MusicTrack, TrackConfig> = {
  energetic: { url: '/audio/energetic.mp3', volume: 0.16, mood: 'motivacional/vendas' },
  calm:      { url: '/audio/calm.mp3',      volume: 0.13, mood: 'educacional/wellness' },
  corporate: { url: '/audio/corporate.mp3', volume: 0.15, mood: 'institucional/B2B' },
  fun:       { url: '/audio/fun.mp3',       volume: 0.18, mood: 'jovem/entretenimento' },
  inspiring: { url: '/audio/inspiring.mp3', volume: 0.14, mood: 'storytelling/cases' },
  minimal:   { url: '/audio/minimal.mp3',   volume: 0.12, mood: 'clean/tech' },
}
