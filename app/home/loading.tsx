export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="h-7 w-32 rounded-full bg-zinc-800 animate-pulse" />
      </div>

      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4 animate-pulse">
            <div className="h-11 w-11 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="h-4 w-24 rounded-full bg-zinc-800" />
                <div className="h-4 w-16 rounded-full bg-zinc-700" />
              </div>
              <div className="h-4 w-full rounded-full bg-zinc-800" />
              <div className="h-4 w-3/4 rounded-full bg-zinc-800" />
              <div className="flex gap-6 pt-2">
                <div className="h-4 w-10 rounded-full bg-zinc-800" />
                <div className="h-4 w-10 rounded-full bg-zinc-800" />
                <div className="h-4 w-10 rounded-full bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
