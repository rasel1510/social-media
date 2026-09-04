import { MainLayout } from "@/components/main-layout";
import { getPost } from "@/app/actions";
import { PostCard } from "@/components/post-card";
import { getCurrentSession } from "@/lib/session";
import { redis } from "@/lib/redis";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PostDetailPage({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams: { action?: string }
}) {
  const { id } = await params;
  const { action } = await searchParams;
  const session = await getCurrentSession();

  const post = await redis.remember(`post:detail:${id}`, 20, async () => {
    return getPost(id);
  });

  if (!post) {
    notFound();
  }

  const isOwner = session?.user.id === post.authorId;
  const initialShowShare = action === "share";
  const initialShowComments = action === "comment";

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen bg-black">
        <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md">
          <Link 
            href="/" 
            className="rounded-full p-2 transition hover:bg-zinc-900 text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Post</h1>
        </div>

        <div className="flex-1">
          <PostCard 
            post={post as any} 
            isOwner={isOwner} 
            currentUserId={session?.user.id}
            initialShowShare={initialShowShare}
            initialShowComments={initialShowComments}
          />
        </div>
      </div>
    </MainLayout>
  );
}
