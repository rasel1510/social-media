"use client";

import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { acceptFriendRequest, rejectFriendRequest } from "@/app/actions/friend";
import { toast } from "sonner";

interface FriendRequestCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  createdAt: string; // Serialized date from server
}

export function FriendRequestCard({ user, createdAt }: FriendRequestCardProps) {
  const [isPendingAccept, startAccept] = useTransition();
  const [isPendingReject, startReject] = useTransition();
  const [status, setStatus] = useState<"pending" | "accepted" | "rejected">("pending");

  const rawUsername = user.username || user.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = user.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;

  const handleAccept = () => {
    startAccept(async () => {
      const res = await acceptFriendRequest(user.id);
      if (res.success) {
        setStatus("accepted");
        toast.success(`You and ${name} are now friends!`);
      } else {
        toast.error(res.error || "Failed to accept request");
      }
    });
  };

  const handleReject = () => {
    startReject(async () => {
      const res = await rejectFriendRequest(user.id);
      if (res.success) {
        setStatus("rejected");
        toast.success("Friend request removed");
      } else {
        toast.error(res.error || "Failed to remove request");
      }
    });
  };

  const timeAgo = getTimeAgo(createdAt);

  if (status === "rejected") {
    return null; // Hide the card after rejecting
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-500/5">
      <Link
        href={`/Profile/${user.username || user.id}`}
        className="block relative h-32 bg-gradient-to-br from-blue-900/40 via-zinc-800 to-purple-900/40 transition-all hover:brightness-110 duration-500"
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
        <p className="text-xs text-zinc-600 mt-2">{timeAgo}</p>

        {status === "accepted" ? (
          <div className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-400 flex items-center justify-center gap-2 border border-emerald-500/20">
            <Check className="h-4 w-4" />
            Friends
          </div>
        ) : (
          <div className="mt-4 w-full flex flex-col gap-2">
            <button
              onClick={handleAccept}
              disabled={isPendingAccept || isPendingReject}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition disabled:opacity-50"
            >
              {isPendingAccept ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={isPendingAccept || isPendingReject}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-[0.97] transition disabled:opacity-50"
            >
              {isPendingReject ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        )}
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
