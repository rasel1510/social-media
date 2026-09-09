export function RightSidebarSkeleton() {
  return (
    <aside className="hidden md:block lg:col-span-3 px-4 py-5 lg:px-5 h-full overflow-hidden animate-pulse">
      <div className="space-y-5">
        {/* Trending Skeleton */}
        <div className="rounded-3xl bg-zinc-950 p-5 space-y-4">
          <div className="h-6 w-36 rounded-full bg-zinc-800" />
          <div className="space-y-4 pt-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-zinc-900" />
                <div className="h-4 w-28 rounded bg-zinc-800" />
                <div className="h-3 w-20 rounded bg-zinc-900" />
              </div>
            ))}
          </div>
        </div>

        {/* Who to follow Skeleton */}
        <div className="rounded-3xl bg-zinc-950 p-5 space-y-4">
          <div className="h-6 w-32 rounded-full bg-zinc-800" />
          <div className="space-y-3 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-zinc-800" />
                  <div className="h-3 w-16 rounded bg-zinc-900" />
                </div>
                <div className="h-8 w-16 rounded-full bg-zinc-800 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
