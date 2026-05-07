"use client";

import React, { useState, useEffect } from "react";

import {
  BellIcon,
  CompassIcon,
  Home as HomeIcon,
  MailIcon,
  Terminal,
  UserIcon,
  LogOut,
  LogIn
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User } from "@/lib/auth-types";
import { toast } from "sonner";
import { getUnreadCount } from "@/app/actions/message";
import { getUnreadNotificationCount } from "@/app/actions";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as User | undefined;
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) {
      const updateCounts = async () => {
        try {
          const [unread, notifications] = await Promise.all([
            getUnreadCount(),
            getUnreadNotificationCount()
          ]);
          setUnreadCount(unread);
          setNotificationCount(notifications);
        } catch (error) {
          console.error("Error updating counts:", error);
        }
      };

      updateCounts();
      const interval = setInterval(() => {
        if (session?.user?.id) {
          updateCounts();
        }
      }, 15000);
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setNotificationCount(0);
    }
  }, [session?.user?.id]);

  // Facebook-style security: Prevent back-button from showing cached authenticated content after logout
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // If the page was loaded from the back/forward cache, refresh it
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          // Force a full page reload to clear all states and prevent 'back' button cache issues
          window.location.replace("/login");
        },
      },
    });
  };

  // Logic to handle restricted "Post" access
  const handlePostRedirect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session) {
      e.preventDefault(); // Stop the <Link> from navigating directly
      router.push("/login?callbackURL=/Post/new");
    }
  };

  const handleAuthRedirect = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!session) {
      e.preventDefault();
      router.push(`/login?callbackURL=${target}`);
    }
  };

  const handleProfileRedirect = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session) {
      e.preventDefault();
      router.push("/login?callbackURL=/Profile");
    }
  };

  return (
    <aside className="hidden lg:col-span-3 lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-zinc-800 lg:px-5 lg:py-5 h-full">
      <div>
        <Link href="/home" className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500 text-emerald-400">
          <Terminal className="h-5 w-5" />
        </Link>

        <nav className="space-y-1">
          <Link
            href="/home"
            className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left transition hover:bg-zinc-900 ${pathname === "/home" ? "text-emerald-400" : "text-white"}`}
          >
            <HomeIcon className="h-6 w-6" />
            Home
          </Link>

          <Link
            href="/explore"
            onClick={(e) => handleAuthRedirect(e, "/explore")}
            className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left transition hover:bg-zinc-900 ${pathname === "/explore" ? "text-emerald-400" : "text-white"}`}
          >
            <CompassIcon className="h-6 w-6" />
            Explore
          </Link>

          <Link
            href="/notifications"
            onClick={(e) => handleAuthRedirect(e, "/notifications")}
            className={`flex w-full items-center justify-between rounded-full px-4 py-3 text-left transition hover:bg-zinc-900 ${pathname === "/notifications" ? "text-emerald-400" : "text-white"}`}
          >
            <div className="flex items-center gap-3">
              <BellIcon className="h-6 w-6" />
              <span>Notifications</span>
            </div>
            {notificationCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-black">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>

          <Link
            href="/Messages"
            onClick={(e) => handleAuthRedirect(e, "/Messages")}
            className={`flex w-full items-center justify-between rounded-full px-4 py-3 text-left transition hover:bg-zinc-900 ${pathname === "/Messages" || pathname.startsWith("/Messages/") ? "text-emerald-400" : "text-white"}`}
          >
            <div className="flex items-center gap-3">
              <MailIcon className="h-6 w-6" />
              <span>Messages</span>
            </div>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-black">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href={session ? `/Profile/${user?.username || session.user.id}` : "/Profile"}
            onClick={handleProfileRedirect}
            className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left transition hover:bg-zinc-900 ${pathname.startsWith("/Profile") ? "text-emerald-400" : "text-white"}`}
          >
            <UserIcon className="h-6 w-6" />
            Profile
          </Link>
        </nav>

        {/* Updated Post Button with click handler */}
        <Link href="/Post/new" onClick={handlePostRedirect}>
          <button className="mt-6 w-full rounded-full bg-emerald-500 py-3 text-lg font-bold text-black transition hover:bg-emerald-400">
            Post
          </button>
        </Link>
      </div>

      <div className="mt-auto">
        {(mounted && !isPending) && (
          session ? (
            <div className="flex items-center justify-between rounded-full p-3 transition hover:bg-zinc-900 group relative">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-emerald-400 uppercase overflow-hidden">
                  {session.user.image ? (
                    <Image src={session.user.image} alt="User" width={44} height={44} className="h-full w-full object-cover" />
                  ) : (
                    session.user.name?.[0] || "?"
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold truncate">
                    {session.user.name} ({ (user?.username || session.user.email.split('@')[0]).substring(0, 3) })
                  </h3>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 text-zinc-500 hover:text-red-400 transition"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-3 rounded-full p-3 transition hover:bg-zinc-900 text-emerald-400 font-bold">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                <LogIn className="h-6 w-6" />
              </div>
              <span>Sign In</span>
            </Link>
          )
        )}
      </div>
    </aside>
  );
}