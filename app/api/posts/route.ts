import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/posts?cursor=<postId>&limit=10
 * Cursor-based paginated feed. Returns posts + nextCursor.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 20);

    const posts = await prisma.post.findMany({
      take: limit + 1, // fetch one extra to detect if there's a next page
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { name: true, username: true, image: true },
        },
        reactions: true,
        sharedPost: {
          include: {
            author: {
              select: { name: true, username: true, image: true },
            },
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const lastPost = posts.pop(); // remove the extra item
      nextCursor = lastPost?.id ?? null;
    }

    return NextResponse.json(
      { posts, nextCursor },
      {
        headers: {
          // Allow CDN/browser to cache for 15s, stale-while-revalidate for 30s
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
