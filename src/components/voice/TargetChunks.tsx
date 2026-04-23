"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetChunksProps {
  targetChunks: { order: number; text: string }[];
  usedChunks?: string[];
  className?: string;
}

export default function TargetChunks({
  targetChunks,
  usedChunks = [],
  className = "",
}: TargetChunksProps) {
  const isChunkUsed = (chunkText: string) => usedChunks.includes(chunkText);
  const sortedChunks = targetChunks
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <div className={cn("h-full w-full overflow-y-auto pr-1", className)}>
      <div className="space-y-2.5">
        {sortedChunks.map((chunk, index) => {
          const used = isChunkUsed(chunk.text);
          return (
            <div
              key={chunk.order}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-all duration-200",
                used
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-slate-200 bg-white"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  used
                    ? "border-emerald-300 bg-emerald-500 text-white"
                    : "border-slate-300 bg-slate-100 text-slate-600"
                )}
              >
                {used ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-relaxed text-slate-800">
                  {chunk.text}
                </p>
                {used && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Completed
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
