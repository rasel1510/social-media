"use client";

import { ImageIcon, X, Smile, Loader2, Code2, User as UserIcon, MapPin } from "lucide-react";
import { PostCard } from "./post-card";
import { useState, useTransition, useRef, useEffect } from "react";
import { createPost } from "@/app/actions";
import { useUploadThing } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import { MentionTextarea } from "./ui/mention-textarea";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });


import type { Post as PrismaPost } from "@prisma/client";

export type Reaction = {
    id: string;
    postId: string;
    userId: string;
    type: string;
    createdAt: Date;
};

export type Post = PrismaPost & {
    author: {
        name: string | null;
        username: string | null;
        image: string | null;
    };
    reactions: Reaction[];
    sharedPost?: (PrismaPost & {
        author: {
            name: string | null;
            username: string | null;
            image: string | null;
        };
    }) | null;
};

interface FeedProps {
    initialPosts: Post[];
    currentUserId?: string; // Pass the logged-in user's ID
}


import { authClient } from "@/lib/auth-client";

export function Feed({ initialPosts, currentUserId }: FeedProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const { data: session } = authClient.useSession();
    const initials = session?.user.name?.[0] || "?";
    const [content, setContent] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [location, setLocation] = useState<string | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPending, startTransition] = useTransition();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    useEffect(() => {
        setPosts(initialPosts);
    }, [initialPosts]);

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
            toast.error("Failed to upload image. Please try again.");
        },
        onUploadBegin: () => {
            setIsUploading(true);
            setUploadProgress(0);
        },
        onUploadProgress: (p) => {
            setUploadProgress(p);
        },
    });

    const handleActionCheck = () => {
        if (!session) {
            router.push("/login?callbackURL=" + window.location.pathname);
            return false;
        }
        return true;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!handleActionCheck()) return;
        const file = e.target.files?.[0];
        if (file) {
            await startUpload([file]);
        }
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGetLocation = () => {
        if (!handleActionCheck()) return;
        if (isGettingLocation) return;
        
        setIsGettingLocation(true);
        
        if (!navigator.geolocation) {
          toast.error("Geolocation is not supported by your browser");
          setIsGettingLocation(false);
          return;
        }
    
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
              );
              const data = await response.json();
              
              if (data && data.display_name) {
                const addr = data.address;
                const city = addr.city || addr.town || addr.village || addr.suburb || "";
                const country = addr.country || "";
                const locationName = city ? `${city}, ${country}` : data.display_name.split(',').slice(0, 2).join(',');
                setLocation(locationName);
                toast.success(`Location set to ${locationName}`);
              } else {
                setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
              }
            } catch (error) {
              console.error("Error fetching location name:", error);
              toast.error("Failed to get location name.");
            } finally {
              setIsGettingLocation(false);
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast.error("Location permission denied.");
            setIsGettingLocation(false);
          }
        );
      };

    const handlePost = async () => {
        if (!handleActionCheck()) return;
        if ((!content.trim() && !image && !location) || isPending || isUploading) return;

        startTransition(async () => {
            const res = await createPost(content, image || undefined, location || undefined);
            if (res?.success) {
                setContent("");
                setImage(null);
                setLocation(null);
                setShowEmojiPicker(false);
                toast.success("Post created successfully!");
            } else {
                toast.error(res?.error || "Failed to create post");
            }
        });
    };

    const onEmojiClick = (emojiData: any) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        const newContent = before + emojiData.emoji + after;
        setContent(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
        }, 0);
    };

    return (
        <section className="col-span-1 lg:col-span-6 lg:border-r lg:border-zinc-800 h-full overflow-y-auto pb-16 lg:pb-0 scrollbar-hide">
            {/* Mobile Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-black/80 px-4 py-3 backdrop-blur-md lg:px-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 font-bold text-emerald-400 lg:hidden overflow-hidden">
                        {session?.user.image ? (
                            <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                </div>
                
                <h1 className="text-lg font-bold lg:hidden">Home</h1>

                <div className="flex items-center gap-3 lg:hidden">
                    <div className="w-9" /> 
                </div>
            </header>

            {/* Create Post */}
            <div className="border-b border-zinc-800 px-4 py-4 lg:px-5">
                <div className="flex gap-3">
                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 font-bold text-emerald-400 sm:flex overflow-hidden">
                        {session?.user.image ? (
                            <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
                        ) : session?.user ? (
                            initials
                        ) : (
                            <UserIcon className="h-5 w-5" />
                        )}
                    </div>

                    <div className="flex-1">
                        <MentionTextarea
                            ref={textareaRef}
                            value={content}
                            onValueChange={setContent}
                            placeholder="What's happening in your mind?"
                            className="min-h-[50px] w-full resize-none bg-transparent text-base outline-none placeholder:text-zinc-500 sm:text-lg"
                        />

                        {location && (
                          <div className="mt-1 flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-500/20 mb-2">
                            <MapPin className="h-3 w-3" />
                            <span>{location}</span>
                            <button onClick={() => setLocation(null)} className="ml-0.5 hover:text-white transition">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Image Preview */}
                        {(image || isUploading) && (
                            <div className="relative mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
                                {isUploading ? (
                                    <div className="flex h-[150px] w-full flex-col items-center justify-center gap-3 px-10 text-center">
                                        <div className="relative flex h-12 w-12 items-center justify-center">
                                            <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-400">{uploadProgress}%</span>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-400">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={removeImage}
                                            className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white backdrop-blur-sm transition hover:bg-black/80"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <img
                                            src={image!}
                                            alt="Preview"
                                            className="max-h-[300px] w-full object-cover"
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                            <div className="flex items-center gap-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || isPending}
                                    className="rounded-full p-2 text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-50"
                                    title="Add Image"
                                >
                                    <ImageIcon className="h-5 w-5" />
                                </button>
                                
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            if (!handleActionCheck()) return;
                                            setShowEmojiPicker(!showEmojiPicker);
                                        }}
                                        className={`rounded-full p-2 transition ${showEmojiPicker ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                                        title="Add Emoji"
                                    >
                                        <Smile className="h-5 w-5" />
                                    </button>

                                    {showEmojiPicker && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setShowEmojiPicker(false)}
                                            />
                                            <div className="absolute top-full left-0 mt-2 z-40 shadow-2xl">
                                                <EmojiPicker
                                                    onEmojiClick={onEmojiClick}
                                                    theme={"dark" as any}
                                                    autoFocusSearch={false}
                                                    width={300}
                                                    height={400}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button 
                                  onClick={handleGetLocation}
                                  disabled={isGettingLocation}
                                  className={`rounded-full p-2 transition ${location ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50'}`}
                                  title="Add Location"
                                >
                                  {isGettingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
                                </button>
                            </div>

                            <button
                                onClick={handlePost}
                                disabled={(!content.trim() && !image && !location) || isPending || isUploading}
                                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                                {isPending ? "Posting..." : isUploading ? "Uploading..." : "Post"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="divide-y divide-zinc-800">
                {posts.length > 0 ? (
                    posts.map((post) => (
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
                    <div className="flex h-[40vh] items-center justify-center px-4 text-center">
                        <p className="text-base text-zinc-500 sm:text-lg">
                            No posts yet. Be the first to share!
                        </p>
                    </div>
                )}
            </div>

        </section>
    );
}
