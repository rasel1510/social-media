import { UserFollowCard } from "./user-follow-card";
import { getSuggestedUsersQuery } from "@/lib/follow-queries";
import { getCurrentSession } from "@/lib/session";

const trendingTopics = [
  { tag: "#React19", posts: "45.2K" },
  { tag: "#Rust", posts: "28.1K" },
  { tag: "#NextJS", posts: "19.4K" },
  { tag: "#TypeScript", posts: "15.8K" },
];

export async function RightSidebar() {
  const session = await getCurrentSession();
  const suggestedUsers = await getSuggestedUsersQuery(session?.user.id, 5);

  return (
    <aside className="hidden md:block lg:col-span-3 px-4 py-5 lg:px-5 h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
      <div className="space-y-5">
        {/* Trending */}
        <div className="rounded-3xl bg-zinc-950 p-5">
          <h2 className="mb-5 text-xl font-bold lg:text-2xl">
            Trending in Tech
          </h2>

          <div className="space-y-5">
            {trendingTopics.map((topic) => (
              <div key={topic.tag}>
                <p className="text-xs text-zinc-500">Trending</p>
                <h3 className="text-base font-bold lg:text-lg">
                  {topic.tag}
                </h3>
                <p className="text-sm text-zinc-500">
                  {topic.posts} posts
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Who To Follow */}
        <div className="rounded-3xl bg-zinc-950 p-5">
          <h2 className="mb-5 text-xl font-bold lg:text-2xl">
            Who to follow
          </h2>

          <div className="space-y-4">
            {suggestedUsers.length > 0 ? (
              suggestedUsers.map((user) => (
                <UserFollowCard key={user.id} user={user} initialIsFollowing={false} currentUserId={session?.user.id} />
              ))
            ) : (
              <p className="text-sm text-zinc-500">No suggestions right now.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
