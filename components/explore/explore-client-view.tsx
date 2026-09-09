"use client";

import { useState } from "react";
import { ExploreFeed } from "./explore-feed";
import { ExploreTrending } from "./explore-trending";
import { ExploreUserCard } from "@/app/(main)/explore/explore-user-card";
import { FriendRequestCard } from "@/app/(main)/explore/friend-request-card";
import { SentRequestCard } from "@/app/(main)/explore/sent-request-card";
import { Post } from "@/components/feed";

interface ExploreClientViewProps {
  initialTab: string;
  suggestedUsers: any[];
  incomingRequests: any[];
  sentRequests: any[];
  feedPosts: Post[];
  currentUserId: string;
}

export function ExploreClientView({
  initialTab,
  suggestedUsers,
  incomingRequests,
  sentRequests,
  feedPosts,
  currentUserId,
}: ExploreClientViewProps) {
  const [tab, setTab] = useState(initialTab || "people");

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    // Smooth URL update without triggering full Next.js page re-rendering
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", newTab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const hasAnyPeopleContent =
    suggestedUsers.length > 0 ||
    incomingRequests.length > 0 ||
    sentRequests.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Sticky Header with Instant Tabs */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Explore</h2>
          </div>
        </div>

        <div className="flex w-full overflow-x-auto scrollbar-hide border-t border-zinc-800/50">
          <button
            onClick={() => handleTabChange("people")}
            className={`flex-1 min-w-max relative px-4 py-3.5 text-sm font-bold text-center transition-colors hover:bg-zinc-900/60 ${
              tab === "people" ? "text-white" : "text-zinc-500"
            }`}
          >
            People You May Know
            {tab === "people" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => handleTabChange("feed")}
            className={`flex-1 min-w-max relative px-4 py-3.5 text-sm font-bold text-center transition-colors hover:bg-zinc-900/60 ${
              tab === "feed" ? "text-white" : "text-zinc-500"
            }`}
          >
            Feed
            {tab === "feed" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => handleTabChange("trending")}
            className={`flex-1 min-w-max relative px-4 py-3.5 text-sm font-bold text-center transition-colors hover:bg-zinc-900/60 ${
              tab === "trending" ? "text-white" : "text-zinc-500"
            }`}
          >
            Trending
            {tab === "trending" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {tab === "people" && (
          <div className="p-4 lg:p-6 space-y-8 pb-20">
            {/* Incoming Friend Requests */}
            {incomingRequests.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Friend Requests
                      <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-emerald-500 text-black text-xs font-bold">
                        {incomingRequests.length}
                      </span>
                    </h3>
                    <p className="text-zinc-500 text-sm">
                      People who want to connect with you
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {incomingRequests.map((req: any) => (
                    <FriendRequestCard
                      key={req.user.id}
                      user={req.user}
                      createdAt={req.createdAt}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Sent Requests
                    <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                      {sentRequests.length}
                    </span>
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    People you&apos;ve sent friend requests to
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sentRequests.map((req: any) => (
                    <SentRequestCard
                      key={req.user.id}
                      user={req.user}
                      createdAt={req.createdAt}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Divider */}
            {(incomingRequests.length > 0 || sentRequests.length > 0) &&
              suggestedUsers.length > 0 && (
                <div className="border-t border-zinc-800" />
              )}

            {/* People You May Know */}
            {suggestedUsers.length > 0 && (
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">
                    People You May Know
                  </h3>
                  <p className="text-zinc-500 text-sm">
                    Based on your activity and network
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {suggestedUsers.map((user: any) => (
                    <ExploreUserCard
                      key={user.id}
                      user={user}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {!hasAnyPeopleContent && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No suggestions right now
                </h3>
                <p className="text-zinc-500 max-w-sm">
                  We&apos;re looking for more people you might know. Check back later!
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "feed" && (
          <ExploreFeed initialPosts={feedPosts} currentUserId={currentUserId} />
        )}

        {tab === "trending" && <ExploreTrending />}
      </div>
    </div>
  );
}
