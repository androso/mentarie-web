"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { LanguageOption } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { createRealtimeConnection } from "@/lib/webrtc";

type OnboardingResponse = {
  success: boolean;
};

type HumeAccessTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

const supportedLanguageKeys = ["english", "french", "spanish"] as const;

const allowedTargetsByNative: Record<string, string[]> = {
  english: ["french", "spanish"],
  french: ["english", "spanish"],
  spanish: ["english", "french"],
};

const onboardingSystemPrompt = [
  "You are Mentarie onboarding voice guide.",
  "Your task is to help the learner provide two values: native language and target language.",
  "Allowed languages are English, French, and Spanish only.",
  "Allowed pair rules:",
  "- Native English: target can be French or Spanish.",
  "- Native French: target can be English or Spanish.",
  "- Native Spanish: target can be English or French.",
  "Ask one concise question at a time and keep answers short.",
  "When the user gives both languages, repeat a short confirmation sentence.",
  "If they choose an invalid pair, explain the valid alternatives.",
].join(" ");

const openAiToolInstructions = [
  "You have tools to update onboarding UI state.",
  "Use set_native_language when user states their native language.",
  "Use set_target_language when user states their target language.",
  "Use set_language_pair when user provides both in one utterance.",
  "Do not guess languages. Use only english, french, or spanish.",
].join(" ");

function getLanguageKey(language: LanguageOption): string {
  const raw = `${language.code} ${language.name}`.trim().toLowerCase();

  if (raw.includes("english") || raw.includes(" en") || raw.startsWith("en") || raw.includes("en-")) return "english";
  if (raw.includes("french") || raw.includes("francais") || raw.includes("français") || raw.includes(" fr") || raw.startsWith("fr") || raw.includes("fr-")) return "french";
  if (raw.includes("spanish") || raw.includes("espanol") || raw.includes("español") || raw.includes(" es") || raw.startsWith("es") || raw.includes("es-")) return "spanish";

  return raw;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, learningLanguages, nativeLanguage, isLoading } = useAuth();
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "hume">("openai");
  const [nativeLanguageId, setNativeLanguageId] = useState<string>("");
  const [targetLanguageId, setTargetLanguageId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: languageOptions,
    isLoading: isLanguageOptionsLoading,
  } = useQuery<LanguageOption[]>({
    queryKey: ["/api/user/language-options"],
    queryFn: getQueryFn<LanguageOption[]>({ on401: "throw" }),
    enabled: !!user,
  });

  const supportedLanguages = useMemo(() => {
    return (languageOptions ?? []).filter((language) =>
      supportedLanguageKeys.includes(getLanguageKey(language) as (typeof supportedLanguageKeys)[number])
    );
  }, [languageOptions]);

  useEffect(() => {
    if (nativeLanguageId || !nativeLanguage || supportedLanguages.length === 0) {
      return;
    }

    const matchedNative = supportedLanguages.find(
      (language) => String(language.id) === String(nativeLanguage.id)
    );

    if (matchedNative) {
      setNativeLanguageId(String(matchedNative.id));
    }
  }, [nativeLanguageId, nativeLanguage, supportedLanguages]);

  useEffect(() => {
    if (targetLanguageId || learningLanguages.length === 0 || supportedLanguages.length === 0) {
      return;
    }

    const firstLearningLanguage = learningLanguages[0];
    const matchedTarget = supportedLanguages.find(
      (language) => String(language.id) === String(firstLearningLanguage.languageId)
    );

    if (matchedTarget) {
      setTargetLanguageId(String(matchedTarget.id));
    }
  }, [targetLanguageId, learningLanguages, supportedLanguages]);

  const selectedNativeLanguage = useMemo(
    () => supportedLanguages.find((language) => String(language.id) === nativeLanguageId),
    [supportedLanguages, nativeLanguageId]
  );

  const allowedTargetKeys = useMemo(() => {
    if (!selectedNativeLanguage) {
      return [];
    }

    return allowedTargetsByNative[getLanguageKey(selectedNativeLanguage)] ?? [];
  }, [selectedNativeLanguage]);

  const targetLanguageOptions = useMemo(() => {
    return supportedLanguages.filter((language) =>
      allowedTargetKeys.includes(getLanguageKey(language))
    );
  }, [supportedLanguages, allowedTargetKeys]);

  useEffect(() => {
    if (!targetLanguageId) {
      return;
    }

    const stillValid = targetLanguageOptions.some(
      (language) => String(language.id) === targetLanguageId
    );

    if (!stillValid) {
      setTargetLanguageId("");
    }
  }, [targetLanguageId, targetLanguageOptions]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [isLoading, user, router]);

  const submitOnboarding = async () => {
    setError("");

    if (!nativeLanguageId || !targetLanguageId) {
      setError("Please choose both native and target language.");
      return;
    }

    const selectedTargetLanguage = supportedLanguages.find(
      (language) => String(language.id) === targetLanguageId
    );

    if (!selectedNativeLanguage || !selectedTargetLanguage) {
      setError("Please select supported onboarding languages.");
      return;
    }

    if (!allowedTargetKeys.includes(getLanguageKey(selectedTargetLanguage))) {
      setError("That target language is not available for your selected native language yet.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/user/onboarding", {
        nativeLanguageId: Number(nativeLanguageId),
        targetLanguageId: Number(targetLanguageId),
      });

      await response.json() as OnboardingResponse;
      await queryClient.invalidateQueries({ queryKey: ["/api/user/"] });
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isLanguageOptionsLoading) {
    return <div className="min-h-screen bg-[#f5f2ef]" />;
  }

  if (!user) {
    return null;
  }

  const sharedPanelProps: VoiceOnboardingPanelProps = {
    supportedLanguages,
    targetLanguageOptions,
    nativeLanguageId,
    targetLanguageId,
    setNativeLanguageId,
    setTargetLanguageId,
    allowedTargetKeys,
    isSubmitting,
    error,
    setError,
    onSubmit: submitOnboarding,
  };

  return (
    <main className="min-h-screen bg-[#f5f2ef] py-10 px-4">
      <div className="mx-auto mb-4 flex max-w-4xl gap-2">
        <button
          type="button"
          onClick={() => setVoiceProvider("openai")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${voiceProvider === "openai" ? "bg-[#2f241d] text-white" : "border border-[#ccb9a8] bg-white text-[#4a3728]"}`}
        >
          OpenAI Realtime
        </button>
        <button
          type="button"
          onClick={() => setVoiceProvider("hume")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${voiceProvider === "hume" ? "bg-[#2f241d] text-white" : "border border-[#ccb9a8] bg-white text-[#4a3728]"}`}
        >
          Hume EVI
        </button>
      </div>

      {voiceProvider === "openai" ? (
        <VoiceOnboardingPanel {...sharedPanelProps} />
      ) : (
        <VoiceProvider clearMessagesOnDisconnect={false} messageHistoryLimit={48}>
          <HumeVoiceOnboardingPanel {...sharedPanelProps} />
        </VoiceProvider>
      )}
    </main>
  );
}

