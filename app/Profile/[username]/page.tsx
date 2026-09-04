import { MainLayout } from "@/components/main-layout";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { checkIsFollowing } from "@/app/actions/follow";
import { getFriendStatus } from "@/app/actions/friend";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = await params;
  const session = await getCurrentSession();

  // Cache user profile in Redis for 15s
  const cacheKey = `profile:user:${username}`;
  const user = await redis.remember(cacheKey, 15, async () => {
    // Try to find by username first
    let u = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            friendships1: true,
            friendships2: true,
          },
        },
      },
    });

    // If not found, try by ID
    if (!u) {
      u = await prisma.user.findUnique({
        where: { id: username },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
              friendships1: true,
              friendships2: true,
            },
          },
        },
      });
    }

    // Fallback: match by name (spaces removed)
    if (!u) {
      const candidates = await prisma.user.findMany({
        where: { username: null },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
              friendships1: true,
              friendships2: true,
            },
          },
        },
      });
      u = candidates.find((cand) => cand.name.replace(/\s+/g, "") === username) || null;
    }

    return u;
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user.id === user.id;

  const [initialIsFollowing, friendStatus] = await Promise.all([
    !isOwnProfile && session ? checkIsFollowing(user.id) : Promise.resolve(false),
    !isOwnProfile && session ? getFriendStatus(user.id) : Promise.resolve("NONE" as const),
  ]);

  return (
    <MainLayout>
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={initialIsFollowing}
        initialFriendStatus={friendStatus}
        currentUserId={session?.user.id}
      />
      <ProfileTabs user={user} isOwnProfile={isOwnProfile} currentUserId={session?.user.id} />
    </MainLayout>
  );
}
