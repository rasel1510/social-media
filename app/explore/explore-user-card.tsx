"use client";

import Link from "next/link";
import { UserPlus, X, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { sendFriendRequest } from "@/app/actions/friend";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ExploreUserCardProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  currentUserId?: string;
}

export function ExploreUserCard({ user, currentUserId }: ExploreUserCardProps) {
  const [isPending, startTransition] = useTransition();
  const [requestSent, setRequestSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const handleAddFriend = () => {
    if (!currentUserId) {
      router.push("/login?callbackURL=/explore");
      return;
    }

    startTransition(async () => {
      const res = await sendFriendRequest(user.id);
      if (res.success) {
        setRequestSent(true);
        toast.success(`Friend request sent to ${user.name}`);
      } else {
        toast.error(res.error || "Failed to send request");
      }
    });
  };

  const rawUsername = user.username || user.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = user.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;

  if (dismissed) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col transition hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-500/5 relative group">
      {/* Dismiss button (top-right corner, like Facebook's X) */}
      {!requestSent && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition opacity-0 group-hover:opacity-100"
          title="Remove suggestion"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <Link
        href={`/Profile/${user.username || user.id}`}
        className="block relative h-32 bg-gradient-to-br from-emerald-900/60 via-zinc-800 to-emerald-900/60 transition-all group-hover:scale-105 duration-500"
      >
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="h-20 w-20 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-emerald-400 text-2xl shadow-xl transition-transform group-hover:scale-110 duration-500">
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
        <p className="text-sm text-zinc-500 mb-6 line-clamp-1">{formattedHandle}</p>

        <div className="mt-auto w-full">
          <button
            onClick={handleAddFriend}
            disabled={isPending || requestSent}
            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
              requestSent
                ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-[0.97]"
            }`}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : requestSent ? (
              "Request Sent ✓"
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Add Friend
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
