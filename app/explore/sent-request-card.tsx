"use client";

import Link from "next/link";
import { Clock, X, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { cancelFriendRequest } from "@/app/actions/friend";
import { toast } from "sonner";

interface SentRequestCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  createdAt: string; // Serialized date
}

export function SentRequestCard({ user, createdAt }: SentRequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);

  const rawUsername = user.username || user.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = user.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelFriendRequest(user.id);
      if (res.success) {
        setCancelled(true);
        toast.success(`Friend request to ${user.name} cancelled`);
      } else {
        toast.error(res.error || "Failed to cancel request");
      }
    });
  };

  const timeAgo = getTimeAgo(createdAt);

  if (cancelled) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition hover:border-zinc-700 hover:shadow-lg">
      <Link
        href={`/Profile/${user.username || user.id}`}
        className="block relative h-32 bg-gradient-to-br from-amber-900/40 via-zinc-800 to-amber-900/40 transition-all hover:brightness-110 duration-500"
      >
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="h-20 w-20 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-emerald-400 text-2xl shadow-xl transition-transform hover:scale-105 duration-500">
            {user.image ? (
              <img src={user.image} alt={name} className="h-full w-full object-cover" />
            ) : (
              name?.[0]?.toUpperCase() || "?"
            )}
          </div>
        </div>
      </Link>

      <div className="flex-1 px-6 pt-14 pb-6 flex flex-col items-center text-center">
        <Link
          href={`/Profile/${user.username || user.id}`}
          className="font-extrabold text-lg text-white hover:text-emerald-400 transition-colors line-clamp-1"
        >
          {name}
        </Link>
        <p className="text-sm text-zinc-500 line-clamp-1">{formattedHandle}</p>
        <p className="text-xs text-zinc-600 mt-2">Sent {timeAgo}</p>

        <div className="mt-4 w-full flex flex-col gap-2">
          <div className="w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-zinc-800 text-amber-400 border border-amber-500/20">
            <Clock className="h-3.5 w-3.5" />
            Request Pending
          </div>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 active:scale-[0.97] transition border border-zinc-700 hover:border-red-500/30 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4" />
                Cancel Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = new Date(date);
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return dateObj.toLocaleDateString();
}
