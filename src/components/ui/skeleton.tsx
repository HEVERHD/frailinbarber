export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#3d2020] ${className}`}
      style={style}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020]">
      <Skeleton className="h-6 w-24 mb-3" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div className="bg-[#2d1515] rounded-xl p-5 border border-[#3d2020]">
      <Skeleton className="h-8 w-8 rounded-lg mb-2" />
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-6 w-28" />
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#2d1515] rounded-xl p-4 border border-[#3d2020] flex items-center gap-3"
        >
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-[#2d1515] rounded-xl p-6 border border-[#3d2020]">
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="flex items-end gap-2 h-[200px]">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <Skeleton
              className="w-full rounded-t-md"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
