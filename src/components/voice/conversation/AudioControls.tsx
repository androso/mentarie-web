"use client";

import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

interface AudioControlsProps {
  isUserSpeaking: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export default function AudioControls({
  isUserSpeaking,
  onStart,
  onStop,
  disabled = false,
}: AudioControlsProps) {
  return (
    <button
      onClick={isUserSpeaking ? onStop : onStart}
      disabled={disabled}
      className={cn(
        "flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_20px_48px_-24px_rgba(11,16,31,0.65)] transition-all duration-300",
        !disabled &&
          "hover:-translate-y-0.5 hover:shadow-[0_26px_64px_-28px_rgba(11,16,31,0.65)]",
        isUserSpeaking &&
          "border-transparent bg-[#7C82FF] text-white shadow-[0_28px_72px_-24px_rgba(124,130,255,0.75)] scale-[1.05]",
        disabled && "cursor-not-allowed opacity-50"
      )}
      aria-pressed={isUserSpeaking}
    >
      <Mic className="h-8 w-8" />
    </button>
  );
}
