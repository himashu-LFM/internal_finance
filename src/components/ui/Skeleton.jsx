import { cn } from '../../utils/cn'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  )
}
