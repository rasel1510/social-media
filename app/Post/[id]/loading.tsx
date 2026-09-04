import { MainLayout } from "@/components/main-layout";
import { ArrowLeft } from "lucide-react";

export default function PostLoading() {
  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black animate-pulse">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
          <div className="p-2 text-zinc-600">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <div className="h-6 w-20 rounded bg-zinc-800" />
        </div>

        {/* Post Card Skeleton */}
        <div className="p-4 space-y-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-zinc-800" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 rounded bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-900" />
            </div>
          </div>

          <div className="space-y-2 py-2">
            <div className="h-5 w-full rounded bg-zinc-900" />
            <div className="h-5 w-4/5 rounded bg-zinc-900" />
          </div>

          <div className="flex justify-around border-t border-zinc-800/80 pt-3">
            <div className="h-6 w-16 rounded bg-zinc-800" />
            <div className="h-6 w-16 rounded bg-zinc-800" />
            <div className="h-6 w-16 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
