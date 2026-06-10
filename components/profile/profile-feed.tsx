"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { PostCard } from "../post-card";
import { getUserPosts, createPost } from "@/app/actions";
import { Post } from "../feed";
import { authClient } from "@/lib/auth-client";
import { ImageIcon, Code2, Smile, X, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import dynamic from 'next/dynamic';
import { toast } from "sonner";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ProfileFeedProps {
  userId: string;
  type: "all" | "photos";
  currentUserId?: string;
  isOwnProfile: boolean;
}

export function ProfileFeed({ userId, type, currentUserId, isOwnProfile }: ProfileFeedProps) {
  const { data: session } = authClient.useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Post state
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const userPosts = await getUserPosts(userId);
        setPosts(userPosts as any);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [userId]);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setImage(res[0].ufsUrl);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);
      setIsUploading(false);
      setUploadProgress(0);
      alert("Failed to upload image. Please try again.");
    },
    onUploadBegin: () => {
      setIsUploading(true);
      setUploadProgress(0);
    },
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
  });

  const handlePost = async () => {
    if ((!content.trim() && !image) || isPending || isUploading) return;

    startTransition(async () => {
      const result = await createPost(content, image || undefined);
      if (result?.success) {
        setContent("");
        setImage(null);
        setShowEmojiPicker(false);
        if (result.flagged) {
          toast.warning(result.warning || "Your post contains inappropriate language.");
        } else {
          toast.success("Post created successfully!");
        }
        // Optimistically update or just re-fetch
        const userPosts = await getUserPosts(userId);
        setPosts(userPosts as any);
      } else {
        toast.error(result?.error || "Failed to create post");
        if (result?.deleted) {
          await authClient.signOut();
          window.location.href = "/signup";
        }
      }
    });
  };

  const filteredPosts = type === "photos" 
    ? posts.filter(post => post.image)
    : posts;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {/* Create Post - Only on 'All' tab for own profile */}
      {isOwnProfile && type === "all" && (
        <div className="px-4 py-4 lg:px-5 bg-zinc-950/30 border-b border-zinc-800">
          <div className="flex gap-3">
             <div className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 font-bold text-emerald-400 hidden sm:flex overflow-hidden">
                {session?.user.image ? (
                  <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                ) : (
                  session?.user.name?.[0] || "?"
                )}
             </div>
             <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="min-h-[60px] w-full resize-none bg-transparent text-base outline-none placeholder:text-zinc-500"
                />

                {image && (
                  <div className="relative mt-3 overflow-hidden rounded-2xl border border-zinc-800">
                    <button
                      onClick={() => setImage(null)}
                      className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <img src={image} alt="Preview" className="max-h-[300px] w-full object-cover" />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                  <div className="flex items-center gap-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await startUpload([file]);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full p-2 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </button>
                    <button className="rounded-full p-2 text-emerald-400 hover:bg-emerald-500/10">
                      <Code2 className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={handlePost}
                    disabled={(!content.trim() && !image) || isPending || isUploading}
                    className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-black transition hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isPending ? "Posting..." : "Post"}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isOwner={post.authorId === currentUserId}
            currentUserId={currentUserId}
            onDelete={(deletedId) => {
              setPosts(prev => prev.filter(p => p.id !== deletedId));
            }}
          />
        ))
      ) : (
        <div className="p-12 text-center text-zinc-500">
          <p>{type === "photos" ? "No photos shared yet." : "No posts yet."}</p>
        </div>
      )}
    </div>
  );
}
