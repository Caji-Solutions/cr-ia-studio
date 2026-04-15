import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <header className="mb-8 hidden md:block">
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-72" />
      </header>

      {/* HeroCommand */}
      <Skeleton className="h-[100px] w-full max-w-2xl mx-auto rounded-xl mb-10" />

      {/* Metrics */}
      <div className="grid gap-3 md:grid-cols-3 mb-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Format cards */}
      <div className="mb-4">
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-10">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-2.5">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-1.5 w-full flex flex-col items-center">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent projects header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-16" />
      </div>

      {/* Recent project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <Skeleton className="h-36 w-full rounded-none" />
            <div className="p-3.5 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
