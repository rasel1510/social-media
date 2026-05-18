"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/app/actions/follow";
import Link from "next/link";
import Image from "next/image";

interface UserFollowCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  initialIsFollowing?: boolean;
  currentUserId?: string;
  showUnfollowButton?: boolean;
}

export function UserFollowCard({ user, initialIsFollowing = false, currentUserId, showUnfollowButton = false }: UserFollowCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);

  const handleToggleFollow = () => {
    if (!currentUserId) {
      window.location.href = "/login?callbackURL=" + window.location.pathname;
      return;
    }
    // Optimistic update
    const newValue = !isFollowing;
    setIsFollowing(newValue);

    startTransition(async () => {
      try {
        if (newValue) {
          await followUser(user.id);
        } else {
          await unfollowUser(user.id);
        }
      } catch (error) {
        console.error("Error toggling follow:", error);
        // Revert optimistic update on error
        setIsFollowing(!newValue);
      }
    });
  };

  const rawUsername = user.username || user.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = user.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;
  const initials = (user.name?.[0] || rawUsername[0] || "U").toUpperCase();

  return (
    <div className="flex items-center justify-between py-2">
      <Link href={`/Profile/${user.username || user.id}`} className="flex items-center gap-3 group">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-bold text-emerald-400 border border-zinc-800 group-hover:border-emerald-500/50 transition-colors">
          {user.image ? (
            <Image src={user.image} alt={name} width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-sm font-bold group-hover:underline">{name}</h3>
          <p className="text-xs text-zinc-500">{formattedHandle}</p>
        </div>
      </Link>

      {currentUserId !== user.id && (
        showUnfollowButton && isFollowing ? (
          <Button
            variant="outline"
            className="h-8 rounded-full px-4 text-xs font-bold transition-all border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-black hover:border-red-500"
            onClick={handleToggleFollow}
            disabled={isPending}
          >
            Unfollow
          </Button>
        ) : (
          <Button
            variant={isFollowing ? "outline" : "default"}
            className={`h-8 rounded-full px-4 text-xs font-bold transition-all ${
              isFollowing
                ? "border-zinc-700 bg-transparent text-white hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
            onClick={handleToggleFollow}
            disabled={isPending}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {isFollowing ? (isHovered ? "Unfollow" : "Following") : "Follow"}
          </Button>
        )
      )}
    </div>
  );
}
