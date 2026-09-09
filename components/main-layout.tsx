import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { RightSidebar } from "./right-sidebar";
import { RightSidebarSkeleton } from "./right-sidebar-skeleton";
import { MobileNav } from "./mobile-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="h-screen bg-black text-white overflow-hidden">
      <div className="mx-auto grid h-full max-w-7xl grid-cols-1 lg:grid-cols-12">
        {/* Left Sidebar - Hidden on mobile */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="col-span-1 h-full overflow-y-auto border-r border-zinc-800 lg:col-span-6 pb-20 lg:pb-0 scrollbar-hide">
          {children}
        </div>

        {/* Right Sidebar - Progressive Suspense Streaming */}
        <Suspense fallback={<RightSidebarSkeleton />}>
          <RightSidebar />
        </Suspense>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </main>
  );
}
