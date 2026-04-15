export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      {children}
    </div>
  )
}
