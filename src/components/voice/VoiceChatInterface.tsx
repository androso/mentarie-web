"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import AudioControls from "@/components/voice/conversation/AudioControls";
import ChatHistory from "@/components/voice/conversation/ChatHistory";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Power,
  ArrowLeft,
  MessageSquare,
  Send,
  AudioWaveform,
  List,
  Target,
} from "lucide-react";
import { AgentConfig, ConversationMessage, ResponseSuggestion, TranscriptItem, VocabularyItem } from "@/lib/types";
import TargetChunks from "@/components/voice/TargetChunks";
import VocabularyList from "@/components/voice/VocabularyList";
import ProgressBar from "@/components/voice/ProgressBar";
import ResponseSuggestions from "@/components/voice/ResponseSuggestions";
import { WaveAnimation } from "@/components/voice/WaveAnimation";
import { cn } from "@/lib/utils";
import { useOpenAIVoice } from "@/hooks/voice/useOpenAIVoice";
import type { VoiceSession } from "@/lib/voice/types";

export interface LessonData {
  title: string;
  objective: string;
  targetChunks: { order: number; text: string }[];
  vocabulary?: VocabularyItem[];
  competencies?: string[];
}

interface VoiceChatInterfaceProps {
  title?: string;
  description?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
  lessonData?: LessonData;
  agentConfig?: AgentConfig;
  onLessonComplete?: () => void;
  initialUsedChunks?: string[];
  initialSuggestions?: ResponseSuggestion[];
}

