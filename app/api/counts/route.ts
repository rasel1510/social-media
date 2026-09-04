import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { countsCache } from "@/lib/cache-manager";

export const runtime = "nodejs";

/**
 * GET /api/counts
 * Returns unread message count + unread notification count in one round-trip.
 * Uses an O(1) in-memory LRU Cache with TTL to eliminate redundant DB round-trips for high-frequency polling.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ messages: 0, notifications: 0 });
    }

    const userId = session.user.id;
    const cacheKey = `counts:${userId}`;
    const cached = countsCache.get(cacheKey);

    if (cached) {
      return NextResponse.json({
        messages: cached.unreadMessages,
        notifications: cached.unreadNotifications,
      });
    }

    const [messagesCount, notificationsCount] = await Promise.all([
      // Unread messages where recipient is current user and message is not read
      prisma.message.count({
        where: {
          conversation: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
          },
          senderId: { not: userId },
          isRead: false,
        },
      }),

      // Unread notifications for this user
      (prisma as any).notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    const result = {
      unreadMessages: messagesCount,
      unreadNotifications: notificationsCount,
    };

    countsCache.set(cacheKey, result, 10000); // 10s TTL

    return NextResponse.json(
      { messages: messagesCount, notifications: notificationsCount },
      {
        headers: {
          "Cache-Control": "private, max-age=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/counts]", error);
    return NextResponse.json({ messages: 0, notifications: 0 });
  }
}
