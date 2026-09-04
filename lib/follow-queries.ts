import prisma from "@/lib/db";
import { redis } from "@/lib/redis";

export async function getSuggestedUsersQuery(userId: string | undefined, limit: number = 5) {
  const cacheKey = `follow:suggested:${userId || "anon"}:${limit}`;

  return redis.remember(cacheKey, 30, async () => {
    if (!userId) {
      return prisma.user.findMany({
        take: limit,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    // Get users the current user is already following
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Return users not followed by the current user, excluding themselves
    return prisma.user.findMany({
      where: {
        id: {
          notIn: [...followingIds, userId],
        },
      },
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  });
}

export async function getUserFollowersQuery(userId: string) {
  const cacheKey = `follow:followers:${userId}`;

  return redis.remember(cacheKey, 20, async () => {
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return followers.map((f) => f.follower);
  });
}

export async function getUserFollowingQuery(userId: string) {
  const cacheKey = `follow:following:${userId}`;

  return redis.remember(cacheKey, 20, async () => {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return following.map((f) => f.following);
  });
}
