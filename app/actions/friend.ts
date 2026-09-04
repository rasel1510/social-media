"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { friendStatusCache, socialGraph, CacheManager } from "@/lib/cache-manager";

async function getSession() {
  return getCurrentSession();
}

export type FriendStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS" | "SELF";

/**
 * Checks friendship status with O(1) LRU caching and indexed DB fallback
 */
export async function getFriendStatus(targetUserId: string): Promise<FriendStatus> {
  const session = await getSession();
  if (!session) return "NONE";

  const currentUserId = session.user.id;
  if (currentUserId === targetUserId) return "SELF";

  const cacheKey = `friend:${currentUserId}:${targetUserId}`;
  const cachedStatus = friendStatusCache.get(cacheKey) as FriendStatus | undefined;
  if (cachedStatus) return cachedStatus;

  // Check if they are already friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId1: currentUserId, userId2: targetUserId },
        { userId1: targetUserId, userId2: currentUserId },
      ],
    },
    select: { id: true },
  });

  if (friendship) {
    friendStatusCache.set(cacheKey, "FRIENDS", 60000);
    socialGraph.addFriendship(currentUserId, targetUserId);
    return "FRIENDS";
  }

  // Check if there's a pending request sent by the current user
  const sentRequest = await prisma.friendRequest.findFirst({
    where: {
      senderId: currentUserId,
      receiverId: targetUserId,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (sentRequest) {
    friendStatusCache.set(cacheKey, "PENDING_SENT", 30000);
    return "PENDING_SENT";
  }

  // Check if there's a pending request received by the current user
  const receivedRequest = await prisma.friendRequest.findFirst({
    where: {
      senderId: targetUserId,
      receiverId: currentUserId,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (receivedRequest) {
    friendStatusCache.set(cacheKey, "PENDING_RECEIVED", 30000);
    return "PENDING_RECEIVED";
  }

  friendStatusCache.set(cacheKey, "NONE", 30000);
  return "NONE";
}

export async function sendFriendRequest(receiverId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const senderId = session.user.id;
    if (senderId === receiverId) throw new Error("Cannot send request to yourself");

    const status = await getFriendStatus(receiverId);
    if (status !== "NONE") return { success: false, error: "Action not allowed" };

    // Clear any existing rejected/non-pending request between these users
    await prisma.friendRequest.deleteMany({
      where: {
        senderId,
        receiverId,
        status: { not: "PENDING" },
      },
    });

    await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: "PENDING",
      },
    });

    // Create a notification for the receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        actorId: senderId,
        type: "FRIEND_REQUEST",
      },
    });

    CacheManager.invalidateFriendStatus(senderId, receiverId);
    CacheManager.invalidateCounts(receiverId);

    revalidatePath(`/Profile/${receiverId}`);
    revalidatePath(`/explore`);
    return { success: true };
  } catch (error: any) {
    console.error("Error sending friend request:", error);
    return { success: false, error: "Failed to send request" };
  }
}

export async function acceptFriendRequest(senderId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const receiverId = session.user.id;

    // Find the pending request
    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (!request) throw new Error("Request not found");

    // Atomic transaction: Update request status and create Friendship
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.friendship.create({
        data: {
          userId1: senderId,
          userId2: receiverId,
        },
      }),
      prisma.notification.deleteMany({
        where: {
          userId: receiverId,
          actorId: senderId,
          type: "FRIEND_REQUEST",
        },
      }),
    ]);

    // Update in-memory Graph and invalidate cache
    socialGraph.addFriendship(senderId, receiverId);
    CacheManager.invalidateFriendStatus(senderId, receiverId);
    CacheManager.invalidateCounts(receiverId);

    revalidatePath(`/Profile/${senderId}`);
    revalidatePath(`/explore`);
    return { success: true };
  } catch (error: any) {
    console.error("Error accepting friend request:", error);
    return { success: false, error: "Failed to accept request" };
  }
}

