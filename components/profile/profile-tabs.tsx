"use client";

import { useState } from "react";
import { ProfileFeed } from "./profile-feed";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, LayoutGrid, UserCircle, Image as ImageIcon } from "lucide-react";
import { AboutTab } from "./about-tab";

interface ProfileTabsProps {
  user: any;
  isOwnProfile: boolean;
  currentUserId?: string;
  initialPosts?: any[];
}

type TabType = "All" | "About" | "Photos";

export function ProfileTabs({ user, isOwnProfile, currentUserId, initialPosts }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const tabs: { name: TabType; icon: any }[] = [
    { name: "All", icon: LayoutGrid },
    { name: "About", icon: UserCircle },
    { name: "Photos", icon: ImageIcon },
  ];

  return (
    <div className="w-full">
      <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`relative flex min-w-[100px] flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition hover:bg-zinc-900 ${
                activeTab === tab.name ? "text-white" : "text-zinc-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
              {activeTab === tab.name && (
                <div className="absolute bottom-0 h-1 w-full rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
        {isOwnProfile && (
          <button
            onClick={handleLogout}
            className="flex min-w-[100px] flex-1 items-center justify-center gap-2 py-4 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        )}
      </div>

      <div className="p-0">
        {activeTab === "All" && (
          <ProfileFeed 
            userId={user.id} 
            type="all" 
            currentUserId={currentUserId} 
            isOwnProfile={isOwnProfile} 
            initialPosts={initialPosts}
          />
        )}
        {activeTab === "About" && (
          <AboutTab user={user} isOwnProfile={isOwnProfile} />
        )}
        {activeTab === "Photos" && (
          <ProfileFeed 
            userId={user.id} 
            type="photos" 
            currentUserId={currentUserId} 
            isOwnProfile={isOwnProfile} 
            initialPosts={initialPosts}
          />
        )}
      </div>
    </div>
  );
}
