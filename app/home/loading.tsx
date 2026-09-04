import { MainLayout } from "@/components/main-layout";

export default function HomeLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col divide-y divide-zinc-800 animate-pulse">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-800 bg-black/80 px-4 backdrop-blur-md">
          <div className="h-6 w-24 rounded bg-zinc-800" />
          <div className="h-8 w-8 rounded-full bg-zinc-800" />
        </div>

        {/* Create Post Skeleton */}
        <div className="flex gap-3 p-4">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-3">
            <div className="h-12 w-full rounded-xl bg-zinc-900" />
            <div className="flex justify-between">
              <div className="flex gap-2">
                <div className="h-8 w-8 rounded-lg bg-zinc-800" />
                <div className="h-8 w-8 rounded-lg bg-zinc-800" />
              </div>
              <div className="h-8 w-20 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>

        {/* Post Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 rounded bg-zinc-800" />
                <div className="h-3 w-20 rounded bg-zinc-900" />
              </div>
            </div>
            <div className="h-16 w-full rounded-lg bg-zinc-900" />
            <div className="flex gap-6 pt-2">
              <div className="h-6 w-16 rounded bg-zinc-800" />
              <div className="h-6 w-16 rounded bg-zinc-800" />
              <div className="h-6 w-16 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