type VoiceOnboardingPanelProps = {
  supportedLanguages: LanguageOption[];
  targetLanguageOptions: LanguageOption[];
  nativeLanguageId: string;
  targetLanguageId: string;
  setNativeLanguageId: (id: string) => void;
  setTargetLanguageId: (id: string) => void;
  allowedTargetKeys: string[];
  isSubmitting: boolean;
  error: string;
  setError: (value: string) => void;
  onSubmit: () => Promise<void>;
};

function extractMentionedLanguageKeys(input: string): string[] {
  const text = input.toLowerCase();
  const keys: string[] = [];

  if (/(^|\s)(english|en)(\s|$)/.test(text)) {
    keys.push("english");
  }
  if (/(^|\s)(french|francais|français|fr)(\s|$)/.test(text)) {
    keys.push("french");
  }
  if (/(^|\s)(spanish|espanol|español|es)(\s|$)/.test(text)) {
    keys.push("spanish");
  }

  return Array.from(new Set(keys));
}

type SpokenLanguageSelection = {
  nativeKey?: string;
  targetKey?: string;
  mentionedKeys: string[];
};

function extractSpokenLanguageSelection(input: string): SpokenLanguageSelection {
  const text = input.toLowerCase();
  const mentionedKeys = extractMentionedLanguageKeys(input);

  const nativePatterns = [
    /native\s+language\s*(?:is|=|:)?\s*([a-z\u00c0-\u017f\- ]+)/i,
    /i(?:'m| am)\s+(?:a\s+)?native\s+([a-z\u00c0-\u017f\- ]+)/i,
    /native\s*[:\-]\s*([a-z\u00c0-\u017f\- ]+)/i,
  ];

  const targetPatterns = [
    /target\s+language\s*(?:is|=|:)?\s*([a-z\u00c0-\u017f\- ]+)/i,
    /i\s+want\s+to\s+learn\s+([a-z\u00c0-\u017f\- ]+)/i,
    /learning\s+([a-z\u00c0-\u017f\- ]+)/i,
    /target\s*[:\-]\s*([a-z\u00c0-\u017f\- ]+)/i,
  ];

  const nativeMatch = nativePatterns
    .map((pattern) => text.match(pattern))
    .find((match) => Boolean(match?.[1]));
  const targetMatch = targetPatterns
    .map((pattern) => text.match(pattern))
    .find((match) => Boolean(match?.[1]));

  const nativeKey = nativeMatch ? extractMentionedLanguageKeys(nativeMatch[1])[0] : undefined;
  const targetKey = targetMatch ? extractMentionedLanguageKeys(targetMatch[1])[0] : undefined;

  return {
    nativeKey,
    targetKey,
    mentionedKeys,
  };
}

function VoiceOnboardingPanel({
  supportedLanguages,
  targetLanguageOptions,
  nativeLanguageId,
  targetLanguageId,
  setNativeLanguageId,
  setTargetLanguageId,
  allowedTargetKeys,
  isSubmitting,
  error,
  setError,
  onSubmit,
}: VoiceOnboardingPanelProps) {
  const [sessionStatus, setSessionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [voiceError, setVoiceError] = useState("");
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ id: string; role: "assistant" | "user"; text: string }>>([]);
  const [lastUserTranscript, setLastUserTranscript] = useState("");

  const lastHandledUtteranceRef = useRef<string>("");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const nativeLanguageIdRef = useRef(nativeLanguageId);
  const targetLanguageIdRef = useRef(targetLanguageId);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    nativeLanguageIdRef.current = nativeLanguageId;
  }, [nativeLanguageId]);

  useEffect(() => {
    targetLanguageIdRef.current = targetLanguageId;
  }, [targetLanguageId]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const languageByKey = useMemo(() => {
    const map = new Map<string, LanguageOption>();
    for (const language of supportedLanguages) {
      map.set(getLanguageKey(language), language);
    }
    return map;
  }, [supportedLanguages]);

  const upsertTranscriptEntry = (
    id: string,
    role: "assistant" | "user",
    text: string,
    append = false
  ) => {
    setTranscript((previous) => {
      const index = previous.findIndex((entry) => entry.id === id);
      if (index === -1) {
        return [...previous, { id, role, text }].slice(-8);
      }

      const next = [...previous];
      next[index] = {
        ...next[index],
        role,
        text: append ? `${next[index].text}${text}` : text,
      };
      return next.slice(-8);
    });
  };

  const applyOnboardingLanguageUpdate = ({
    nativeLanguageKey,
    targetLanguageKey,
  }: {
    nativeLanguageKey?: string;
    targetLanguageKey?: string;
  }) => {
    const currentNativeId = nativeLanguageIdRef.current;
    const currentTargetId = targetLanguageIdRef.current;

    const nextNative = nativeLanguageKey ? languageByKey.get(nativeLanguageKey) : undefined;
    if (nativeLanguageKey && !nextNative) {
      return { success: false, message: `Unsupported native language: ${nativeLanguageKey}` };
    }

    const nextTarget = targetLanguageKey ? languageByKey.get(targetLanguageKey) : undefined;
    if (targetLanguageKey && !nextTarget) {
      return { success: false, message: `Unsupported target language: ${targetLanguageKey}` };
    }

    const effectiveNativeId = nextNative ? String(nextNative.id) : currentNativeId;
    const effectiveNative = supportedLanguages.find((language) => String(language.id) === effectiveNativeId);
    const effectiveNativeKey = effectiveNative ? getLanguageKey(effectiveNative) : undefined;

    if (targetLanguageKey && effectiveNativeKey) {
      const allowedForNative = allowedTargetsByNative[effectiveNativeKey] ?? [];
      if (!allowedForNative.includes(targetLanguageKey)) {
        const message = "That target language is not available for the selected native language yet.";
        setError(message);
        return { success: false, message };
      }
    }

    if (nextNative) {
      const nextNativeId = String(nextNative.id);
      if (nextNativeId !== currentNativeId) {
        setNativeLanguageId(nextNativeId);
      }
    }

    if (nextTarget) {
      const nextTargetId = String(nextTarget.id);
      if (nextTargetId !== currentTargetId) {
        setTargetLanguageId(nextTargetId);
      }
    }

    setError("");
    return {
      success: true,
      nativeLanguageId: nextNative ? String(nextNative.id) : currentNativeId,
      targetLanguageId: nextTarget ? String(nextTarget.id) : currentTargetId,
    };
  };

  const disconnectSession = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach((sender) => {
        sender.track?.stop();
      });
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    dataChannelRef.current = null;
    localAudioTrackRef.current = null;
    setIsAssistantSpeaking(false);
    setSessionStatus("disconnected");
    setIsConnectingVoice(false);
  };

  const handleRealtimeEvent = (rawEvent: MessageEvent) => {
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(rawEvent.data as string) as Record<string, unknown>;
    } catch {
      return;
    }

    const eventType = String(event.type ?? "");

    if (eventType === "conversation.item.input_audio_transcription.completed") {
      const itemId = String(event.item_id ?? `user-${Date.now()}`);
      const transcriptText = String(event.transcript ?? "").trim() || "[inaudible]";
      upsertTranscriptEntry(itemId, "user", transcriptText, false);

      if (transcriptText !== "[inaudible]") {
        setLastUserTranscript(transcriptText);
      }
      return;
    }

    if (eventType === "output_audio_buffer.started") {
      setIsAssistantSpeaking(true);
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.enabled = false;
      }
      return;
    }

    if (eventType === "output_audio_buffer.stopped") {
      setIsAssistantSpeaking(false);
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.enabled = !isMutedRef.current;
      }
      return;
    }

    if (eventType === "response.function_call_arguments.done") {
      const functionName = String(event.name ?? "");
      const callId = String(event.call_id ?? "");
      const rawArgs = String(event.arguments ?? "{}");

      let parsedArgs: Record<string, string> = {};
      try {
        parsedArgs = JSON.parse(rawArgs) as Record<string, string>;
      } catch {
        parsedArgs = {};
      }

      let result: Record<string, unknown> | null = null;

      if (functionName === "set_native_language") {
        result = applyOnboardingLanguageUpdate({ nativeLanguageKey: parsedArgs.native_language });
      }

      if (functionName === "set_target_language") {
        result = applyOnboardingLanguageUpdate({ targetLanguageKey: parsedArgs.target_language });
      }

      if (functionName === "set_language_pair") {
        result = applyOnboardingLanguageUpdate({
          nativeLanguageKey: parsedArgs.native_language,
          targetLanguageKey: parsedArgs.target_language,
        });
      }

      if (result && callId && dataChannelRef.current?.readyState === "open") {
        dataChannelRef.current.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify(result),
            },
          })
        );
        dataChannelRef.current.send(JSON.stringify({ type: "response.create" }));
      }

      return;
    }

    if (eventType === "response.audio_transcript.delta" || eventType === "response.text.delta") {
      const itemId = String(event.item_id ?? "assistant-stream");
      const delta = String(event.delta ?? "");
      if (delta) {
        upsertTranscriptEntry(itemId, "assistant", delta, true);
      }
    }
  };

  useEffect(() => {
    return () => {
      disconnectSession();
    };
  }, []);

  useEffect(() => {
    const content = lastUserTranscript;
    if (!content) {
      return;
    }

    const normalizedContent = content.trim().toLowerCase();
    if (!normalizedContent || normalizedContent === lastHandledUtteranceRef.current) {
      return;
    }

    lastHandledUtteranceRef.current = normalizedContent;

    const { nativeKey: spokenNativeKey, targetKey: spokenTargetKey, mentionedKeys } = extractSpokenLanguageSelection(content);
    if (!spokenNativeKey && !spokenTargetKey && mentionedKeys.length === 0) {
      return;
    }

    let nativeKeyToApply = spokenNativeKey;
    let targetKeyToApply = spokenTargetKey;

    // Fallback for short utterances such as "Spanish and English".
    if (!nativeKeyToApply && !targetKeyToApply && mentionedKeys.length >= 2) {
      [nativeKeyToApply, targetKeyToApply] = mentionedKeys;
    }

    if (!nativeKeyToApply && !targetKeyToApply && mentionedKeys.length === 1) {
      if (normalizedContent.includes("native")) {
        nativeKeyToApply = mentionedKeys[0];
      } else if (normalizedContent.includes("target") || normalizedContent.includes("learn")) {
        targetKeyToApply = mentionedKeys[0];
      }
    }

    if (nativeKeyToApply) {
      const nativeCandidate = languageByKey.get(nativeKeyToApply);
      if (nativeCandidate) {
        const nextNativeId = String(nativeCandidate.id);
        if (nextNativeId !== nativeLanguageId) {
          setNativeLanguageId(nextNativeId);
        }
      }
    }

    const effectiveNativeKey = nativeKeyToApply
      ?? (nativeLanguageId
        ? getLanguageKey(
          supportedLanguages.find((language) => String(language.id) === nativeLanguageId)
          ?? ({ code: "", name: "" } as LanguageOption)
        )
        : undefined);

    if (!targetKeyToApply && mentionedKeys.length > 0) {
      const fallbackTarget = mentionedKeys.find((key) => key !== nativeKeyToApply);
      if (fallbackTarget) {
        targetKeyToApply = fallbackTarget;
      }
    }

    if (!targetKeyToApply) {
      return;
    }

    const targetCandidate = languageByKey.get(targetKeyToApply);
    if (!targetCandidate) {
      return;
    }

    if (effectiveNativeKey) {
      const allowedForNative = allowedTargetsByNative[effectiveNativeKey] ?? [];
      if (!allowedForNative.includes(targetKeyToApply)) {
        setError("That target language is not available for your selected native language yet.");
        return;
      }
    }

    const nextTargetId = String(targetCandidate.id);
    if (nextTargetId !== targetLanguageId) {
      setError("");
      setTargetLanguageId(nextTargetId);
    }
  }, [lastUserTranscript, nativeLanguageId, targetLanguageId, languageByKey, setNativeLanguageId, setTargetLanguageId, setError, supportedLanguages]);

  useEffect(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.enabled = !isMuted && !isAssistantSpeaking;
    }
  }, [isMuted, isAssistantSpeaking]);

  const startVoiceOnboarding = async () => {
    setVoiceError("");
    setError("");
    setIsConnectingVoice(true);

    try {
      if (sessionStatus !== "disconnected") {
        return;
      }

      setSessionStatus("connecting");

      const response = await fetch("/api/session", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Could not fetch realtime session token.");
      }

      const tokenPayload = (await response.json()) as { client_secret?: { value?: string } };
      const ephemeralKey = tokenPayload.client_secret?.value;
      if (!ephemeralKey) {
        throw new Error("Received empty OpenAI realtime session key.");
      }

      if (!audioElementRef.current) {
        const audio = new Audio();
        audio.autoplay = true;
        audioElementRef.current = audio;
      }

      const { pc, dataChannel } = await createRealtimeConnection(ephemeralKey, audioElementRef);
      peerConnectionRef.current = pc;
      dataChannelRef.current = dataChannel;

      localAudioTrackRef.current =
        pc.getSenders().find((sender) => sender.track?.kind === "audio")?.track ?? null;
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.enabled = !isMuted && !isAssistantSpeaking;
      }

      dataChannel.addEventListener("message", handleRealtimeEvent);

      dataChannel.addEventListener("open", () => {
        setSessionStatus("connected");

        dataChannel.send(
          JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: `${onboardingSystemPrompt} ${openAiToolInstructions}`,
              voice: "sage",
              input_audio_transcription: { model: "whisper-1" },
              turn_detection: {
                type: "server_vad",
                threshold: 0.75,
                prefix_padding_ms: 220,
                silence_duration_ms: 900,
              },
              tools: [
                {
                  type: "function",
                  name: "set_native_language",
                  description: "Set the native language select value.",
                  parameters: {
                    type: "object",
                    properties: {
                      native_language: {
                        type: "string",
                        enum: ["english", "french", "spanish"],
                      },
                    },
                    required: ["native_language"],
                    additionalProperties: false,
                  },
                },
                {
                  type: "function",
                  name: "set_target_language",
                  description: "Set the target language select value.",
                  parameters: {
                    type: "object",
                    properties: {
                      target_language: {
                        type: "string",
                        enum: ["english", "french", "spanish"],
                      },
                    },
                    required: ["target_language"],
                    additionalProperties: false,
                  },
                },
                {
                  type: "function",
                  name: "set_language_pair",
                  description: "Set both native and target languages in one tool call.",
                  parameters: {
                    type: "object",
                    properties: {
                      native_language: {
                        type: "string",
                        enum: ["english", "french", "spanish"],
                      },
                      target_language: {
                        type: "string",
                        enum: ["english", "french", "spanish"],
                      },
                    },
                    required: ["native_language", "target_language"],
                    additionalProperties: false,
                  },
                },
              ],
            },
          })
        );

        dataChannel.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: "Start onboarding. Ask me for my native language and target language.",
                },
              ],
            },
          })
        );

        dataChannel.send(JSON.stringify({ type: "response.create" }));
      });

      dataChannel.addEventListener("close", () => {
        setSessionStatus("disconnected");
      });

      dataChannel.addEventListener("error", () => {
        setVoiceError("Realtime voice connection error.");
      });
    } catch (err) {
      setSessionStatus("disconnected");
      setVoiceError(err instanceof Error ? err.message : "Could not start voice onboarding.");
    } finally {
      setIsConnectingVoice(false);
    }
  };

  const toggleMute = () => {
    setIsMuted((previous) => !previous);
  };

  const selectedNative = supportedLanguages.find((language) => String(language.id) === nativeLanguageId);
  const selectedTarget = supportedLanguages.find((language) => String(language.id) === targetLanguageId);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-[#d6cfc8] bg-gradient-to-br from-[#fff7ef] via-[#f9f4ec] to-[#e9f5f1] p-6 shadow-xl md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-block rounded-full bg-[#4a3728] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#fff2df]">
            Voice Onboarding
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[#2f241d] md:text-5xl">Set Up Your Learning with Realtime Voice</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#4f453d] md:text-base">
            This flow uses OpenAI Realtime Voice. Speak naturally, then review and confirm your language pair.
          </p>
        </div>

        <div className="rounded-2xl border border-[#cbb79e] bg-[#fff3df] px-4 py-3 text-sm text-[#5b4331]">
          <p className="font-semibold">Voice status: {sessionStatus}</p>
          <p>Mic: {isMuted ? "muted" : "live"}</p>
          <p>Assistant: {isAssistantSpeaking ? "speaking" : "idle"}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={startVoiceOnboarding}
          disabled={isConnectingVoice || sessionStatus === "connected" || supportedLanguages.length === 0}
          className="rounded-xl bg-[#2f241d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1712] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnectingVoice ? "Connecting..." : "Start Voice Session"}
        </button>

        <button
          type="button"
          onClick={disconnectSession}
          disabled={sessionStatus !== "connected"}
          className="rounded-xl bg-[#8b6a4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#77563f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          End Session
        </button>

        <button
          type="button"
          onClick={toggleMute}
          disabled={sessionStatus !== "connected"}
          className="rounded-xl border border-[#8b6a4f] bg-white px-4 py-3 text-sm font-semibold text-[#5d4838] transition hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMuted ? "Unmute Mic" : "Mute Mic"}
        </button>
      </div>

      {voiceError ? <p className="mb-4 rounded-md bg-[#ffe8e6] px-4 py-3 text-sm text-[#a13934]">{voiceError}</p> : null}

      <div className="mb-8 rounded-2xl border border-[#d6cec4] bg-white/70 p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#68574a]">Live transcript</p>
        {transcript.length === 0 ? (
          <p className="text-sm text-[#736455]">No finalized messages yet. Start a voice session and speak to begin.</p>
        ) : (
          <div className="space-y-3">
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl px-4 py-3 text-sm ${entry.role === "assistant" ? "bg-[#e9f6f0] text-[#28473a]" : "bg-[#f4efe8] text-[#3d332c]"}`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
                  {entry.role === "assistant" ? "Guide" : "You"}
                </p>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="nativeLanguage" className="mb-2 block text-sm font-semibold text-[#4a3728]">
            Native language
          </label>
          <select
            id="nativeLanguage"
            value={nativeLanguageId}
            onChange={(event) => setNativeLanguageId(event.target.value)}
            className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
          >
            <option value="">Select native language</option>
            {supportedLanguages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="targetLanguage" className="mb-2 block text-sm font-semibold text-[#4a3728]">
            Target language
          </label>
          <select
            id="targetLanguage"
            value={targetLanguageId}
            onChange={(event) => setTargetLanguageId(event.target.value)}
            className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
          >
            <option value="">Select target language</option>
            {targetLanguageOptions.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#dccfc2] bg-[#fffaf3] p-4 text-sm text-[#5b4b3d]">
        <p className="font-semibold">Current selection</p>
        <p className="mt-1">Native: {selectedNative?.name ?? "Not selected"}</p>
        <p>Target: {selectedTarget?.name ?? "Not selected"}</p>
        <p className="mt-2 text-xs">
          Allowed target keys for current native: {allowedTargetKeys.length > 0 ? allowedTargetKeys.join(", ") : "none"}
        </p>
      </div>

      {supportedLanguages.length === 0 ? (
        <p className="mt-5 text-sm text-red-700">
          No supported onboarding languages were found in your language catalog. Ensure English, French, and Spanish exist in backend languages.
        </p>
      ) : null}

      {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-[#2f241d] py-3 text-sm font-semibold text-white transition hover:bg-[#1f1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Complete Onboarding"}
      </button>
    </div>
  );
}

function HumeVoiceOnboardingPanel({
  supportedLanguages,
  targetLanguageOptions,
  nativeLanguageId,
  targetLanguageId,
  setNativeLanguageId,
  setTargetLanguageId,
  allowedTargetKeys,
  isSubmitting,
  error,
  setError,
  onSubmit,
}: VoiceOnboardingPanelProps) {
  const {
    connect,
    disconnect,
    mute,
    unmute,
    isMuted,
    messages,
    lastUserMessage,
    sendUserInput,
    status,
  } = useVoice();

  const [voiceError, setVoiceError] = useState("");
  const [isConnectingVoice, setIsConnectingVoice] = useState(false);
  const lastHandledUtteranceRef = useRef<string>("");

  const languageByKey = useMemo(() => {
    const map = new Map<string, LanguageOption>();
    for (const language of supportedLanguages) {
      map.set(getLanguageKey(language), language);
    }
    return map;
  }, [supportedLanguages]);

  const transcript = useMemo(() => {
    return messages
      .filter((message) => {
        if (typeof message !== "object" || message === null || !("type" in message)) {
          return false;
        }

        return message.type === "assistant_message" || message.type === "user_message";
      })
      .filter((message) => {
        if (message.type !== "user_message") {
          return true;
        }

        return message.interim === false;
      })
      .map((message, index) => ({
        id: "id" in message && message.id ? message.id : `${message.type}-${index}`,
        role: message.type === "assistant_message" ? "assistant" : "user",
        text: message.message.content ?? "",
      }))
      .filter((entry) => entry.text.trim().length > 0)
      .slice(-8);
  }, [messages]);

  useEffect(() => {
    const content = lastUserMessage?.message.content;
    if (!content) {
      return;
    }

    const normalizedContent = content.trim().toLowerCase();
    if (!normalizedContent || normalizedContent === lastHandledUtteranceRef.current) {
      return;
    }

    lastHandledUtteranceRef.current = normalizedContent;

    const { nativeKey: spokenNativeKey, targetKey: spokenTargetKey, mentionedKeys } = extractSpokenLanguageSelection(content);
    if (!spokenNativeKey && !spokenTargetKey && mentionedKeys.length === 0) {
      return;
    }

    let nativeKeyToApply = spokenNativeKey;
    let targetKeyToApply = spokenTargetKey;

    if (!nativeKeyToApply && !targetKeyToApply && mentionedKeys.length >= 2) {
      [nativeKeyToApply, targetKeyToApply] = mentionedKeys;
    }

    if (!nativeKeyToApply && !targetKeyToApply && mentionedKeys.length === 1) {
      if (normalizedContent.includes("native")) {
        nativeKeyToApply = mentionedKeys[0];
      } else if (normalizedContent.includes("target") || normalizedContent.includes("learn")) {
        targetKeyToApply = mentionedKeys[0];
      }
    }

    if (nativeKeyToApply) {
      const nativeCandidate = languageByKey.get(nativeKeyToApply);
      if (nativeCandidate) {
        const nextNativeId = String(nativeCandidate.id);
        if (nextNativeId !== nativeLanguageId) {
          setNativeLanguageId(nextNativeId);
        }
      }
    }

    const effectiveNativeKey = nativeKeyToApply
      ?? (nativeLanguageId
        ? getLanguageKey(
          supportedLanguages.find((language) => String(language.id) === nativeLanguageId)
          ?? ({ code: "", name: "" } as LanguageOption)
        )
        : undefined);

    if (!targetKeyToApply && mentionedKeys.length > 0) {
      const fallbackTarget = mentionedKeys.find((key) => key !== nativeKeyToApply);
      if (fallbackTarget) {
        targetKeyToApply = fallbackTarget;
      }
    }

    if (!targetKeyToApply) {
      return;
    }

    const targetCandidate = languageByKey.get(targetKeyToApply);
    if (!targetCandidate) {
      return;
    }

    if (effectiveNativeKey) {
      const allowedForNative = allowedTargetsByNative[effectiveNativeKey] ?? [];
      if (!allowedForNative.includes(targetKeyToApply)) {
        setError("That target language is not available for your selected native language yet.");
        return;
      }
    }

    const nextTargetId = String(targetCandidate.id);
    if (nextTargetId !== targetLanguageId) {
      setError("");
      setTargetLanguageId(nextTargetId);
    }
  }, [lastUserMessage, nativeLanguageId, targetLanguageId, languageByKey, setNativeLanguageId, setTargetLanguageId, setError, supportedLanguages]);

  const startVoiceOnboarding = async () => {
    setVoiceError("");
    setError("");
    setIsConnectingVoice(true);

    try {
      const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID;
      if (!configId) {
        throw new Error("NEXT_PUBLIC_HUME_CONFIG_ID is missing. Point it to your EVI 4 mini config.");
      }

      const response = await fetch("/api/hume/access-token", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || "Could not fetch Hume access token.");
      }

      const tokenPayload = (await response.json()) as HumeAccessTokenResponse;
      if (!tokenPayload.accessToken) {
        throw new Error("Received empty Hume access token.");
      }

      await connect({
        auth: { type: "accessToken", value: tokenPayload.accessToken },
        configId,
        verboseTranscription: true,
        sessionSettings: {
          type: "session_settings",
          systemPrompt: onboardingSystemPrompt,
        },
      });

      sendUserInput("Start onboarding. Ask me for my native language and target language.");
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Could not start voice onboarding.");
    } finally {
      setIsConnectingVoice(false);
    }
  };

  const selectedNative = supportedLanguages.find((language) => String(language.id) === nativeLanguageId);
  const selectedTarget = supportedLanguages.find((language) => String(language.id) === targetLanguageId);

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-[#d6cfc8] bg-gradient-to-br from-[#fff7ef] via-[#f9f4ec] to-[#e9f5f1] p-6 shadow-xl md:p-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 inline-block rounded-full bg-[#4a3728] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#fff2df]">
            Voice Onboarding
          </p>
          <h1 className="text-3xl font-black tracking-tight text-[#2f241d] md:text-5xl">Set Up Your Learning with Realtime Voice</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#4f453d] md:text-base">
            This flow uses Hume EVI. Speak naturally, then review and confirm your language pair.
          </p>
        </div>

        <div className="rounded-2xl border border-[#cbb79e] bg-[#fff3df] px-4 py-3 text-sm text-[#5b4331]">
          <p className="font-semibold">Voice status: {status.value}</p>
          <p>Mic: {isMuted ? "muted" : "live"}</p>
        </div>
      </div>

      <div className="mb-8 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={startVoiceOnboarding}
          disabled={isConnectingVoice || status.value === "connected" || supportedLanguages.length === 0}
          className="rounded-xl bg-[#2f241d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1712] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConnectingVoice ? "Connecting..." : "Start Voice Session"}
        </button>

        <button
          type="button"
          onClick={() => disconnect()}
          disabled={status.value !== "connected"}
          className="rounded-xl bg-[#8b6a4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#77563f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          End Session
        </button>

        <button
          type="button"
          onClick={() => (isMuted ? unmute() : mute())}
          disabled={status.value !== "connected"}
          className="rounded-xl border border-[#8b6a4f] bg-white px-4 py-3 text-sm font-semibold text-[#5d4838] transition hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMuted ? "Unmute Mic" : "Mute Mic"}
        </button>
      </div>

      {voiceError ? <p className="mb-4 rounded-md bg-[#ffe8e6] px-4 py-3 text-sm text-[#a13934]">{voiceError}</p> : null}

      <div className="mb-8 rounded-2xl border border-[#d6cec4] bg-white/70 p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#68574a]">Live transcript</p>
        {transcript.length === 0 ? (
          <p className="text-sm text-[#736455]">No finalized messages yet. Start a voice session and speak to begin.</p>
        ) : (
          <div className="space-y-3">
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl px-4 py-3 text-sm ${entry.role === "assistant" ? "bg-[#e9f6f0] text-[#28473a]" : "bg-[#f4efe8] text-[#3d332c]"}`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
                  {entry.role === "assistant" ? "Guide" : "You"}
                </p>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="nativeLanguage" className="mb-2 block text-sm font-semibold text-[#4a3728]">
            Native language
          </label>
          <select
            id="nativeLanguage"
            value={nativeLanguageId}
            onChange={(event) => setNativeLanguageId(event.target.value)}
            className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
          >
            <option value="">Select native language</option>
            {supportedLanguages.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="targetLanguage" className="mb-2 block text-sm font-semibold text-[#4a3728]">
            Target language
          </label>
          <select
            id="targetLanguage"
            value={targetLanguageId}
            onChange={(event) => setTargetLanguageId(event.target.value)}
            className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
          >
            <option value="">Select target language</option>
            {targetLanguageOptions.map((language) => (
              <option key={language.id} value={language.id}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#dccfc2] bg-[#fffaf3] p-4 text-sm text-[#5b4b3d]">
        <p className="font-semibold">Current selection</p>
        <p className="mt-1">Native: {selectedNative?.name ?? "Not selected"}</p>
        <p>Target: {selectedTarget?.name ?? "Not selected"}</p>
        <p className="mt-2 text-xs">
          Allowed target keys for current native: {allowedTargetKeys.length > 0 ? allowedTargetKeys.join(", ") : "none"}
        </p>
      </div>

      {supportedLanguages.length === 0 ? (
        <p className="mt-5 text-sm text-red-700">
          No supported onboarding languages were found in your language catalog. Ensure English, French, and Spanish exist in backend languages.
        </p>
      ) : null}

      {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={isSubmitting}
        className="mt-6 w-full rounded-xl bg-[#2f241d] py-3 text-sm font-semibold text-white transition hover:bg-[#1f1712] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Complete Onboarding"}
      </button>
    </div>
  );
}
