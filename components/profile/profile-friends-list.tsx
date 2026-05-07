"use client";

import { useEffect, useState } from "react";
import { getUserFriends, removeFriend } from "@/app/actions/friend";
import { Loader2, User as UserIcon, UserMinus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Friend {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface ProfileFriendsListProps {
  userId: string;
  currentUserId?: string;
}

export function ProfileFriendsList({ userId, currentUserId }: ProfileFriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isUnfriending, setIsUnfriending] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        const data = await getUserFriends(userId);
        setFriends(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  const handleUnfriend = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    setIsUnfriending(friendId);
    try {
      const res = await removeFriend(friendId);
      if (res.success) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
        toast.success("Friend removed");
      } else {
        toast.error(res.error || "Failed to remove friend");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUnfriending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-500">Loading friends...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
          <UserIcon className="h-8 w-8 text-zinc-700" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No friends yet</h3>
        <p className="text-zinc-500">When they add friends, they&apos;ll show up here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-zinc-800 p-2">
      {friends.map((friend) => {
        const rawUsername = friend.username || friend.id || "";
        const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
        const name = friend.name || "User";
        const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;

        return (
          <div key={friend.id} className="flex items-center justify-between py-4 px-2 hover:bg-zinc-900/50 transition-colors">
            <Link href={`/Profile/${friend.username || friend.id}`} className="flex items-center gap-4 flex-1 min-w-0 group">
              <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-800 bg-zinc-800 flex items-center justify-center font-bold text-emerald-400 text-base relative shrink-0 group-hover:border-emerald-500/50 transition-colors">
                {friend.image ? (
                  <Image src={friend.image} alt={friend.name} fill className="object-cover" />
                ) : (
                  friend.name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-white group-hover:underline truncate text-sm sm:text-base">
                  {name}
                </span>
                <span className="text-xs text-zinc-500 truncate">
                  {formattedHandle}
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2">

              <button
                onClick={() => router.push(`/Profile/${friend.username || friend.id}`)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-full transition"
              >
                View
              </button>

              {userId === currentUserId && (
                <button
                  onClick={() => handleUnfriend(friend.id)}
                  disabled={isUnfriending === friend.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-full transition-all disabled:opacity-50"
                  title="Unfriend"
                >
                  {isUnfriending === friend.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <UserMinus className="h-3 w-3" />
                  )}
                  <span>Unfriend</span>
                </button>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}



