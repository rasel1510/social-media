export default function MessagesLoading() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black animate-pulse">
      {/* Header with Search skeleton */}
      <div className="p-6 md:p-8 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 w-40 rounded-full bg-zinc-800" />
            <div className="h-4 w-60 rounded-full bg-zinc-900" />
          </div>
          <div className="h-11 w-full md:w-80 rounded-2xl bg-zinc-900" />
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-24 rounded bg-zinc-800" />
          <div className="h-px flex-1 bg-zinc-800/60" />
        </div>
      </div>

      {/* Friends list skeleton */}
      <div className="p-6 md:p-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/30"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-zinc-800 shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded-full bg-zinc-800" />
                <div className="h-3 w-20 rounded-full bg-zinc-900" />
              </div>
            </div>
            <div className="h-9 w-24 rounded-full bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
