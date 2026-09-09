"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSuggestedUsersQuery, getUserFollowersQuery, getUserFollowingQuery } from "@/lib/follow-queries";
import { getCurrentSession } from "@/lib/session";
import { redis } from "@/lib/redis";

export async function followUser(targetUserId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");
  if (session.user.id === targetUserId) throw new Error("Cannot follow yourself");

  // Create follow record
  await prisma.follow.create({
    data: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
  });

  // Create follow notification for target user
  await (prisma as any).notification.create({
    data: {
      userId: targetUserId,
      actorId: session.user.id,
      type: "FOLLOW",
    },
  });

  // Fetch usernames to revalidate specific profile pages
  const [targetUser, currentUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId }, select: { username: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } }),
  ]);

  revalidatePath("/");
  if (targetUser?.username) {
    revalidatePath(`/Profile/${targetUser.username}`);
  }
  revalidatePath(`/Profile/${targetUserId}`);

  if (currentUser?.username) {
    revalidatePath(`/Profile/${currentUser.username}`);
  }
  revalidatePath(`/Profile/${session.user.id}`);
  
  await redis.del(`follow:is:${session.user.id}:${targetUserId}`);
  await redis.del(`follow:suggested:${session.user.id}:5`);
  return { success: true };
}

export async function unfollowUser(targetUserId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  // Delete follow record
  await prisma.follow.deleteMany({
    where: {
      followerId: session.user.id,
      followingId: targetUserId,
    },
  });

  // Delete the follow notification
  await (prisma as any).notification.deleteMany({
    where: {
      userId: targetUserId,
      actorId: session.user.id,
      type: "FOLLOW",
    },
  });

  // Fetch usernames to revalidate specific profile pages
  const [targetUser, currentUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId }, select: { username: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } }),
  ]);

  revalidatePath("/");
  if (targetUser?.username) {
    revalidatePath(`/Profile/${targetUser.username}`);
  }
  revalidatePath(`/Profile/${targetUserId}`);

  if (currentUser?.username) {
    revalidatePath(`/Profile/${currentUser.username}`);
  }
  revalidatePath(`/Profile/${session.user.id}`);

  await redis.del(`follow:is:${session.user.id}:${targetUserId}`);
  await redis.del(`follow:suggested:${session.user.id}:5`);
  return { success: true };
}

export async function checkIsFollowing(targetUserId: string) {
  const session = await getCurrentSession();
  if (!session) return false;

  return redis.remember(`follow:is:${session.user.id}:${targetUserId}`, 30, async () => {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
      select: { id: true },
    });

    return !!follow;
  });
}






export async function checkMultipleFollowStatus(targetUserIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || targetUserIds.length === 0) return {};

  const follows = await prisma.follow.findMany({
    where: {
      followerId: session.user.id,
      followingId: { in: targetUserIds },
    },
    select: { followingId: true },
  }) as { followingId: string }[];

  const followMap: Record<string, boolean> = {};
  targetUserIds.forEach(id => followMap[id] = false);
  follows.forEach(f => followMap[f.followingId] = true);

  return followMap;
}

export async function getSuggestedUsers(limit: number = 5) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return getSuggestedUsersQuery(session?.user.id, limit);
}

export async function getUserFollowers(userId: string) {
  return getUserFollowersQuery(userId);
}

export async function getUserFollowing(userId: string) {
  return getUserFollowingQuery(userId);
}
