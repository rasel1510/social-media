"use client";

import { useState, useCallback } from "react";
import { FriendsGrid } from "./friends-grid";
import { ChatArea } from "./chat-area";
import { getOrCreateConversation } from "@/app/actions/message";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface MessagesLayoutProps {
  initialConversations: any[];
  currentUserId: string;
  friends: any[];
}

export function MessagesLayout({ initialConversations, currentUserId, friends }: MessagesLayoutProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = useCallback(async (friendId: string) => {
    setIsStartingChat(true);
    try {
      const res = await getOrCreateConversation(friendId);
      if (res.success && res.conversation) {
        // Check if conversation already in list (for metadata/real-time updates)
        setConversations(prev => {
          const exists = prev.find(c => c.id === res.conversation.id);
          if (!exists) {
            return [res.conversation, ...prev];
          }
          return prev;
        });
        
        setActiveConversation(res.conversation);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setIsStartingChat(false);
    }
  }, []);

  const handleMessageAdded = useCallback((msg: any) => {
    // Update conversation list with latest message
    setConversations(prev => {
      const newConvs = [...prev];
      const index = newConvs.findIndex(c => c.id === msg.conversationId);
      
      if (index !== -1) {
        const conv = { ...newConvs[index] };
        conv.lastMessage = msg.content;
        conv.lastMsgAt = msg.createdAt;
        // Move to top
        newConvs.splice(index, 1);
        newConvs.unshift(conv);
      }
      return newConvs;
    });
  }, []);

  return (
    <div className="flex h-full w-full bg-black overflow-hidden relative">
      {/* Main Grid View */}
      <FriendsGrid 
        friends={friends} 
        onStartChat={handleStartChat} 
        isStartingChat={isStartingChat}
      />

      {/* Chat Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black border-zinc-800 text-white p-0 overflow-hidden sm:max-w-2xl w-[95vw] h-[90vh] sm:h-[85vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] gap-0 rounded-2xl sm:rounded-3xl">
          <div className="sr-only">
            <DialogHeader>
              <DialogTitle>
                {activeConversation ? `Chat with ${activeConversation.user.name}` : "Chat"}
              </DialogTitle>
              <DialogDescription>
                Real-time conversation with {activeConversation?.user.name || "a friend"}.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0">
            {activeConversation ? (
              <ChatArea 
                key={activeConversation.id}
                conversationId={activeConversation.id}
                currentUserId={currentUserId}
                otherUser={activeConversation.user}
                onMessageAdded={handleMessageAdded}
                onClose={() => setIsModalOpen(false)}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay when starting chat */}
      {isStartingChat && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full border-b-2 border-emerald-500 animate-spin" />
            <p className="text-white font-medium animate-pulse">Initializing chat...</p>
          </div>
        </div>
      )}
    </div>
  );
}
