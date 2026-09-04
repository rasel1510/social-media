import { MainLayout } from "@/components/main-layout";

export default function NotificationsLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black animate-pulse">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md">
          <div className="h-6 w-36 rounded bg-zinc-800" />
          <div className="h-7 w-20 rounded-full bg-zinc-900" />
        </div>

        {/* Notifications List */}
        <div className="divide-y divide-zinc-800/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-zinc-800" />
                <div className="h-3 w-24 rounded bg-zinc-900" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
