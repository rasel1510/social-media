"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageInput } from "./message-input";
import { getMessages, markAsRead } from "@/app/actions/message";
import { Loader2, Info, X, Mic } from "lucide-react";
import { format } from "date-fns";
import { db } from "@/lib/firebase";
import { ref, onChildAdded } from "firebase/database";

interface ChatAreaProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
  onMessageAdded: (msg: any) => void;
  onClose?: () => void;
}

export function ChatArea({ conversationId, currentUserId, otherUser, onMessageAdded, onClose }: ChatAreaProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialMessages = async () => {
      setIsLoading(true);
      const data = await getMessages(conversationId);
      if (isMounted) {
        setMessages(data);
        if (data.length > 0) {
          setLastMessageId(data[data.length - 1].id);
        }
        setIsLoading(false);
        markAsRead(conversationId);
      }
    };
    
    fetchInitialMessages();
    
    return () => { isMounted = false; };
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time listener for new messages via Firebase
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = ref(db, `messages/${conversationId}`);
    
    // Listen for new messages
    const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // We convert string date back to Date object if needed, 
        // though chat-area seems to handle string dates fine via new Date()
        handleNewMessage(data);
      }
    });

    return () => unsubscribe();
  }, [conversationId]);

  const handleNewMessage = (newMessage: any) => {
    setMessages(prev => {
      if (prev.some(p => p.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
    setLastMessageId(newMessage.id);
    onMessageAdded(newMessage);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Link 
            href={`/Profile/${otherUser.username || otherUser.id}`}
            className="flex items-center gap-3 hover:bg-zinc-900 p-1.5 -ml-1.5 rounded-xl transition"
          >
            <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-emerald-400">
              {otherUser.image ? (
                <img src={otherUser.image} alt={otherUser.name} className="h-full w-full object-cover" />
              ) : (
                otherUser.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <div>
              <h2 className="font-bold text-white leading-tight">{otherUser.name}</h2>
              <p className="text-xs text-zinc-400">@{otherUser.username || "user"}</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button className="h-10 w-10 rounded-xl hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-emerald-400 transition-all duration-200">
            <Info className="h-5 w-5" />
          </button>
          
          {onClose && (
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-xl hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-200"
              title="Close Chat"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="h-24 w-24 rounded-full bg-zinc-900 overflow-hidden mb-4 border-4 border-zinc-800 flex items-center justify-center font-bold text-emerald-400 text-3xl">
              {otherUser.image ? (
                <img src={otherUser.image} alt={otherUser.name} className="h-full w-full object-cover" />
              ) : (
                otherUser.name?.[0]?.toUpperCase() || "?"
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{otherUser.name}</h3>
            <p className="text-zinc-500 text-sm max-w-xs">
              You are friends. Send a message to start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUserId;
              const showAvatar = !isMe && (index === messages.length - 1 || messages[index + 1]?.senderId === currentUserId);
              
              // Simple time grouping
              const msgDate = new Date(msg.createdAt);
              const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt) : null;
              const showTime = !prevMsgDate || (msgDate.getTime() - prevMsgDate.getTime() > 30 * 60 * 1000);

              return (
                <div key={msg.id} className="flex flex-col">
                  {showTime && (
                    <div className="text-center text-xs text-zinc-500 my-4" suppressHydrationWarning>
                      {format(msgDate, "MMM d, h:mm a")}
                    </div>
                  )}
                  <div className={`flex gap-2 max-w-[75%] ${isMe ? "self-end" : "self-start"}`}>
                    {!isMe && (
                      <div className="w-8 shrink-0 flex items-end pb-1">
                        {showAvatar && (
                          <div className="h-8 w-8 rounded-full bg-zinc-800 overflow-hidden">
                            {otherUser.image ? (
                              <img src={otherUser.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-bold text-emerald-400">
                                {otherUser.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words flex flex-col gap-2 ${
                        isMe 
                          ? "bg-emerald-500 text-black rounded-br-sm" 
                          : "bg-zinc-800 text-white rounded-bl-sm"
                      }`}
                    >
                      {msg.postId && msg.post && (
                        <div className={`mb-1 p-3 rounded-xl border flex flex-col gap-2 ${
                          isMe ? "bg-emerald-600/20 border-emerald-400/30" : "bg-black/20 border-zinc-700"
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                              {msg.post.author.image ? (
                                <img src={msg.post.author.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                  {msg.post.author.name?.[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="text-xs font-bold truncate">{msg.post.author.name}</span>
                          </div>
                          
                          {msg.post.content && (
                            <p className="text-xs line-clamp-3 opacity-90 italic">
                              {msg.post.content}
                            </p>
                          )}
                          
                          {msg.post.image && (
                            <div className="rounded-lg overflow-hidden border border-white/5 max-h-32">
                              <img src={msg.post.image} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <Link 
                            href={`/Post/${msg.postId}`}
                            className={`text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded-md self-start transition ${
                              isMe ? "bg-emerald-400 text-black hover:bg-white" : "bg-zinc-700 text-white hover:bg-emerald-500 hover:text-black"
                            }`}
                          >
                            View Post
                          </Link>
                        </div>
                      )}
                      {msg.audioUrl && (
                        <div className={`mb-2 p-2 rounded-xl flex items-center gap-3 min-w-[200px] ${
                          isMe ? "bg-emerald-600/30" : "bg-black/40"
                        }`}>
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                            isMe ? "bg-emerald-400 text-black" : "bg-emerald-500 text-black"
                          }`}>
                            <Mic className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <audio 
                              src={msg.audioUrl} 
                              controls 
                              className={`h-8 w-full max-w-[240px] custom-audio-player ${
                                isMe ? "brightness-110 contrast-125" : ""
                              }`}
                            />
                          </div>
                        </div>
                      )}
                      
                      {msg.imageUrl && (
                        <div className="mb-2 max-w-[240px] sm:max-w-[300px] rounded-xl overflow-hidden border border-white/10 bg-black/20">
                          <img src={msg.imageUrl} alt="Shared image" className="w-full h-auto object-cover" />
                        </div>
                      )}
                      
                      {msg.content && <span>{msg.content}</span>}
                    </div>
                  </div>
                  
                  {isMe && index === messages.length - 1 && msg.isRead && (
                    <div className="text-xs text-zinc-500 self-end mt-1 mr-2">Seen</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput conversationId={conversationId} onMessageSent={handleNewMessage} />
    </div>
  );
}
