"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Share2, Smile, Loader2, Send, Search, Users, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createShare } from "@/app/actions";
import { sendPostInMessage } from "@/app/actions/message";
import { getUserFriends } from "@/app/actions/friend";
import dynamic from 'next/dynamic';
import { authClient } from "@/lib/auth-client";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string | null;
    author: {
      username: string | null;
      name?: string;
    };
  };
  currentUser: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  onSuccess: () => void;
}

export function ShareDialog({ isOpen, onOpenChange, post, currentUser, onSuccess }: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<"feed" | "message">("feed");
  const [shareCaption, setShareCaption] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rawUsername = currentUser.username || currentUser.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const name = currentUser.name || "User";
  const formattedHandle = `@${name.replace(/\s+/g, '')}${shortUsername}`;
  const initials = name[0] || "?";

  useEffect(() => {
    if (isOpen && activeTab === "message" && friends.length === 0) {
      setIsLoadingFriends(true);
      const fetchFriends = async () => {
        try {
          const data = await getUserFriends(currentUser.id);
          setFriends(data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingFriends(false);
        }
      };
      fetchFriends();
    }
  }, [isOpen, activeTab, currentUser.id, friends.length]);

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.username && f.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const onEmojiClick = (emojiData: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    const newContent = before + emojiData.emoji + after;
    setShareCaption(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emojiData.emoji.length, start + emojiData.emoji.length);
    }, 0);
  };

  const handleShareToFeed = async () => {
    startTransition(async () => {
      try {
        const res = await createShare(post.id, shareCaption);
        if (res.success) {
          onSuccess();
          onOpenChange(false);
          setShareCaption("");
          setShowEmojiPicker(false);
          if (res.flagged) {
            toast.warning(res.warning || "Your share contains inappropriate language.");
          } else {
            toast.success("Shared to your feed!");
          }
        } else {
          toast.error(res.error || "Failed to share post");
          if (res.deleted) {
            await authClient.signOut();
            window.location.href = "/signup";
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to share post");
      }
    });
  };

  const handleSendToFriend = async (friendId: string) => {
    setSendingTo(friendId);
    try {
      const res = await sendPostInMessage(post.id, friendId);
      if (res.success) {
        toast.success("Sent to inbox!");
      } else {
        toast.error(res.error || "Failed to send");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px] rounded-3xl shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-500" />
            Share Post
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share this post to your feed or send it as a message to a friend.
          </DialogDescription>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex px-6 gap-6 border-b border-zinc-900">
          <button 
            onClick={() => setActiveTab("feed")}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "feed" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Your Feed
            </div>
            {activeTab === "feed" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("message")}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === "message" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send in Message
            </div>
            {activeTab === "message" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
          </button>
        </div>

        <div className="p-6">
          {activeTab === "feed" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 font-bold text-emerald-400 overflow-hidden shrink-0">
                  {currentUser.image ? (
                    <img src={currentUser.image} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm">{name}</p>
                  <p className="text-xs text-zinc-500">Posting to your timeline</p>
                </div>
              </div>

              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  placeholder="What's on your mind about this?"
                  className="min-h-[120px] bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/20 focus:border-emerald-500/50 resize-none rounded-2xl pr-10 text-sm"
                />
                <div className="absolute right-3 top-3">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`rounded-full p-1.5 transition ${showEmojiPicker ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800'}`}
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute top-full right-0 mt-2 z-50 shadow-2xl">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={"dark" as any}
                        autoFocusSearch={false}
                        width={300}
                        height={350}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-[350px] flex flex-col">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                {isLoadingFriends ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-10">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">{searchQuery ? "No friends found" : "Your friends will appear here"}</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-emerald-400 shrink-0">
                          {friend.image ? (
                            <img src={friend.image} alt={friend.name} className="h-full w-full object-cover" />
                          ) : (
                            friend.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{friend.name}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            {`@${friend.name.replace(/\s+/g, '')}${(friend.username || friend.id).substring(0, 3)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={sendingTo === friend.id ? "secondary" : "default"}
                        disabled={!!sendingTo}
                        onClick={() => handleSendToFriend(friend.id)}
                        className={`rounded-full px-4 h-8 text-xs font-bold transition-all ${sendingTo === friend.id ? "bg-zinc-800" : "bg-emerald-500 hover:bg-emerald-400 text-black"}`}
                      >
                        {sendingTo === friend.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Original Post Preview */}
          <div className="mt-4 rounded-2xl border border-zinc-900 p-4 bg-zinc-900/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-tight">Original Post</span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs font-bold text-zinc-400">@{post.author.username}</span>
            </div>
            <p className="text-sm text-zinc-300 line-clamp-2 italic leading-relaxed">"{post.content}"</p>
          </div>
        </div>

        {activeTab === "feed" && (
          <DialogFooter className="p-6 pt-0">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setShowEmojiPicker(false);
              }}
              className="text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onClick={handleShareToFeed}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-full px-8 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Share Now
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
