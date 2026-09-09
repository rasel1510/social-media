export default function ExploreLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Sticky Header skeleton */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 pt-3 pb-2">
          <div className="h-7 w-24 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex w-full border-t border-zinc-800/50 px-4 gap-6 pb-1">
          {["People You May Know", "Feed", "Trending"].map((label) => (
            <div key={label} className="h-4 w-24 rounded-full bg-zinc-800 animate-pulse my-3" />
          ))}
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="p-4 lg:p-6 space-y-8">
        <div className="space-y-4">
          <div className="h-6 w-44 rounded-full bg-zinc-800 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col animate-pulse">
                <div className="h-32 bg-zinc-800 relative">
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full border-4 border-zinc-900 bg-zinc-700" />
                </div>
                <div className="flex-1 px-6 pt-14 pb-6 flex flex-col items-center gap-3">
                  <div className="h-5 w-28 rounded-full bg-zinc-800" />
                  <div className="h-4 w-20 rounded-full bg-zinc-700" />
                  <div className="h-9 w-full rounded-xl bg-zinc-800 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