export default function VoiceChatInterface({
  title,
  description,
  onBack,
  showBackButton = false,
  className = "",
  lessonData,
  agentConfig,
  onLessonComplete,
  initialUsedChunks = [],
  initialSuggestions = [],
}: VoiceChatInterfaceProps) {
  const [userText, setUserText] = useState<string>("");
  const [chatMode, setChatMode] = useState<"voice" | "chat">("voice");
  const [usedChunks, setUsedChunks] = useState<string[]>(initialUsedChunks);
  const [suggestions, setSuggestions] = useState<ResponseSuggestion[]>(initialSuggestions);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const waveRef = useRef<HTMLDivElement>(null);
  // Ref to break the circular dependency between effectiveAgent and voiceSession
  const voiceSessionRef = useRef<VoiceSession | null>(null);

  const targetChunksToShow = lessonData?.targetChunks ?? [];
  const vocabularyToShow = lessonData?.vocabulary ?? [];
  const competenciesToShow = lessonData?.competencies ?? [];

  // Inject lesson tool handlers into the agent config so they can update local state
  const effectiveAgent = useMemo<AgentConfig>(() => {
    const base: AgentConfig = agentConfig ?? {
      name: "defaultAssistant",
      publicDescription: "A helpful AI language assistant.",
      instructions: "You are a helpful AI language learning assistant. Engage in natural conversation to help the user practice their language skills.",
      tools: [],
    };
    return {
      ...base,
      toolLogic: {
        ...base.toolLogic,
        console_greeting: ({ message }: { message: string }) => {
          console.log("[agent greeting]", message);
          return { status: "ok" };
        },
        update_target_chunks: ({ chunks }: { chunks: string[] }) => {
          let totalUsed = 0;
          setUsedChunks((prev) => {
            const merged = [...new Set([...prev, ...chunks])];
            totalUsed = merged.length;
            return merged;
          });
          return { totalUsed };
        },
        finish_lesson: () => {
          setTimeout(() => voiceSessionRef.current?.disconnect(), 15_000);
          onLessonComplete?.();
          return { status: "ok" };
        },
      },
    };
  }, [agentConfig, onLessonComplete]);

  const handleAssistantResponseComplete = useCallback(
    async (transcript: TranscriptItem[]) => {
      const history: ConversationMessage[] = transcript
        .filter((t) => t.type === "MESSAGE" && t.status === "DONE" && t.role)
        .slice(-10)
        .map((t) => ({ role: t.role!, content: t.title ?? "" }));
      if (history.length === 0) return;
      setSuggestionsLoading(true);
      try {
        const res = await fetch("/api/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationContext: history }),
        });
        const data = await res.json();
        setSuggestions(data.suggestions ?? []);
      } catch {
        // silently fail — suggestions are non-critical
      } finally {
        setSuggestionsLoading(false);
      }
    },
    []
  );

  const voiceSession = useOpenAIVoice({
    agentConfig: effectiveAgent,
    onAssistantResponseComplete: handleAssistantResponseComplete,
  });

  voiceSessionRef.current = voiceSession;

  const animationState = voiceSession.isUserSpeaking
    ? "listening"
    : voiceSession.isAgentSpeaking
    ? "speaking"
    : "idle";

  const conversationHistory: ConversationMessage[] = voiceSession.transcript
    .filter((t) => t.type === "MESSAGE" && t.role)
    .map((t) => ({ role: t.role!, content: t.title ?? "" }));

  const isConnected = voiceSession.status === "CONNECTED";
  const isConnecting = voiceSession.status === "CONNECTING";

  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      if (isConnected) {
        voiceSession.sendTextMessage(suggestionText);
      } else {
        setUserText(suggestionText);
        setChatMode("chat");
      }
    },
    [isConnected, voiceSession]
  );

  const handleSendTextMessage = useCallback(() => {
    if (!userText.trim()) return;
    if (isConnected) {
      voiceSession.sendTextMessage(userText.trim());
    }
    setUserText("");
  }, [userText, isConnected, voiceSession]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendTextMessage();
    }
  };

  const handleConnectToggle = useCallback(() => {
    if (voiceSession.status === "DISCONNECTED") {
      voiceSession.connect();
    } else {
      voiceSession.disconnect();
    }
  }, [voiceSession]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden bg-gray-100 px-6 py-6 lg:px-10 lg:py-8",
        className
      )}
    >
      {(showBackButton || title) && (
        <div className="mx-auto mb-5 w-full max-w-6xl">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white border border-gray-200 text-[#4e342e] shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4e342e]/30"
                onClick={onBack}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Go back</span>
              </button>
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Lesson
              </span>
              <h2 className="text-xl font-bold text-[#4e342e] sm:text-2xl">
                {title ?? "Voice Chat"}
              </h2>
              {(description || lessonData?.objective) && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {description ?? lessonData?.objective}
                </p>
              )}
              {competenciesToShow.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {competenciesToShow.map((c, i) => (
                    <span key={i} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 border border-indigo-100">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex h-full w-full max-h-full flex-1 overflow-hidden rounded-[32px]">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-white text-slate-900 shadow-[0_32px_80px_-32px_rgba(10,17,32,0.65)] lg:flex-row">
          <div className="flex flex-1 min-h-0 flex-col lg:w-[60%] lg:flex-none">
            <div className="flex flex-1 min-h-0 flex-col gap-4 px-6 py-4 sm:px-12 sm:py-6">
              {chatMode === "voice" && (
                <>
                  <div className="flex items-center justify-center">
                    <WaveAnimation animationState={animationState} waveRef={waveRef} />
                  </div>

                  <section className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C82FF]/10 text-[#7C82FF]">
                          <List className="h-4 w-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Suggested Responses
                          </h3>
                          <p className="text-xs text-slate-500">Tap to prefill your reply</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                        {suggestions.length}
                      </span>
                    </div>

                    <ResponseSuggestions
                      suggestions={suggestions}
                      onSuggestionClick={handleSuggestionClick}
                      isLoading={suggestionsLoading}
                    />
                  </section>
                </>
              )}

              {chatMode === "chat" && (
                <div className="flex-1 min-h-0 overflow-hidden rounded-[28px] bg-[#EEF0F6] px-4 py-4 sm:px-6 sm:py-6">
                  <ChatHistory
                    messages={conversationHistory}
                    isAssistantResponding={isConnected && voiceSession.isAgentSpeaking}
                    pendingAssistantMessage={null}
                    className="h-full"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/70 px-6 py-5 sm:px-12">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-[#E4E6F4] p-1.5 shadow-inner">
                    <button
                      className={cn(
                        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 transition",
                        chatMode === "voice"
                          ? "bg-[#7C82FF] text-white shadow-[0_16px_32px_-16px_rgba(124,130,255,0.6)]"
                          : "hover:text-slate-700"
                      )}
                      aria-pressed={chatMode === "voice"}
                      onClick={() => setChatMode("voice")}
                      type="button"
                    >
                      <AudioWaveform className="h-5 w-5" />
                      <span className="sr-only">Switch to voice mode</span>
                    </button>
                    <button
                      className={cn(
                        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 transition",
                        chatMode === "chat"
                          ? "bg-[#7C82FF] text-white shadow-[0_16px_32px_-16px_rgba(124,130,255,0.6)]"
                          : "hover:text-slate-700"
                      )}
                      aria-pressed={chatMode === "chat"}
                      onClick={() => setChatMode("chat")}
                      type="button"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="sr-only">Switch to text chat mode</span>
                    </button>
                  </div>
                </div>

                {chatMode === "voice" ? (
                  <div className="flex flex-1 justify-center">
                    <AudioControls
                      isUserSpeaking={voiceSession.isUserSpeaking}
                      onStart={voiceSession.startTurn}
                      onStop={voiceSession.endTurn}
                      disabled={!isConnected}
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[80px] flex-1 items-center justify-center">
                    <div className="flex h-12 w-full max-w-xl items-center gap-3 rounded-full bg-[#EFF0F6] px-4 text-slate-700 shadow-inner">
                      <Textarea
                        value={userText}
                        onChange={(e) => setUserText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={isConnected ? "Type a message..." : "Connect first to chat"}
                        disabled={!isConnected}
                        className="h-full min-h-0 flex-1 resize-none border-0 bg-transparent px-0 py-1 text-base leading-tight placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-0"
                        rows={1}
                      />
                      <Button
                        onClick={handleSendTextMessage}
                        disabled={!userText.trim() || !isConnected}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-slate-900 disabled:opacity-50"
                        size="icon"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleConnectToggle}
                  disabled={isConnecting}
                  className={cn(
                    "h-11 rounded-full px-6 text-sm font-semibold transition",
                    isConnected
                      ? "bg-red-500 text-white shadow-[0_12px_24px_-12px_rgba(239,68,68,0.8)] hover:bg-red-600"
                      : "bg-[#7C82FF] text-white shadow-[0_12px_24px_-12px_rgba(124,130,255,0.8)] hover:bg-[#6f76ff]"
                  )}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            </div>
          </div>

          <aside className="flex w-full flex-col gap-5 border-t border-slate-200 px-6 py-6 lg:w-[40%] lg:flex-none lg:border-l lg:border-t-0 lg:px-8 lg:py-8 lg:overflow-y-auto">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Lesson Progress
              </p>
              <ProgressBar
                totalChunks={targetChunksToShow.length}
                usedChunks={usedChunks.length}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {targetChunksToShow.length > 0 && (
                <section className="flex min-h-[16rem] flex-1 flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Target className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Target Phrases
                        </h3>
                        <p className="text-xs text-slate-500">
                          Keep an eye on phrase coverage
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {usedChunks.length}/{targetChunksToShow.length}
                    </span>
                  </div>

                  <TargetChunks
                    targetChunks={targetChunksToShow}
                    usedChunks={usedChunks}
                  />
                </section>
              )}

              {vocabularyToShow.length > 0 && (
                <section className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Vocabulary</h3>
                      <p className="text-xs text-slate-500">Key words for this lesson</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {vocabularyToShow.length}
                    </span>
                  </div>
                  <VocabularyList vocabulary={vocabularyToShow} />
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
