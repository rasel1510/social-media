export default function ProfileLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black animate-pulse">
      {/* Top Header skeleton */}
      <div className="sticky top-0 z-20 flex items-center gap-6 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
        <div className="h-8 w-8 rounded-full bg-zinc-800" />
        <div className="space-y-1">
          <div className="h-5 w-32 rounded-full bg-zinc-800" />
          <div className="h-3 w-16 rounded-full bg-zinc-900" />
        </div>
      </div>

      {/* Cover Image skeleton */}
      <div className="h-44 sm:h-52 w-full bg-zinc-900" />

      {/* Profile info skeleton */}
      <div className="px-4 pb-4">
        <div className="relative flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-zinc-800 ring-4 ring-black" />
          <div className="h-10 w-28 rounded-full bg-zinc-800" />
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-6 w-44 rounded-full bg-zinc-800" />
          <div className="h-4 w-28 rounded-full bg-zinc-900" />
          <div className="h-4 w-72 rounded-full bg-zinc-900 pt-1" />
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-4 mb-4">
          <div className="h-4 w-20 rounded-full bg-zinc-800" />
          <div className="h-4 w-20 rounded-full bg-zinc-800" />
          <div className="h-4 w-20 rounded-full bg-zinc-800" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b border-zinc-800 px-4 py-3 gap-8">
        <div className="h-5 w-16 rounded-full bg-zinc-800" />
        <div className="h-5 w-16 rounded-full bg-zinc-900" />
        <div className="h-5 w-16 rounded-full bg-zinc-900" />
        <div className="h-5 w-16 rounded-full bg-zinc-900" />
      </div>

      {/* Posts skeleton */}
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-4">
            <div className="h-11 w-11 rounded-full bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="h-4 w-24 rounded-full bg-zinc-800" />
                <div className="h-4 w-16 rounded-full bg-zinc-900" />
              </div>
              <div className="h-4 w-full rounded-full bg-zinc-800" />
              <div className="h-4 w-2/3 rounded-full bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
