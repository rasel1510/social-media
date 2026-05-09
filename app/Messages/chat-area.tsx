"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageInput } from "./message-input";
import { getMessages, markAsRead, reactToMessage, deleteMessageForMe, deleteMessageForEveryone, getConversations, sendMessage } from "@/app/actions/message";
import { Loader2, Info, X, Mic, MoreVertical, Copy, Reply as ReplyIcon, Edit2, Forward, SmilePlus, Trash2, Ban } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { ref, onChildAdded, onChildChanged } from "firebase/database";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

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

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function ChatArea({ conversationId, currentUserId, otherUser, onMessageAdded, onClose }: ChatAreaProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // State for advanced features
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [forwardingMessage, setForwardingMessage] = useState<any>(null);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [forwardingTo, setForwardingTo] = useState<string | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial messages
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialMessages = async () => {
      setIsLoading(true);
      const data = await getMessages(conversationId);
      if (isMounted) {
        setMessages(data);
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

  // Real-time listener for new messages and edits via Firebase
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = ref(db, `messages/${conversationId}`);
    
    const unsubscribeAdded = onChildAdded(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        handleIncomingMessage(data);
      }
    });

    const unsubscribeChanged = onChildChanged(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        handleIncomingMessage(data);
      }
    });

    return () => {
      unsubscribeAdded();
      unsubscribeChanged();
    };
  }, [conversationId]);

  const handleIncomingMessage = (newMessage: any) => {
    setMessages(prev => {
      const existsIndex = prev.findIndex(p => p.id === newMessage.id);
      if (existsIndex >= 0) {
        const newArray = [...prev];
        newArray[existsIndex] = newMessage;
        return newArray;
      }
      return [...prev, newMessage];
    });
    onMessageAdded(newMessage);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    // Optimistic update could go here, but Firebase is fast
    await reactToMessage(messageId, emoji);
  };

  const handleDeleteForMe = async (messageId: string) => {
    setIsDeleting(true);
    const result = await deleteMessageForMe(messageId);
    if (result.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success("Message deleted for you");
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
    setDeletingMessage(null);
  };

  const handleDeleteForEveryone = async (messageId: string) => {
    setIsDeleting(true);
    const result = await deleteMessageForEveryone(messageId);
    if (result.success) {
      toast.success("Message deleted for everyone");
    } else {
      toast.error(result.error);
    }
    setIsDeleting(false);
    setDeletingMessage(null);
  };

  useEffect(() => {
    if (forwardingMessage) {
      getConversations().then(setRecentConversations);
    }
  }, [forwardingMessage]);

  const handleForward = async (targetConvId: string) => {
    if (forwardingTo) return;
    setForwardingTo(targetConvId);
    const result = await sendMessage(
      targetConvId,
      forwardingMessage.content || "",
      forwardingMessage.audioUrl,
      forwardingMessage.imageUrl,
      undefined,
      true
    );
    if (result.success) {
      toast.success("Message forwarded");
      setForwardingMessage(null);
    } else {
      toast.error(result.error || "Failed to forward");
    }
    setForwardingTo(null);
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
              if (msg.deletedByIds?.includes(currentUserId)) return null;

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
                  
                  <div className={`flex gap-2 max-w-[85%] ${isMe ? "self-end" : "self-start"} group relative`}>
                    
                    {/* Left Actions (if it's me) */}
                    {isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 pr-1 gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 transition">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white min-w-[150px]">
                            <div className="flex items-center justify-between p-2 pb-1 border-b border-zinc-800 mb-1">
                              {EMOJI_LIST.map(emoji => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                              ))}
                            </div>
                            <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="cursor-pointer">
                              <ReplyIcon className="w-4 h-4 mr-2" /> Reply
                            </DropdownMenuItem>
                            {msg.content && (
                              <DropdownMenuItem onClick={() => setEditingMessage(msg)} className="cursor-pointer">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                            )}
                            {msg.content && (
                              <DropdownMenuItem onClick={() => handleCopy(msg.content)} className="cursor-pointer">
                                <Copy className="w-4 h-4 mr-2" /> Copy
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setForwardingMessage(msg)} className="cursor-pointer">
                              <Forward className="w-4 h-4 mr-2" /> Forward
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem onClick={() => setDeletingMessage(msg)} className="cursor-pointer text-red-500 focus:text-red-500">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

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
                    
                    <div className="flex flex-col relative">
                      <div
                        className={`px-4 py-2.5 rounded-2xl whitespace-pre-wrap break-words flex flex-col gap-2 relative ${
                          isMe 
                            ? "bg-emerald-500 text-black rounded-br-sm" 
                            : "bg-zinc-800 text-white rounded-bl-sm"
                        }`}
                      >
                        {msg.isDeletedForEveryone ? (
                          <div className="flex items-center gap-2 opacity-60 italic text-sm text-zinc-300">
                            <Ban className="w-4 h-4" /> This message was deleted
                          </div>
                        ) : (
                          <>
                            {msg.isForwarded && (
                              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider opacity-70 mb-1 italic">
                                <Forward className="w-3 h-3" /> Forwarded
                              </div>
                            )}

                            {/* Reply Preview */}
                            {msg.replyTo && (
                              <div className={`text-xs p-2 rounded-lg border-l-4 mb-1 ${
                                isMe ? "bg-black/10 border-black/30 text-black/80" : "bg-black/20 border-emerald-500 text-zinc-300"
                              }`}>
                                <div className="font-bold opacity-80 mb-0.5">{msg.replyTo.sender?.name}</div>
                                <div className="truncate opacity-75">{msg.replyTo.content || "Attachment"}</div>
                              </div>
                            )}

                            {msg.postId && msg.post && (
                              <div className={`mb-1 p-3 rounded-xl border flex flex-col gap-2 ${
                                isMe ? "bg-emerald-600/20 border-emerald-400/30" : "bg-black/20 border-zinc-700"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-zinc-800 overflow-hidden shrink-0 border border-white/10">
                                    {msg.post.author?.image ? (
                                      <img src={msg.post.author.image} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                        {msg.post.author?.name?.[0]?.toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold truncate">{msg.post.author?.name}</span>
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

                            {msg.isEdited && (
                              <span className="text-[10px] opacity-60 self-end -mt-1 italic">(edited)</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Reactions Display */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex items-center bg-zinc-800 border border-zinc-700 rounded-full px-1.5 py-0.5 text-xs shadow-md z-10`}>
                          {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).slice(0, 3).map((emoji: any, i) => (
                            <span key={i} className="mx-0.5">{emoji}</span>
                          ))}
                          {msg.reactions.length > 1 && <span className="text-zinc-300 ml-1 font-bold text-[10px]">{msg.reactions.length}</span>}
                        </div>
                      )}
                    </div>

                    {/* Right Actions (if it's them) */}
                    {!isMe && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 pl-1 gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 transition">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white min-w-[150px]">
                            <div className="flex items-center justify-between p-2 pb-1 border-b border-zinc-800 mb-1">
                              {EMOJI_LIST.map(emoji => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform text-lg">{emoji}</button>
                              ))}
                            </div>
                            <DropdownMenuItem onClick={() => setReplyingTo(msg)} className="cursor-pointer">
                              <ReplyIcon className="w-4 h-4 mr-2" /> Reply
                            </DropdownMenuItem>
                            {msg.content && (
                              <DropdownMenuItem onClick={() => handleCopy(msg.content)} className="cursor-pointer">
                                <Copy className="w-4 h-4 mr-2" /> Copy
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setForwardingMessage(msg)} className="cursor-pointer">
                              <Forward className="w-4 h-4 mr-2" /> Forward
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem onClick={() => setDeletingMessage(msg)} className="cursor-pointer text-red-500 focus:text-red-500">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  
                  {isMe && index === messages.length - 1 && msg.isRead && (
                    <div className="text-xs text-zinc-500 self-end mt-2 mr-2">Seen</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput 
        conversationId={conversationId} 
        onMessageSent={handleIncomingMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      {/* Forward Modal */}
      {forwardingMessage && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 relative flex flex-col max-h-[80vh]">
            <button onClick={() => setForwardingMessage(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2 shrink-0">Forward Message</h3>
            <p className="text-sm text-zinc-400 mb-4 shrink-0">Select a conversation to forward this message to.</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {recentConversations.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : (
                recentConversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zinc-800 hover:border-emerald-500/50 transition">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                        {conv.user?.image ? (
                          <img src={conv.user.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center font-bold text-emerald-400">
                            {conv.user?.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white">{conv.user?.name}</span>
                        <span className="text-xs text-zinc-500">@{conv.user?.username}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleForward(conv.id)}
                      disabled={forwardingTo !== null}
                      className="px-4 py-1.5 bg-emerald-500 text-black text-xs font-bold rounded-full hover:bg-emerald-400 transition disabled:opacity-50"
                    >
                      {forwardingTo === conv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingMessage && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xs p-6 relative">
            <button onClick={() => setDeletingMessage(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Delete message?</h3>
            <div className="flex flex-col gap-3 mt-6">
              {deletingMessage.senderId === currentUserId && !deletingMessage.isDeletedForEveryone && (
                <button 
                  onClick={() => handleDeleteForEveryone(deletingMessage.id)}
                  disabled={isDeleting}
                  className="w-full py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete for everyone
                </button>
              )}
              <button 
                onClick={() => handleDeleteForMe(deletingMessage.id)}
                disabled={isDeleting}
                className="w-full py-2.5 bg-zinc-800 text-white hover:bg-zinc-700 font-bold rounded-xl transition flex justify-center items-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete for me
              </button>
              <button 
                onClick={() => setDeletingMessage(null)}
                disabled={isDeleting}
                className="w-full py-2.5 bg-transparent border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 font-bold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
