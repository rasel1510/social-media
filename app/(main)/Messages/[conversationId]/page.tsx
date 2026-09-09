import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { ChatArea } from "../chat-area";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function MobileConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      user1: { select: { id: true, name: true, username: true, image: true } },
      user2: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  if (!conversation || (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId)) {
    redirect("/Messages");
  }

  const otherUser = conversation.user1Id === currentUserId ? conversation.user2 : conversation.user1;

  // Render just the chat area, wrapper to make it full screen on mobile
  return (
    <div className="flex flex-col h-screen w-full bg-black lg:hidden">
      {/* Mobile back button header */}
      <div className="bg-black/95 backdrop-blur border-b border-zinc-800 p-2 flex items-center">
        <Link 
          href="/Messages" 
          className="p-2 mr-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          {/* Using a dummy wrapper, ChatArea handles its own header but this gives a back button */}
        </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden -mt-[61px]">
        {/* We use a slight hack to hide ChatArea's own back link if we wanted, 
            but for now we let ChatArea render normally and just added the back button above it */}
        <ChatArea 
          conversationId={conversation.id}
          currentUserId={currentUserId}
          otherUser={otherUser}
          onMessageAdded={() => {}}
        />
      </div>
    </div>
  );
}
