"use client";

import React, { useState } from "react";
import { Target, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetChunksProps {
  targetChunks: { order: number; text: string }[];
  usedChunks?: string[];
}

export default function TargetChunks({
  targetChunks,
  usedChunks = [],
}: TargetChunksProps) {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleToggle = () => setIsVisible((prev) => !prev);

  const isChunkUsed = (chunkText: string) => usedChunks.includes(chunkText);

  return (
    <div className="w-full">
      <div className="rounded-[26px] bg-white/10 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full items-center justify-between rounded-[22px] bg-white px-5 py-4 text-left shadow-[0_22px_48px_-24px_rgba(17,24,39,0.45)] transition hover:shadow-[0_30px_60px_-24px_rgba(17,24,39,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C82FF]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C82FF]/10 text-[#7C82FF]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#131A2B]">Target Phrases</p>
              <p className="text-xs text-[#5C6278]">
                Track the lesson goals you&rsquo;ve covered
              </p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#5C6278] transition-transform duration-300",
              isVisible ? "rotate-180" : "rotate-0"
            )}
          />
        </button>

        <div
          className={cn(
            "grid gap-3 overflow-hidden px-2 pb-3 pt-2 transition-all duration-300 ease-in-out",
            isVisible
              ? "max-h-[680px] opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          )}
        >
          {targetChunks
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((chunk, index) => {
              const used = isChunkUsed(chunk.text);
              return (
                <div
                  key={chunk.order}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-[18px] border px-5 py-4 text-sm font-semibold text-white transition-all duration-200",
                    used
                      ? "border-[#7C82FF]/40 bg-[#1D2740] shadow-[0_20px_36px_-24px_rgba(124,130,255,0.6)]"
                      : "border-white/10 bg-[#111827]/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border text-base",
                        used
                          ? "border-[#7C82FF]/40 bg-[#7C82FF]/15 text-[#7C82FF]"
                          : "border-white/10 bg-white/10 text-white"
                      )}
                    >
                      {used ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="leading-relaxed text-white/90">{chunk.text}</span>
                  </div>
                  {used && (
                    <span className="rounded-full bg-[#7C82FF]/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#d8dcff]">
                      used
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
