"use client";

import { useState, useTransition } from "react";
import { Calendar, Camera, ArrowLeft, Loader2 } from "lucide-react";
import type { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser } from "@/app/actions/follow";
import { sendFriendRequest, acceptFriendRequest, cancelFriendRequest, removeFriend, FriendStatus } from "@/app/actions/friend";
import { updateUserProfileImage, updateUserCoverImage } from "@/app/actions";
import { useUploadThing } from "@/lib/uploadthing";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ProfileUserList } from "./profile-user-list";
import { ProfileFriendsList } from "./profile-friends-list";

interface UserWithCount {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  coverImage: string | null;
  createdAt: Date | string;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
    friendships1?: number;
    friendships2?: number;
  };
}

interface ProfileHeaderProps {
  user: UserWithCount;
  isOwnProfile: boolean;
  initialIsFollowing?: boolean;
  initialFriendStatus?: FriendStatus;
  currentUserId?: string;
}

export function ProfileHeader({ user, isOwnProfile, initialIsFollowing = false, initialFriendStatus = "NONE", currentUserId }: ProfileHeaderProps) {
  const router = useRouter();
  const rawUsername = user.username || user.id || "";
  const shortUsername = rawUsername.length > 3 ? rawUsername.substring(0, 3) : rawUsername;
  const displayName = user.name || "User";
  const formattedHandle = `@${displayName.replace(/\s+/g, '')}${shortUsername}`;
  const initials = (user.name?.[0] || rawUsername[0] || "U").toUpperCase();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>(initialFriendStatus);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following" | "friends">("followers");

  const openModal = (type: "followers" | "following" | "friends") => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleToggleFollow = () => {
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
        setIsFollowing(!newValue);
      }
    });
  };

  const handleFriendAction = () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    startTransition(async () => {
      try {
        if (friendStatus === "NONE") {
          await sendFriendRequest(user.id);
          setFriendStatus("PENDING_SENT");
        } else if (friendStatus === "PENDING_SENT") {
          await cancelFriendRequest(user.id);
          setFriendStatus("NONE");
        } else if (friendStatus === "PENDING_RECEIVED") {
          await acceptFriendRequest(user.id);
          setFriendStatus("FRIENDS");
        } else if (friendStatus === "FRIENDS") {
          await removeFriend(user.id);
          setFriendStatus("NONE");
        }
      } catch (error) {
        console.error("Error handling friend action:", error);
      }
    });
  };

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      const url = res?.[0].url;
      if (url) {
        await updateUserProfileImage(url);
        toast.success("Profile picture updated!");
        router.refresh();
      }
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleImageClick = () => {
    if (isOwnProfile && !isUploading) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          startUpload([file]);
        }
      };
      input.click();
    }
  };

  const { startUpload: startCoverUpload, isUploading: isUploadingCover } = useUploadThing("imageUploader", {
    onClientUploadComplete: async (res) => {
      const url = res?.[0].url;
      if (url) {
        await updateUserCoverImage(url);
        toast.success("Cover photo updated!");
        router.refresh();
      }
    },
    onUploadError: (error) => {
      toast.error(`Cover upload failed: ${error.message}`);
    },
  });

  const handleCoverClick = () => {
    if (isOwnProfile && !isUploadingCover) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          startCoverUpload([file]);
        }
      };
      input.click();
    }
  };

  return (
    <div className="relative border-b border-zinc-800">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 flex items-center gap-6 bg-black/80 px-4 py-2 backdrop-blur-md">
        <button 
          onClick={() => router.back()}
          className="rounded-full p-2 hover:bg-zinc-900 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{displayName}</h2>
          <p className="text-xs text-zinc-500">{user._count?.posts || 0} posts</p>
        </div>
      </div>

      {/* Cover Image */}
      <div 
        onClick={handleCoverClick}
        className={`h-48 w-full bg-gradient-to-r from-emerald-900/40 via-zinc-900 to-emerald-900/40 lg:h-64 relative group overflow-hidden ${isOwnProfile ? "cursor-pointer" : ""}`}
      >
        {user.coverImage ? (
           <Image src={user.coverImage} alt="Cover" fill className="object-cover" />
        ) : null}
        
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           {isOwnProfile && (
             isUploadingCover ? (
                <Loader2 className="text-white h-8 w-8 animate-spin" />
             ) : (
                <Camera className="text-white h-8 w-8" />
             )
           )}
        </div>

        {isUploadingCover && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <Loader2 className="text-emerald-500 h-10 w-10 animate-spin" />
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-4 pb-4">
        <div className="relative -mt-16 mb-4 flex items-end justify-between lg:-mt-20">
          <div 
            onClick={handleImageClick}
            className={`relative h-32 w-32 rounded-full border-4 border-black bg-zinc-900 lg:h-40 lg:w-40 overflow-hidden shadow-2xl ${isOwnProfile ? "cursor-pointer group" : ""}`}
          >
            {user.image ? (
              <Image src={user.image} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-4xl font-bold text-emerald-400 uppercase">
                {initials}
              </div>
            )}
            
            {isOwnProfile && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="text-white h-8 w-8 animate-spin" />
                ) : (
                  <Camera className="text-white h-6 w-6" />
                )}
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <Loader2 className="text-emerald-500 h-10 w-10 animate-spin" />
              </div>
            )}
          </div>

          <div className="mb-2 flex gap-2">
            {isOwnProfile ? (
              <button className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-bold transition hover:bg-zinc-900">
                Edit Profile
              </button>
            ) : (
              <>
                <Button
                  variant={friendStatus === "NONE" ? "default" : "outline"}
                  className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                    friendStatus === "NONE"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
                  }`}
                  onClick={handleFriendAction}
                  disabled={isPending}
                >
                  {friendStatus === "NONE" && "Add Friend"}
                  {friendStatus === "PENDING_SENT" && "Cancel Request"}
                  {friendStatus === "PENDING_RECEIVED" && "Accept Request"}
                  {friendStatus === "FRIENDS" && "Friends"}
                </Button>
                
                <Button
                  variant={isFollowing ? "outline" : "secondary"}
                  className={`rounded-full px-6 py-2 text-sm font-bold transition ${
                    isFollowing
                      ? "border-zinc-700 bg-transparent text-white hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                  onClick={handleToggleFollow}
                  disabled={isPending}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">{displayName}</h1>
          <p className="text-zinc-500">{formattedHandle}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          {/* Add placeholders for location/website if needed */}
        </div>

        <div className="mt-4 flex gap-6">
          <div 
            onClick={() => openModal("friends")}
            className="flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span className="font-bold text-white">{(user._count?.friendships1 || 0) + (user._count?.friendships2 || 0)}</span>
            <span className="text-zinc-500">Friends</span>
          </div>
          <div 
            onClick={() => openModal("following")}
            className="flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span className="font-bold text-white">{user._count?.following || 0}</span>
            <span className="text-zinc-500">Following</span>
          </div>
          <div 
            onClick={() => openModal("followers")}
            className="flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span className="font-bold text-white">{user._count?.followers || 0}</span>
            <span className="text-zinc-500">Followers</span>
          </div>
        </div>
      </div>

      {/* Followers/Following/Friends Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-zinc-800">
          <DialogHeader className="p-0 border-b border-zinc-800">
            <DialogTitle className="sr-only">
              Connections
            </DialogTitle>
            <DialogDescription className="sr-only">
              View your friends, followers, and following lists.
            </DialogDescription>
            <div className="flex">
              <button
                onClick={() => setModalType("friends")}
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                  modalType === "friends" ? "text-white" : "text-zinc-500 hover:bg-zinc-900"
                }`}
              >
                Friends
                {modalType === "friends" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setModalType("followers")}
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                  modalType === "followers" ? "text-white" : "text-zinc-500 hover:bg-zinc-900"
                }`}
              >
                Followers
                {modalType === "followers" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setModalType("following")}
                className={`flex-1 py-4 text-sm font-bold transition-all relative ${
                  modalType === "following" ? "text-white" : "text-zinc-500 hover:bg-zinc-900"
                }`}
              >
                Following
                {modalType === "following" && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-t-full" />
                )}
              </button>
            </div>
          </DialogHeader>
          <div className="max-h-[70vh] min-h-[40vh] overflow-y-auto scrollbar-hide">
            {modalType === "friends" ? (
              <div className="p-2">
                <ProfileFriendsList userId={user.id} />
              </div>
            ) : (
              <ProfileUserList 
                userId={user.id} 
                type={modalType} 
                currentUserId={currentUserId} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
