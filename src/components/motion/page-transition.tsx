export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {children}
    </div>
  )
}
