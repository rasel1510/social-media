"use client";

import { Loader2, MessageCircle, Share2, MapPin } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { deletePost, updatePost } from "@/app/actions";
import { Post } from "./feed";
import { authClient } from "@/lib/auth-client";
import { SharedPost } from "./post/shared-post";
import { ReactionButton } from "./post/reaction-button";
import { PostMenu } from "./post/post-menu";
import { FormattedText } from "./ui/formatted-text";
import { addHiddenPost, getHiddenPosts } from "./post/hidden-post-utils";
import { toast } from "sonner";

// Heavy modals — loaded only when user triggers them
const CommentSection = dynamic(
  () => import("./comment/CommentSection").then((m) => m.CommentSection),
  { ssr: false, loading: () => <div className="py-4 text-center text-sm text-zinc-500"><Loader2 className="inline h-4 w-4 animate-spin" /></div> }
);
const ShareDialog = dynamic(
  () => import("./post/share-dialog").then((m) => m.ShareDialog),
  { ssr: false }
);
const ReactionDialog = dynamic(
  () => import("./post/reaction-dialog").then((m) => m.ReactionDialog),
  { ssr: false }
);

interface PostCardProps {
  post: Post;
  isOwner?: boolean;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  initialShowComments?: boolean;
  initialShowShare?: boolean;
}

export function PostCard({
  post,
  isOwner,
  currentUserId,
  onDelete,
  initialShowComments = false,
  initialShowShare = false,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || "");
  const [isPending, startTransition] = useTransition();
  const [showComments, setShowComments] = useState(initialShowComments);
  const [commentCount, setCommentCount] = useState(
    (post as any)._count?.comments || (post as any).comments?.length || 0
  );
  const [shareCount, setShareCount] = useState(
    (post as any)._count?.shares || (post as any).shares?.length || 0
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(initialShowShare);
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getHiddenPosts().includes(post.id)) setIsHidden(true);
  }, [post.id]);

  const { data: session } = authClient.useSession();
  const rawUsername = post.author.username || post.authorId || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = post.author.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, "")}${shortUsername}`;
  const initials = (post.author.name?.[0] || rawUsername[0] || "U").toUpperCase();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    startTransition(async () => {
      try {
        await deletePost(post.id);
        if (onDelete) onDelete(post.id);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    });
  };

  const handleUpdate = async () => {
    if (!editedContent.trim() || editedContent === post.content) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        const res = await updatePost(post.id, editedContent);
        if (res?.success) {
          setIsEditing(false);
          if (res.flagged) {
            toast.warning(res.warning || "Your post contains inappropriate language.");
          } else {
            toast.success("Post updated successfully!");
          }
        } else {
          toast.error(res?.error || "Failed to update post");
          if (res?.deleted) {
            await authClient.signOut();
            window.location.href = "/signup";
          }
        }
      } catch (error) {
        console.error("Update failed:", error);
        toast.error("Failed to update post.");
      }
    });
  };

  if (isHidden) return null;

  return (
    <div className="border-b border-zinc-800 p-4 lg:p-5 transition hover:bg-zinc-950/50">
      <div className="flex gap-3">
        {/* Avatar — Next.js Image: auto WebP/AVIF, lazy, sized */}
        <Link
          href={`/Profile/${post.author.username || post.authorId}`}
          prefetch={true}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400 uppercase hover:opacity-80 transition overflow-hidden"
        >
          {post.author.image ? (
            <Image
              src={post.author.image}
              alt={name}
              width={44}
              height={44}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            initials
          )}
        </Link>

        <div className="flex-1">
          <div className="flex items-center justify-between relative">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Link
                  href={`/Profile/${post.author.username || post.authorId}`}
                  prefetch={true}
                  className="font-bold text-white hover:underline text-sm sm:text-base"
                >
                  {name}
                </Link>
                <span className="text-zinc-500 text-xs">{formattedHandle}</span>
                <span className="text-zinc-500 text-xs sm:text-sm">·</span>
                <span className="text-zinc-500 text-xs sm:text-sm" suppressHydrationWarning>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              {(post as any).location && (
                <div className="flex items-center gap-1 text-emerald-500/80 text-[11px] font-medium -mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span>{(post as any).location}</span>
                </div>
              )}
            </div>

            <PostMenu
              isOwner={!!isOwner}
              isPending={isPending}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDelete}
              onHide={() => {
                addHiddenPost(post.id);
                setIsHidden(true);
              }}
            />
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-3">
              <textarea
                autoFocus
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full bg-zinc-900/50 text-white p-4 rounded-2xl border border-zinc-800 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none min-h-[120px] shadow-inner"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2 text-sm font-semibold text-zinc-400 hover:text-black transition-colors rounded-full hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending || !editedContent.trim()}
                  onClick={handleUpdate}
                  className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2 rounded-full text-black text-sm font-bold disabled:opacity-50 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <FormattedText text={post.content} className="mt-1 text-white leading-normal" />
          )}

          {/* Post image — Next.js Image with lazy loading */}
          {post.image && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800">
              <Image
                src={post.image}
                alt="Post attachment"
                width={600}
                height={400}
                className="w-full object-cover max-h-[512px]"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 600px"
              />
            </div>
          )}

          {post.sharedPost && <SharedPost post={post.sharedPost as any} />}

          {(post.reactions.length > 0 || commentCount > 0 || shareCount > 0) && (
            <div className="mt-4 flex items-center justify-between px-1">
              <div className="text-sm text-zinc-500 font-medium">
                {post.reactions.length > 0 && (
                  <button
                    onClick={() => setIsReactionModalOpen(true)}
                    className="hover:underline hover:text-emerald-400 transition-colors"
                  >
                    {post.reactions.length} reactions
                  </button>
                )}
              </div>
              <div className="flex gap-3 text-xs text-zinc-600 font-medium">
                {commentCount > 0 && (
                  <button onClick={() => setShowComments(!showComments)} className="hover:underline">
                    {commentCount} comments
                  </button>
                )}
                {shareCount > 0 && <span>{shareCount} shares</span>}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-1 border-t border-zinc-900 pt-1.5 relative">
            <ReactionButton postId={post.id} reactions={post.reactions} currentUserId={currentUserId} />

            <button
              onClick={() => {
                if (!session) {
                  router.push("/login?callbackURL=" + window.location.pathname);
                } else {
                  setShowComments(!showComments);
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold">Comment</span>
            </button>

            <button
              onClick={() => {
                if (!session) {
                  router.push("/login?callbackURL=" + window.location.pathname);
                } else {
                  setIsShareModalOpen(true);
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
            >
              <Share2 className="h-5 w-5" />
              <span className="font-semibold">Share</span>
            </button>
          </div>

          {/* Dynamically loaded heavy components */}
          {showComments && (
            <CommentSection
              postId={post.id}
              currentUserId={currentUserId}
              onCommentCountChange={setCommentCount}
              onClose={() => setShowComments(false)}
            />
          )}
        </div>
      </div>

      {session?.user && isShareModalOpen && (
        <ShareDialog
          isOpen={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          post={post as any}
          currentUser={session.user as any}
          onSuccess={() => setShareCount((prev: number) => prev + 1)}
        />
      )}

      {isReactionModalOpen && (
        <ReactionDialog
          isOpen={isReactionModalOpen}
          onOpenChange={setIsReactionModalOpen}
          postId={post.id}
        />
      )}
    </div>
  );
}