"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Edit, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

interface ConversationListProps {
  conversations: any[];
  activeId?: string;
  onSelect: (conv: any) => void;
  isMobile?: boolean;
  friends?: any[];
  onStartChat?: (friendId: string) => Promise<void>;
}

export function ConversationList({ conversations, activeId, onSelect, isMobile = false, friends = [], onStartChat }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);

  const filteredConversations = conversations.filter(c => 
    c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.user.username && c.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(friendSearch.toLowerCase()) || 
    (f.username && f.username.toLowerCase().includes(friendSearch.toLowerCase()))
  );

  const handleFriendSelect = async (friendId: string) => {
    if (!onStartChat) return;
    setIsStartingChat(true);
    await onStartChat(friendId);
    setIsStartingChat(false);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-black border-r border-zinc-800 w-full lg:w-[350px] shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Chats</h2>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-emerald-400 transition">
                <Edit className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
                <DialogDescription className="sr-only">
                  Start a new conversation with one of your friends.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search friends..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="w-full bg-zinc-900 border-none rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-hide">
                  {filteredFriends.length === 0 ? (
                    <div className="text-center p-4 text-zinc-500 text-sm">
                      {friendSearch ? "No friends found." : "You don't have any friends yet."}
                    </div>
                  ) : (
                    filteredFriends.map((friend) => (
                      <button
                        key={friend.id}
                        onClick={() => handleFriendSelect(friend.id)}
                        disabled={isStartingChat}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition text-left disabled:opacity-50"
                      >
                        <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-emerald-400 shrink-0">
                          {friend.image ? (
                            <img src={friend.image} alt={friend.name} className="h-full w-full object-cover" />
                          ) : (
                            friend.name?.[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">{friend.name}</h3>
                          {friend.username && (
                            <p className="text-xs text-zinc-500 truncate">@{friend.username}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border-none rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Active Friends List (Horizontal) */}
      {friends && friends.length > 0 && (
        <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => handleFriendSelect(friend.id)}
                disabled={isStartingChat}
                className="flex flex-col items-center gap-1 min-w-[60px] hover:opacity-80 transition disabled:opacity-50"
              >
                <div className="h-14 w-14 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-emerald-500/30 font-bold text-emerald-400 shrink-0">
                  {friend.image ? (
                    <img src={friend.image} alt={friend.name} className="h-full w-full object-cover" />
                  ) : (
                    friend.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <span className="text-[11px] text-zinc-400 truncate w-[60px] text-center">
                  {friend.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {filteredConversations.length === 0 ? (
          <div className="text-center p-4 text-zinc-500 text-sm mt-4">
            {searchQuery ? "No results found." : "No conversations yet."}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conv) => {
              const isActive = activeId === conv.id && !isMobile;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition text-left ${
                    isActive ? "bg-zinc-900/80" : "hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-emerald-400 shrink-0">
                      {conv.user.image ? (
                        <img src={conv.user.image} alt={conv.user.name} className="h-full w-full object-cover" />
                      ) : (
                        conv.user.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`text-[15px] truncate ${conv.unreadCount > 0 ? "font-bold text-white" : "font-medium text-zinc-200"}`}>
                        {conv.user.name}
                      </h3>
                      {conv.lastMsgAt && (
                        <span className="text-xs text-zinc-500 shrink-0 ml-2" suppressHydrationWarning>
                          {formatShortTime(new Date(conv.lastMsgAt))}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-white" : "text-zinc-500"}`}>
                        {conv.lastMessage || "Started a chat"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatShortTime(date: Date) {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
