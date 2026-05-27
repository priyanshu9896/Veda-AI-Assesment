import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 rounded animate-pulse',
        className
      )}
    />
  )
}

export function AssignmentCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function AssignmentListSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <AssignmentCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PaperSkeleton() {
  return (
    <div className="card p-8 space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <Skeleton className="h-6 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto" />
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  )
}
