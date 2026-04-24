"use client";

import React from "react";
import { ResponseSuggestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  HelpCircle,
  User,
  Crown,
  ThumbsUp,
  ThumbsDown,
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
    <div className={cn("w-full overflow-x-auto pt-0.5 pb-0.5", className)}>
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-200/70"
            />
          ))}
        </div>
      ) : hasSuggestions ? (
        <div className="flex flex-row gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.text}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              onKeyDown={(event) => handleKeyDown(event, suggestion)}
              className="group flex w-56 shrink-0 cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7C82FF]/40 hover:shadow-[0_14px_30px_-22px_rgba(124,130,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C82FF]"
            >
              <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C82FF]/10 text-[#7C82FF]">
                  {getSuggestionIcon(suggestion.type)}
                </span>
                {formatSuggestionType(suggestion.type)}
              </div>
              <p className="text-sm font-semibold leading-snug text-slate-900">
                {suggestion.text}
              </p>
              {suggestion.translation && (
                <p className="text-xs text-slate-500">{suggestion.translation}</p>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/70 text-slate-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-slate-700">No suggestions yet</p>
            <p>Keep the conversation going and suggestions will appear.</p>
          </div>
        </div>
      )}
    </div>
  );
}
