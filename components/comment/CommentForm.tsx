"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/ui/mention-textarea";
import { Send, Loader2, Smile } from "lucide-react";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  initialValue?: string;
  isReply?: boolean;
  onCancel?: () => void;
}

export function CommentForm({ onSubmit, placeholder = "Write a comment...", initialValue = "", isReply = false, onCancel }: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
      if (isReply && onCancel) onCancel();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${isReply ? "mt-2" : "mt-4"}`}>
      <MentionTextarea
        value={content}
        onValueChange={setContent}
        placeholder={placeholder}
        className="min-h-[80px] bg-zinc-900 border-zinc-800 focus:border-zinc-700 resize-none rounded-md px-3 py-2"
        maxLength={500}
      />
      <div className="flex justify-between items-center relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <Smile className="w-4 h-4" />
          </button>
          <span className="text-xs text-zinc-500">{content.length}/500</span>

          {showEmojiPicker && (
            <div className="absolute top-10 left-0 z-50 shadow-2xl">
              <EmojiPicker
                theme={"dark" as any}
                onEmojiClick={(emoji) => {
                  setContent(prev => prev + emoji.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="text-zinc-400 hover:text-black"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isReply ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>
    </form>
  );
}
