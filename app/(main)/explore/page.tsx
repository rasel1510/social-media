import {
  getSuggestedFriends,
  getIncomingFriendRequests,
  getSentFriendRequests,
} from "@/app/actions/friend";
import { getCurrentSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { ExploreClientView } from "@/components/explore/explore-client-view";

// Define search params type for Next.js 15
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?callbackURL=/explore");
  }

  const resolvedSearchParams = await searchParams;
  const initialTab = typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : "people";
  const uid = session.user.id;

  // Fetch explore datasets in parallel using Redis multi-tier caching for instant rendering
  const [suggestedUsers, incomingRequests, sentRequests, feedPosts] = await Promise.all([
    redis.remember(`explore:suggested:${uid}`, 30, () => getSuggestedFriends()),
    redis.remember(`explore:incoming:${uid}`, 30, () => getIncomingFriendRequests()),
    redis.remember(`explore:sent:${uid}`, 30, () => getSentFriendRequests()),
    redis.remember("feed:explore:30", 20, async () => {
      return prisma.post.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
        include: {
          author: {
            select: {
              name: true,
              username: true,
              image: true,
            },
          },
          reactions: true,
          sharedPost: {
            include: {
              author: {
                select: {
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    }),
  ]);

  return (
    <ExploreClientView
      initialTab={initialTab}
      suggestedUsers={suggestedUsers}
      incomingRequests={incomingRequests}
      sentRequests={sentRequests}
      feedPosts={feedPosts as any}
      currentUserId={session.user.id}
    />
  );
}
