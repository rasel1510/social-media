import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/counts
 * Returns unread message count + unread notification count in one round-trip.
 * Replaces the two separate server action calls the sidebar was making.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ messages: 0, notifications: 0 });
    }

    const userId = session.user.id;

    const [messages, notifications] = await Promise.all([
      // Unread messages: conversations where the last message is not from this user
      // and hasn't been read by this user
      (prisma as any).message
        ? (prisma as any).message.count({
            where: {
              receiverId: userId,
              read: false,
            },
          })
        : Promise.resolve(0),

      // Unread notifications
      (prisma as any).notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    ]);

    return NextResponse.json(
      { messages, notifications },
      {
        headers: {
          // Very short cache — counts need to be fairly fresh
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/counts]", error);
    return NextResponse.json({ messages: 0, notifications: 0 });
  }
}
