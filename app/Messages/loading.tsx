export default function MessagesLoading() {
  return (
    <div className="flex h-screen bg-black">
      {/* Conversation list skeleton */}
      <div className="w-80 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <div className="h-7 w-32 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="divide-y divide-zinc-800">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded-full bg-zinc-800" />
                <div className="h-3 w-36 rounded-full bg-zinc-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area placeholder */}
      <div className="flex-1 flex items-center justify-center">
        <div className="h-6 w-40 rounded-full bg-zinc-800 animate-pulse" />
      </div>
    </div>
  );
}
