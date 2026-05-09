"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchMentionUsers } from "@/app/actions/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
}

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onValueChange: (value: string) => void;
}

export const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ onValueChange, value, className, ...props }, ref) => {
    const [suggestions, setSuggestions] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPos, setCursorPos] = useState(0);

    // Sync external ref with internal ref
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onValueChange(newValue);

      const selectionStart = e.target.selectionStart;
      setCursorPos(selectionStart);

      // Find if we are typing a mention
      const textBeforeCursor = newValue.substring(0, selectionStart);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

      if (lastAtSymbol !== -1) {
        const query = textBeforeCursor.substring(lastAtSymbol + 1);
        const isValidMentionStart = lastAtSymbol === 0 || /\s/.test(textBeforeCursor[lastAtSymbol - 1]);
        
        if (isValidMentionStart && !query.includes(" ")) {
          setMentionQuery(query);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    };

    useEffect(() => {
      if (showSuggestions && mentionQuery.length >= 0) {
        const fetchSuggestions = async () => {
          setIsLoading(true);
          try {
            const results = await searchMentionUsers(mentionQuery);
            setSuggestions(results as User[]);
            setSelectedIndex(0);
          } catch (error) {
            console.error("Error fetching mentions:", error);
          } finally {
            setIsLoading(false);
          }
        };

        const timer = setTimeout(fetchSuggestions, 200);
        return () => clearTimeout(timer);
      }
    }, [mentionQuery, showSuggestions]);

    const insertMention = (user: User) => {
      if (!internalRef.current) return;

      const username = user.username || user.name.replace(/\s+/g, '');
      const textValue = value as string;
      const textBeforeCursor = textValue.substring(0, cursorPos);
      const lastAtSymbol = textBeforeCursor.lastIndexOf("@");
      
      const before = textValue.substring(0, lastAtSymbol);
      const after = textValue.substring(cursorPos);
      
      const newValue = `${before}@${username} ${after}`;
      onValueChange(newValue);
      setShowSuggestions(false);
      
      // Set focus back and move cursor
      setTimeout(() => {
        if (internalRef.current) {
          internalRef.current.focus();
          const newPos = before.length + username.length + 2;
          internalRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(suggestions[selectedIndex]);
        } else if (e.key === "Escape") {
          setShowSuggestions(false);
        }
      }
    };

    return (
      <div className="relative w-full">
        <textarea
          {...props}
          ref={internalRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full bg-transparent outline-none",
            className
          )}
        />

        {showSuggestions && (mentionQuery.length >= 0) && (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-64 overflow-hidden rounded-xl border border-zinc-800 bg-black p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2">
            <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-900 mb-1">
              Mentions
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {suggestions.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-2 text-left transition outline-none",
                      index === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-900"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0 border border-zinc-800">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback className="bg-zinc-900 text-emerald-400 text-xs font-bold">
                        {user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-bold text-white">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500 font-medium">@{user.username || user.name.replace(/\s+/g, '')}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-sm text-zinc-500">
                No users found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";
