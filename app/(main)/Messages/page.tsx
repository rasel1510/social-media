import { MainLayout } from "@/components/main-layout";
import { getConversations } from "@/app/actions/message";
import { getUserFriends } from "@/app/actions/friend";
import { getCurrentSession } from "@/lib/session";
import { MessagesLayout } from "./messages-layout";
import { redirect } from "next/navigation";

export default async function MessagesPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [conversations, friends] = await Promise.all([
    getConversations(),
    getUserFriends(session.user.id),
  ]);

  return (
    <div className="h-full flex flex-col w-full bg-black -mt-[1px]">
      <MessagesLayout 
        initialConversations={conversations} 
        currentUserId={session.user.id} 
        friends={friends}
      />
    </div>
  );
}
