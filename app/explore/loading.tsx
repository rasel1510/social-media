import { MainLayout } from "@/components/main-layout";

export default function ExploreLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black animate-pulse">
        {/* Header with Tabs Skeleton */}
        <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-zinc-800">
          <div className="px-4 pt-3 pb-2">
            <div className="h-7 w-28 rounded bg-zinc-800" />
          </div>
          <div className="flex gap-4 px-4 py-2 border-t border-zinc-800/50">
            <div className="h-8 w-36 rounded-full bg-zinc-800" />
            <div className="h-8 w-20 rounded-full bg-zinc-900" />
            <div className="h-8 w-24 rounded-full bg-zinc-900" />
          </div>
        </div>

        {/* Content Skeletons */}
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950 border border-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-800" />
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-zinc-800" />
                  <div className="h-3 w-20 rounded bg-zinc-900" />
                </div>
              </div>
              <div className="h-8 w-24 rounded-full bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