export async function rejectFriendRequest(senderId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const receiverId = session.user.id;

    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (!request) return { success: true };

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" },
      }),
      prisma.notification.deleteMany({
        where: {
          userId: receiverId,
          actorId: senderId,
          type: "FRIEND_REQUEST",
        },
      }),
    ]);

    CacheManager.invalidateFriendStatus(senderId, receiverId);
    CacheManager.invalidateCounts(receiverId);

    revalidatePath(`/Profile/${senderId}`);
    revalidatePath(`/explore`);
    return { success: true };
  } catch (error: any) {
    console.error("Error rejecting friend request:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

export async function cancelFriendRequest(receiverId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const senderId = session.user.id;

    const request = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (request) {
      await prisma.$transaction([
        prisma.friendRequest.delete({
          where: { id: request.id },
        }),
        prisma.notification.deleteMany({
          where: {
            userId: receiverId,
            actorId: senderId,
            type: "FRIEND_REQUEST",
          },
        }),
      ]);
    }

    CacheManager.invalidateFriendStatus(senderId, receiverId);
    CacheManager.invalidateCounts(receiverId);

    revalidatePath(`/Profile/${receiverId}`);
    revalidatePath(`/explore`);
    return { success: true };
  } catch (error: any) {
    console.error("Error canceling friend request:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}

export async function removeFriend(friendId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const currentUserId = session.user.id;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId1: currentUserId, userId2: friendId },
          { userId1: friendId, userId2: currentUserId },
        ],
      },
      select: { id: true },
    });

    if (friendship) {
      await prisma.friendship.delete({
        where: { id: friendship.id },
      });

      await prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: friendId },
            { senderId: friendId, receiverId: currentUserId },
          ],
        },
      });
    }

    CacheManager.invalidateFriendStatus(currentUserId, friendId);

    revalidatePath(`/Profile/${friendId}`);
    revalidatePath(`/explore`);
    return { success: true };
  } catch (error: any) {
    console.error("Error removing friend:", error);
    return { success: false, error: "Failed to remove friend" };
  }
}

/**
 * Advanced Social Graph & Jaccard Similarity Friend Recommendation Algorithm
 * 1. Evaluates 2nd-degree connections (Friends-of-Friends) in O(|V| + |E|).
 * 2. Computes mutual friend count & Jaccard index.
 * 3. Falls back to recent active users if graph density is low.
 */
export async function getSuggestedFriends() {
  try {
    const session = await getSession();
    if (!session) return [];

    const currentUserId = session.user.id;

    // Parallel fetch: friendships and pending requests
    const [friendships, requests] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [{ userId1: currentUserId }, { userId2: currentUserId }],
        },
        select: { userId1: true, userId2: true },
      }),
      prisma.friendRequest.findMany({
        where: {
          OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          status: "PENDING",
        },
        select: { senderId: true, receiverId: true },
      }),
    ]);

    const friendIds = new Set(
      friendships.map((f) => (f.userId1 === currentUserId ? f.userId2 : f.userId1))
    );

    const requestedIds = new Set(
      requests.map((r) => (r.senderId === currentUserId ? r.receiverId : r.senderId))
    );

    const excludeSet = new Set<string>([currentUserId, ...friendIds, ...requestedIds]);

    // Build or sync social graph for current user's network
    for (const f of friendships) {
      socialGraph.addFriendship(f.userId1, f.userId2);
    }

    // Run FoF Recommendation Algorithm
    const graphRecommendations = socialGraph.recommendFriends(currentUserId, excludeSet, 15);
    const recommendedUserIds = graphRecommendations.map((r) => r.userId);

    let suggestedUsers: any[] = [];

    if (recommendedUserIds.length > 0) {
      suggestedUsers = await prisma.user.findMany({
        where: { id: { in: recommendedUserIds } },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      });
    }

    // If graph has fewer than 10 recommendations, backfill with newest users
    if (suggestedUsers.length < 10) {
      const remainingLimit = 20 - suggestedUsers.length;
      const existingIds = new Set([...excludeSet, ...suggestedUsers.map((u) => u.id)]);

      const backfillUsers = await prisma.user.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        take: remainingLimit,
        orderBy: { createdAt: "desc" },
      });

      suggestedUsers = [...suggestedUsers, ...backfillUsers];
    }

    // Index users in Trie for instant mentions
    for (const u of suggestedUsers) {
      CacheManager.indexUser(u);
    }

    return suggestedUsers;
  } catch (error) {
    console.error("Error getting suggested friends:", error);
    return [];
  }
}

export async function getIncomingFriendRequests() {
  try {
    const session = await getSession();
    if (!session) return [];

    const currentUserId = session.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: {
        receiverId: currentUserId,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      requestId: r.id,
      user: r.sender,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error getting incoming friend requests:", error);
    return [];
  }
}

export async function getSentFriendRequests() {
  try {
    const session = await getSession();
    if (!session) return [];

    const currentUserId = session.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: {
        senderId: currentUserId,
        status: "PENDING",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      requestId: r.id,
      user: r.receiver,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error getting sent friend requests:", error);
    return [];
  }
}

export async function getUserFriends(userId: string) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: { select: { id: true, name: true, username: true, image: true } },
        user2: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) =>
      f.userId1 === userId ? f.user2 : f.user1
    );

    return friends;
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
}
