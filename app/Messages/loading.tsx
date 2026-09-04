import { MainLayout } from "@/components/main-layout";

export default function MessagesLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black animate-pulse">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md">
          <div className="h-6 w-28 rounded bg-zinc-800" />
        </div>

        {/* Conversations List */}
        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 rounded bg-zinc-800" />
                  <div className="h-3 w-12 rounded bg-zinc-900" />
                </div>
                <div className="h-3 w-48 rounded bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
