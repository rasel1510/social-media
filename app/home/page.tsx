import { MainLayout } from "@/components/main-layout";
import prisma from "@/lib/db";
import { getCurrentSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { Feed, Post } from "@/components/feed";
import { redirect } from "next/navigation";

const INITIAL_LIMIT = 10;

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // Cache initial feed in Redis for 10 seconds for lightning fast page loads
  const posts = await redis.remember<Post[]>("feed:home:initial:10", 30, async () => {
    return prisma.post.findMany({
      take: INITIAL_LIMIT,
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
  });

  return (
    <MainLayout>
      <Feed initialPosts={posts} currentUserId={session?.user.id} />
    </MainLayout>
  );
}
