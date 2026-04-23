"use client";

import React, { useState } from "react";
import { ResponseSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  HelpCircle,
  User,
  Crown,
  ThumbsUp,
  ThumbsDown,
  List,
  ChevronDown,
} from "lucide-react";

interface ResponseSuggestionsProps {
  suggestions: ResponseSuggestion[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
  className?: string;
}

const getSuggestionIcon = (type: ResponseSuggestion["type"]) => {
  switch (type) {
    case "question":
      return <HelpCircle className="h-4 w-4" />;
    case "statement":
      return <MessageSquare className="h-4 w-4" />;
    case "casual":
      return <User className="h-4 w-4" />;
    case "formal":
      return <Crown className="h-4 w-4" />;
    case "agreeing":
      return <ThumbsUp className="h-4 w-4" />;
    case "disagreeing":
      return <ThumbsDown className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

const formatSuggestionType = (type: ResponseSuggestion["type"]) =>
  type.replace(/_/g, " ");

export default function ResponseSuggestions({
  suggestions,
  onSuggestionClick,
  isLoading,
  className = "",
}: ResponseSuggestionsProps) {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const handleToggle = () => setIsVisible((prev) => !prev);

  const handleSuggestionClick = (suggestion: ResponseSuggestion) => {
    onSuggestionClick(suggestion.text);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    suggestion: ResponseSuggestion
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSuggestionClick(suggestion);
    }
  };

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-[26px] bg-white/10 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleToggle}
          className="flex w-full items-center justify-between rounded-[22px] bg-white px-5 py-4 text-left shadow-[0_22px_48px_-24px_rgba(17,24,39,0.45)] transition hover:shadow-[0_30px_60px_-24px_rgba(17,24,39,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C82FF]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7C82FF]/10 text-[#7C82FF]">
              <List className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#131A2B]">
                Suggested Responses
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
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-24 rounded-[18px] bg-[#131B2F]/60 animate-pulse"
                />
              ))}
            </div>
          ) : hasSuggestions ? (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.text}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                onKeyDown={(event) => handleKeyDown(event, suggestion)}
                className="group flex flex-col gap-3 rounded-[18px] border border-white/10 bg-[#111827]/90 px-5 py-5 text-left text-white transition-all duration-200 hover:-translate-y-1 hover:border-[#7C82FF]/40 hover:bg-[#1B2541] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C82FF]"
              >
                <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                  {formatSuggestionType(suggestion.type)}
                </div>
                <p className="text-base font-semibold leading-snug text-white">
                  {suggestion.text}
                </p>
                {suggestion.translation && (
                  <p className="text-sm text-white/60">{suggestion.translation}</p>
                )}
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[18px] border border-dashed border-white/10 bg-[#111827]/40 px-6 py-12 text-center text-sm text-white/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-white/80">No suggestions yet</p>
                <p>Continue chatting and we&rsquo;ll surface ideas here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
