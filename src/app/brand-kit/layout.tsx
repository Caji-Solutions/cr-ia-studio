import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brand Kit',
}

export default function BrandKitLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
