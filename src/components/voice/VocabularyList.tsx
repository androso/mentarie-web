"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { VocabularyItem } from "@/lib/types";

interface VocabularyListProps {
  vocabulary: VocabularyItem[];
  className?: string;
}

export default function VocabularyList({ vocabulary, className }: VocabularyListProps) {
  if (vocabulary.length === 0) return null;

  return (
    <div className={cn("h-full w-full overflow-y-auto pr-1", className)}>
      <div className="flex flex-wrap gap-2">
        {vocabulary.map((item, index) => (
          <div
            key={index}
            className="group relative flex items-center"
          >
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
              {item.text}
            </span>
            {item.meaning && (
              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg group-hover:block whitespace-nowrap z-10">
                {item.meaning}
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
