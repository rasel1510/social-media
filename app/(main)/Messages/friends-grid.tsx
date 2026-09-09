"use client";

import { Search, MessageSquare, MoreHorizontal, User } from "lucide-react";
import { useState } from "react";

interface Friend {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface FriendsGridProps {
  friends: Friend[];
  onStartChat: (friendId: string) => void;
  isStartingChat?: boolean;
}

export function FriendsGrid({ friends, onStartChat, isStartingChat }: FriendsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.username && f.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Header with Search */}
      <div className="p-6 md:p-8 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Messages</h1>
            <p className="text-zinc-500 mt-1">Chat with your friends and stay connected.</p>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        {/* Section title */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Your Friends</span>
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent"></div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 scrollbar-hide">
        {filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-16 w-16 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-4">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No friends found</h3>
            <p className="text-zinc-500 text-sm mt-1">Try searching for someone else or add more friends.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => !isStartingChat && onStartChat(friend.id)}
                className="group relative bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/50 hover:border-emerald-500/30 rounded-2xl p-4 transition-all duration-300 cursor-pointer flex items-center gap-4 overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Avatar Section */}
                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-full bg-zinc-800 p-0.5 ring-2 ring-zinc-800 group-hover:ring-emerald-500/50 transition-all duration-300 overflow-hidden flex items-center justify-center shadow-lg">
                    {friend.image ? (
                      <img src={friend.image} alt={friend.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <span className="text-xl font-black text-emerald-400">
                        {friend.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Status Indicator */}
                  <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-lg ring-2 ring-emerald-500/10"></div>
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0 relative z-10">
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {friend.name}
                  </h3>
                  <p className="text-zinc-500 text-xs truncate">
                    @{friend.username || "user"}
                  </p>
                </div>

                {/* Action Section */}
                <div className="hidden sm:flex items-center gap-4 relative z-10">
                  <button
                    className="py-2 px-6 bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-black font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 group/btn whitespace-nowrap"
                  >
                    <MessageSquare className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
                    <span>Message</span>
                  </button>
                  
                  <button className="p-2 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Chevron/Action */}
                <div className="sm:hidden text-zinc-700">
                   <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
