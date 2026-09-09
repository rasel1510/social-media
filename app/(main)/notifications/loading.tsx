export default function NotificationsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
        <div className="h-7 w-40 rounded-full bg-zinc-800 animate-pulse" />
      </div>
      <div className="divide-y divide-zinc-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-full bg-zinc-800" />
              <div className="h-3 w-24 rounded-full bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
