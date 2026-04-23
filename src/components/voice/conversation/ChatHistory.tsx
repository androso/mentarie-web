"use client";

import { ConversationMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

interface ChatHistoryProps {
  messages: ConversationMessage[];
  className?: string;
  isAssistantResponding?: boolean;
  pendingAssistantMessage?: string | null;
}

export default function ChatHistory({
  messages,
  className,
  isAssistantResponding = false,
  pendingAssistantMessage,
}: ChatHistoryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages.length, isAssistantResponding, pendingAssistantMessage]);

  const latestAssistantIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") {
        return i;
      }
    }
    return -1;
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full flex-col overflow-y-auto pr-2", className)}
    >
      <div className="mt-auto flex flex-1 flex-col gap-4">
        {messages.length === 0 &&
          !pendingAssistantMessage &&
          !isAssistantResponding && (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
              <span>Send a message to start a text conversation with the agent.</span>
            </div>
          )}

        {messages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          const isLatestAssistant = index === latestAssistantIndex;

          return (
            <div
              key={`chat-message-${index}`}
              className={cn("flex", isAssistant ? "justify-start" : "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm",
                  isAssistant
                    ? "border-indigo-200 bg-indigo-500/10 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700",
                  isAssistant && isLatestAssistant
                    ? "ring-2 ring-indigo-200 shadow-[0_18px_40px_-24px_rgba(79,70,229,0.65)]"
                    : undefined
                )}
              >
                <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {isAssistant ? (
                    <Bot className="h-3.5 w-3.5 text-indigo-500" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  {isAssistant ? "AI" : "You"}
                </span>
                <p className="whitespace-pre-wrap break-words text-base">
                  {message.content}
                </p>
              </div>
            </div>
          );
        })}

        {(isAssistantResponding || pendingAssistantMessage) && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-indigo-200 bg-indigo-500/10 px-4 py-3 text-sm leading-relaxed shadow-sm ring-1 ring-indigo-200/70">
              <span className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                <Bot className="h-3.5 w-3.5" />
                AI
              </span>
              {pendingAssistantMessage ? (
                <p className="whitespace-pre-wrap break-words text-base">
                  {pendingAssistantMessage}
                </p>
              ) : (
                <div className="flex items-center gap-1 text-indigo-500">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:0.3s]" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
