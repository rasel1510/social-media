"use client";

import Link from "next/link";
import React from "react";

interface FormattedTextProps {
  text: string | null;
  className?: string;
}

export function FormattedText({ text, className }: FormattedTextProps) {
  if (!text) return null;

  // Split text by mentions, keeping the mentions in the result
  const mentionRegex = /(@\w+[\w.]*)/g;
  const parts = text.split(mentionRegex);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("@") && part.length > 1) {
          const username = part.substring(1);
          return (
            <Link
              key={i}
              href={`/Profile/${username}`}
              className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      })}
    </div>
  );
}
