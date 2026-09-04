import { MainLayout } from "@/components/main-layout";

export default function ProfileLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black animate-pulse">
        {/* Cover Photo Skeleton */}
        <div className="h-44 md:h-52 w-full bg-zinc-900" />

        {/* Profile Info Skeleton */}
        <div className="px-4 pb-4 space-y-4">
          <div className="flex justify-between items-end -mt-16">
            <div className="h-28 w-28 rounded-full border-4 border-black bg-zinc-800" />
            <div className="h-9 w-28 rounded-full bg-zinc-800" />
          </div>

          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-zinc-800" />
            <div className="h-4 w-24 rounded bg-zinc-900" />
          </div>

          <div className="h-10 w-3/4 rounded bg-zinc-900" />

          {/* Stats Skeleton */}
          <div className="flex gap-6 py-2">
            <div className="h-5 w-20 rounded bg-zinc-800" />
            <div className="h-5 w-20 rounded bg-zinc-800" />
            <div className="h-5 w-20 rounded bg-zinc-800" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex border-b border-zinc-800 px-4 gap-8 py-3">
          <div className="h-6 w-16 rounded bg-zinc-800" />
          <div className="h-6 w-16 rounded bg-zinc-900" />
          <div className="h-6 w-16 rounded bg-zinc-900" />
        </div>
      </div>
    </MainLayout>
  );
}
