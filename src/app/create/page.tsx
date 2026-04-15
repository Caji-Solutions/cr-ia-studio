import { CreatePage } from './CreatePage'
import type { ProjectFormat } from '@/types/database'

export const metadata = {
  title: 'Criar Conteúdo — ContentAI Studio',
}

interface Props {
  searchParams: { format?: string; command?: string }
}

export default function Page({ searchParams }: Props) {
  const validFormats: ProjectFormat[] = [
    'carousel', 'post', 'story', 'video_16_9', 'video_9_16', 'caption',
  ]

  const format = validFormats.includes(searchParams.format as ProjectFormat)
    ? (searchParams.format as ProjectFormat)
    : undefined

  return (
    <CreatePage
      initialFormat={format}
      initialCommand={searchParams.command}
    />
  )
}
