"use client";

import { useEffect, useState, useTransition } from "react";
import { getNotifications, markNotificationsAsRead } from "@/app/actions";
import { acceptFriendRequest, rejectFriendRequest } from "@/app/actions/friend";
import { Loader2, Heart, MessageCircle, Share2, Reply, Bell, UserPlus, Check, X as XIcon, AtSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface NotificationListProps {
  initialNotifications: any[];
}


function FriendRequestItem({ notification, onActionComplete }: { notification: any, onActionComplete: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [actionTaken, setActionTaken] = useState<"accepted" | "rejected" | null>(null);

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await acceptFriendRequest(notification.actorId);
      setActionTaken("accepted");
      onActionComplete();
    });
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await rejectFriendRequest(notification.actorId);
      setActionTaken("rejected");
      onActionComplete();
    });
  };

  return (
    <div className="mt-3 flex gap-2">
      {actionTaken ? (
        <p className="text-sm text-zinc-500 italic">
          Request {actionTaken}
        </p>
      ) : (
        <>
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-1.5 px-3 rounded-lg text-sm font-bold transition flex justify-center items-center gap-1 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Accept</>}
          </button>
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 px-3 rounded-lg text-sm font-bold transition flex justify-center items-center gap-1 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XIcon className="h-4 w-4" /> Reject</>}
          </button>
        </>
      )}
    </div>
  );
}

type TabType = "all" | "mentions";

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    // Mark notifications as read when the page is opened
    const markAsRead = async () => {
      await markNotificationsAsRead();
    };
    markAsRead();
  }, []);

  const allNotifications = notifications.filter((n) => n.type !== "MENTION");
  const mentionNotifications = notifications.filter((n) => n.type === "MENTION");

  const filteredNotifications = activeTab === "mentions"
    ? mentionNotifications
    : allNotifications;

  const hasUnreadAll = allNotifications.some((n) => !n.isRead);
  const hasUnreadMentions = mentionNotifications.some((n) => !n.isRead);

  const getIcon = (type: string) => {
    switch (type) {
      case "LIKE": return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case "COMMENT": return <MessageCircle className="h-4 w-4 text-blue-500 fill-blue-500" />;
      case "REPLY": return <Reply className="h-4 w-4 text-emerald-500" />;
      case "SHARE": return <Share2 className="h-4 w-4 text-emerald-500" />;
      case "FRIEND_REQUEST": return <UserPlus className="h-4 w-4 text-blue-400" />;
      case "MENTION": return <AtSign className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getMessage = (notification: any) => {
    switch (notification.type) {
      case "LIKE": return "liked your post";
      case "COMMENT": return "commented on your post";
      case "REPLY": return "replied to your comment";
      case "SHARE": return "shared your post";
      case "FRIEND_REQUEST": return "sent you a friend request";
      case "MENTION": return notification.commentId ? "mentioned you in a comment" : "mentioned you in a post";
      default: return "interacted with you";
    }
  };

  return (
    <div className="flex-1">
      {/* Unified Sticky Header — Title + Tabs */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md">
        <div className="px-4 pt-3 pb-0">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
        </div>
        <div className="flex mt-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 relative py-3 text-sm font-bold transition-colors hover:bg-zinc-900/60 ${activeTab === "all" ? "text-white" : "text-zinc-500"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              All
              {hasUnreadAll && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </span>
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("mentions")}
            className={`flex-1 relative py-3 text-sm font-bold transition-colors hover:bg-zinc-900/60 ${activeTab === "mentions" ? "text-white" : "text-zinc-500"}`}
          >
            <span className="inline-flex items-center gap-1.5">
              Mentions
              {hasUnreadMentions && <span className="h-2 w-2 rounded-full bg-purple-500" />}
            </span>
            {activeTab === "mentions" && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>
        <div className="h-px bg-zinc-800" />
      </div>

      {/* Notification Items */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            {activeTab === "mentions" ? (
              <AtSign className="h-8 w-8 text-zinc-700" />
            ) : (
              <Bell className="h-8 w-8 text-zinc-700" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {activeTab === "mentions" ? "No mentions yet" : "No notifications yet"}
          </h3>
          <p className="text-zinc-500 max-w-xs">
            {activeTab === "mentions"
              ? "When someone mentions you in a post or comment, you'll see it here."
              : "When people like, comment on, or share your posts, you'll see them here."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {filteredNotifications.map((notification) => {
            const content = (
              <div
                className={`flex gap-3 p-4 hover:bg-zinc-900/50 transition cursor-pointer group ${!notification.isRead ? 'bg-emerald-500/5' : ''}`}
              >
                {/* Actor Avatar */}
                <Link
                  href={`/Profile/${notification.actor.username || notification.actorId}`}
                  className="shrink-0 pt-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                    {notification.actor.image ? (
                      <img src={notification.actor.image} alt={notification.actor.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-emerald-400">
                        {notification.actor.name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        {getIcon(notification.type)}
                        <p className="text-sm text-zinc-400">
                          <span className="font-bold text-white group-hover:underline">
                            {notification.actor.name || notification.actor.username}
                          </span>{" "}
                          {getMessage(notification)}
                        </p>
                      </div>

                      {notification.post?.content && (
                        <p className="text-sm text-zinc-500 line-clamp-2 italic mb-1 px-2 border-l-2 border-zinc-800">
                          &quot;{notification.post.content}&quot;
                        </p>
                      )}

                      <span className="text-xs text-zinc-600 mt-1 block">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>

                      {notification.type === "FRIEND_REQUEST" && (
                        <FriendRequestItem
                          notification={notification}
                          onActionComplete={() => {
                            // Optional: remove notification from list or leave it as "accepted"
                          }}
                        />
                      )}
                    </div>

                    {!notification.isRead && (
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );

            const handleNavigate = () => {
              if (notification.type === "FRIEND_REQUEST") {
                router.push(`/Profile/${notification.actor.username || notification.actorId}`);
                return;
              }
              if (notification.postId) {
                router.push(`/Post/${notification.postId}`);
              }
            };

            return (
              <div key={notification.id} onClick={handleNavigate}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}







