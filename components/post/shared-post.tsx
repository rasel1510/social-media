"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MoreHorizontal, EyeOff } from "lucide-react";
import { getHiddenPosts, addHiddenPost } from "./hidden-post-utils";

interface SharedPostProps {
  post: {
    id: string;
    content: string | null;
    image: string | null;
    createdAt: Date | string;
    author: {
      name: string | null;
      username: string | null;
      image: string | null;
    };
    authorId: string;
  };
}

export function SharedPost({ post }: SharedPostProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setIsHidden(getHiddenPosts().includes(post.id));
  }, [post.id]);

  if (isHidden) return null;

  const authorInitials = post.author.name?.[0] || post.author.username?.[0] || "?";

  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40 transition p-4">
      <Link href={`/Profile/${post.author.username || post.authorId}`} className="flex items-center gap-2 mb-2 group/author">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-emerald-400 uppercase overflow-hidden ring-1 ring-zinc-800 group-hover/author:ring-emerald-500/50 transition">
          {post.author.image ? (
            <Image src={post.author.image} alt={post.author.name || ""} width={24} height={24} className="h-full w-full object-cover" />
          ) : (
            authorInitials
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-white group-hover/author:underline group-hover/author:text-emerald-400 transition-colors">
            {post.author.name || post.author.username}
          </span>
          <span className="text-xs text-zinc-500">@{post.author.username}</span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-500" suppressHydrationWarning>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
      </Link>

      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-zinc-500 hover:text-emerald-400 rounded-full p-1 transition hover:bg-emerald-500/10"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 mt-2 w-36 rounded-xl border border-zinc-800 bg-black shadow-2xl z-20 overflow-hidden py-1">
              <button
                onClick={() => {
                  addHiddenPost(post.id);
                  setIsHidden(true);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-zinc-900 transition"
              >
                <EyeOff className="h-4 w-4" /> Hide post
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-sm text-zinc-200 line-clamp-3 mb-2">{post.content}</p>
      {post.image && (
        <div className="overflow-hidden rounded-xl border border-zinc-800/50">
          <Image src={post.image} alt="Original post" width={500} height={300} className="max-h-60 w-full object-cover" />
        </div>
      )}
    </div>
  );
}
