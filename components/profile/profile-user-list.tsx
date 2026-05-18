"use client";

import { useEffect, useState } from "react";
import { getUserFollowers, getUserFollowing, checkMultipleFollowStatus } from "@/app/actions/follow";
import { UserFollowCard } from "@/components/user-follow-card";
import { Loader2, Search } from "lucide-react";

interface ProfileUserListProps {
  userId: string;
  type: "followers" | "following";
  currentUserId?: string;
}

export function ProfileUserList({ userId, type, currentUserId }: ProfileUserListProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (user.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        let fetchedUsers = [];
        if (type === "followers") {
          fetchedUsers = await getUserFollowers(userId);
        } else {
          fetchedUsers = await getUserFollowing(userId);
        }

        // Batch check follow state for all users to avoid N+1 queries
        let followMap: Record<string, boolean> = {};
        if (currentUserId && fetchedUsers.length > 0) {
          const userIds = fetchedUsers.map(u => u.id);
          followMap = await checkMultipleFollowStatus(userIds);
        }
        
        const usersWithFollowState = fetchedUsers.map((user) => ({
          ...user,
          isFollowing: followMap[user.id] || false,
        }));

        setUsers(usersWithFollowState);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [userId, type, currentUserId]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </div>
      
      <div className="divide-y divide-zinc-800 p-4">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <UserFollowCard 
              key={user.id} 
              user={user} 
              initialIsFollowing={user.isFollowing} 
              currentUserId={currentUserId}
              showUnfollowButton={type === "following"}
            />
          ))
        ) : (
          <div className="py-8 text-center text-zinc-500">
            <p>No users match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
