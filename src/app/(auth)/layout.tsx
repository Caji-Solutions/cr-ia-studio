import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-[20%] right-[10%] w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[25rem] h-[25rem] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-4">
        {children}
      </div>
    </div>
  )
}
