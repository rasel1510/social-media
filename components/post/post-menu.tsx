"use client";

import { MoreHorizontal, Edit3, Trash2, Loader2, EyeOff } from "lucide-react";
import { useState } from "react";

interface PostMenuProps {
  isOwner: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onHide?: () => void;
}

export function PostMenu({ isOwner, isPending, onEdit, onDelete, onHide }: PostMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-zinc-500 hover:text-emerald-400 rounded-full p-1 transition hover:bg-emerald-500/10"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-36 rounded-xl border border-zinc-800 bg-black shadow-2xl z-20 overflow-hidden py-1">
            {isOwner && (
              <>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-zinc-900 transition"
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </button>
                <button
                  disabled={isPending}
                  onClick={onDelete}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-zinc-900 transition disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </>
            )}
            
            {!isOwner && onHide && (
              <button
                onClick={() => {
                  onHide();
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-zinc-900 transition"
              >
                <EyeOff className="h-4 w-4" /> Hide post
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
