"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Smile, Loader2, Mic, StopCircle, Trash2, ImageIcon, X, Reply, Edit2 } from "lucide-react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { sendMessage, editMessage } from "@/app/actions/message";
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "sonner";

interface MessageInputProps {
  conversationId: string;
  onMessageSent: (message: any) => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
}

export function MessageInput({ 
  conversationId, 
  onMessageSent,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content || "");
      if (inputRef.current) inputRef.current.focus();
    } else {
      if (!replyingTo) {
        setContent("");
      } else {
        if (inputRef.current) inputRef.current.focus();
      }
    }
  }, [editingMessage, replyingTo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timerRef.current) clearInterval(timerRef.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const cancelImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if ((!content.trim() && !audioBlob && !imageFile) || isSending || isUploading) return;

    setIsSending(true);

    try {
      if (editingMessage) {
        // Handle Edit
        const result = await editMessage(editingMessage.id, content);
        if (result.success) {
          setContent("");
          onCancelEdit?.();
        } else {
          toast.error(result.error || "Failed to edit message");
        }
      } else {
        // Handle Send new message
        let currentAudioUrl = undefined;
        let currentImageUrl = undefined;
        
        if (audioBlob) {
          setIsUploading(true);
          const file = new File([audioBlob], "audio_message.webm", { type: "audio/webm" });
          const uploadRes = await uploadFiles("audioUploader", {
            files: [file],
          });
          currentAudioUrl = uploadRes[0].url;
        }

        if (imageFile) {
          setIsUploading(true);
          const uploadRes = await uploadFiles("imageUploader", {
            files: [imageFile],
          });
          currentImageUrl = uploadRes[0].url;
        }

        const result = await sendMessage(conversationId, content, currentAudioUrl, currentImageUrl, replyingTo?.id);
        
        if (result.success) {
          setContent("");
          setAudioBlob(null);
          setRecordingTime(0);
          cancelImage();
          if (replyingTo) onCancelReply?.();
          // We rely on firebase listener in chat-area to handle appending
          // but we also have onMessageSent here for immediate updates
          onMessageSent(result.message);
          if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.focus();
          }
        } else {
          toast.error(result.error || "Failed to send message");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => prev + emojiData.emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="relative border-t border-zinc-800 bg-black p-4 flex flex-col gap-2">
      {showEmoji && (
        <div ref={emojiRef} className="absolute bottom-full right-4 mb-2 z-50">
          <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.DARK} />
        </div>
      )}
      
      {/* Reply Preview Area */}
      {replyingTo && !editingMessage && (
        <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3 border-l-4 border-emerald-500 mb-2">
          <div className="flex flex-col overflow-hidden mr-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
              <Reply className="w-3 h-3" />
              <span>Replying to {replyingTo.sender?.name || "someone"}</span>
            </div>
            <p className="text-sm text-zinc-300 truncate">
              {replyingTo.content || (replyingTo.imageUrl ? "📷 Image" : "🎤 Audio")}
            </p>
          </div>
          <button 
            onClick={onCancelReply}
            className="p-1.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Preview Area */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-zinc-900 rounded-lg p-3 border-l-4 border-amber-500 mb-2">
          <div className="flex flex-col overflow-hidden mr-4">
            <div className="flex items-center gap-2 text-amber-500 text-xs font-bold mb-1">
              <Edit2 className="w-3 h-3" />
              <span>Editing Message</span>
            </div>
          </div>
          <button 
            onClick={onCancelEdit}
            className="p-1.5 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Image Preview Area */}
      {imagePreview && (
        <div className="relative inline-block self-start">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <button onClick={cancelImage} className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button 
            onClick={cancelImage}
            className="absolute -top-2 -right-2 p-1 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full transition shadow-lg"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2 bg-zinc-900 rounded-2xl p-2 border border-zinc-800 focus-within:border-zinc-700 transition">
        {!isRecording && !audioBlob && (
          <div className="flex items-center">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition shrink-0"
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition shrink-0"
              title="Attach Image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 px-3 py-2 text-emerald-400 font-medium">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm">Recording... {formatTime(recordingTime)}</span>
            <button 
              onClick={cancelRecording}
              className="ml-auto p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-full transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={stopRecording}
              className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition"
            >
              <StopCircle className="w-6 h-6" />
            </button>
          </div>
        ) : audioBlob ? (
          <div className="flex-1 flex items-center gap-3 px-3 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Mic className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-bold">Audio recorded ({formatTime(recordingTime)})</span>
            <button 
              onClick={() => { setAudioBlob(null); setRecordingTime(0); }}
              className="ml-auto p-1.5 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 rounded-full transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-[120px] min-h-[40px] w-full resize-none bg-transparent py-2 px-2 text-white placeholder-zinc-500 focus:outline-none scrollbar-hide text-sm sm:text-base"
            rows={1}
          />
        )}

        {!isRecording && !audioBlob && !imageFile && content.trim() === "" ? (
          <button
            onClick={startRecording}
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-full transition shrink-0"
            title="Record Audio"
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={(!content.trim() && !audioBlob && !imageFile) || isSending || isUploading}
            className={`p-2 rounded-full shrink-0 transition ${
              (content.trim() || audioBlob || imageFile) && !isSending && !isUploading
                ? "bg-emerald-500 text-black hover:bg-emerald-400"
                : "text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSending || isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-0.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
