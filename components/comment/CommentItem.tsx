"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, CornerDownRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommentForm } from "./CommentForm";
import { FormattedText } from "../ui/formatted-text";

interface CommentAuthor {
  name: string;
  username: string | null;
  image: string | null;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  author: CommentAuthor;
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply?: (parentId: string, content: string) => Promise<void>;
  isReply?: boolean;
}

export function CommentItem({ comment, currentUserId, onEdit, onDelete, onReply, isReply = false }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const isOwner = currentUserId === comment.authorId;

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleReplySubmit = async (content: string) => {
    if (onReply) {
      await onReply(comment.id, content);
      setIsReplying(false);
    }
  };

  return (
    <div className={`group flex gap-3 ${isReply ? "ml-8 mt-3 relative" : "mt-4"}`}>
      {isReply && (
        <div className="absolute -left-6 top-0 bottom-0 w-px bg-zinc-800" />
      )}

      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={comment.author.image || ""} />
        <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-zinc-900 rounded-2xl px-4 py-2 relative group-hover:bg-zinc-800/80 transition-colors">
          <div className="flex justify-between items-start gap-2">
            <div>
              <span className="font-semibold text-sm text-zinc-100">{comment.author.name}</span>
              {comment.author.username && (
                <span className="text-xs text-zinc-500 ml-1">@{comment.author.username}</span>
              )}
            </div>

            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 bg-zinc-900 border-zinc-800">
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(comment.id)} className="cursor-pointer text-red-500 focus:text-red-500">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                initialValue={comment.content}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <FormattedText text={comment.content} className="text-sm text-zinc-300 mt-1" />
          )}
        </div>

        {!isEditing && (
          <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-zinc-500 font-medium">
            <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            {!isReply && onReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="hover:text-zinc-300 transition-colors flex items-center"
              >
                <CornerDownRight className="w-3 h-3 mr-1" /> Reply
              </button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="mt-2">
            <CommentForm
              placeholder="Write a reply..."
              isReply
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onEdit={onEdit}
                onDelete={onDelete}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
