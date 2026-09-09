export default function PostLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black animate-pulse">
      {/* Top Header skeleton */}
      <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <div className="h-8 w-8 rounded-full bg-zinc-800" />
        <div className="h-6 w-20 rounded-full bg-zinc-800" />
      </div>

      {/* Main Post skeleton */}
      <div className="p-4 border-b border-zinc-800 space-y-4">
        <div className="flex gap-3 items-center">
          <div className="h-12 w-12 rounded-full bg-zinc-800 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 rounded-full bg-zinc-800" />
            <div className="h-3 w-20 rounded-full bg-zinc-900" />
          </div>
        </div>

        <div className="space-y-2 py-2">
          <div className="h-4 w-full rounded-full bg-zinc-800" />
          <div className="h-4 w-5/6 rounded-full bg-zinc-800" />
          <div className="h-4 w-3/4 rounded-full bg-zinc-800" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex justify-between items-center pt-3 border-t border-zinc-800/60 px-4">
          <div className="h-5 w-12 rounded-full bg-zinc-800" />
          <div className="h-5 w-12 rounded-full bg-zinc-800" />
          <div className="h-5 w-12 rounded-full bg-zinc-800" />
          <div className="h-5 w-12 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Comment section skeleton */}
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4">
            <div className="h-9 w-9 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3.5 w-24 rounded-full bg-zinc-800" />
              <div className="h-3.5 w-3/4 rounded-full bg-zinc-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
