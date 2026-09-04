import { MainLayout } from "@/components/main-layout";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Feed, Post } from "@/components/feed";
import { redirect } from "next/navigation";

// Re-generate this page at most every 30 seconds (ISR)
export const revalidate = 30;

const INITIAL_LIMIT = 10;

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const posts: Post[] = await prisma.post.findMany({
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

  return (
    <MainLayout>
      <Feed initialPosts={posts} currentUserId={session?.user.id} />
    </MainLayout>
  );
}
