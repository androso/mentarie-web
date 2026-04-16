"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { VoiceProvider, useVoice } from "@humeai/voice-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { LanguageOption } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

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

  return (
    <main className="min-h-screen bg-[#f5f2ef] py-10 px-4">
      <VoiceProvider clearMessagesOnDisconnect={false} messageHistoryLimit={48}>
        <VoiceOnboardingPanel
          supportedLanguages={supportedLanguages}
          targetLanguageOptions={targetLanguageOptions}
          nativeLanguageId={nativeLanguageId}
          targetLanguageId={targetLanguageId}
          setNativeLanguageId={setNativeLanguageId}
          setTargetLanguageId={setTargetLanguageId}
          allowedTargetKeys={allowedTargetKeys}
          isSubmitting={isSubmitting}
          error={error}
          setError={setError}
          onSubmit={submitOnboarding}
        />
      </VoiceProvider>
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

    const keys = extractMentionedLanguageKeys(content);
    if (keys.length === 0) {
      return;
    }

    if (!nativeLanguageId) {
      const nativeCandidate = languageByKey.get(keys[0]);
      if (nativeCandidate) {
        setNativeLanguageId(String(nativeCandidate.id));
      }
    }

    const effectiveNativeId = nativeLanguageId || String(languageByKey.get(keys[0])?.id ?? "");
    const effectiveNative = supportedLanguages.find((language) => String(language.id) === effectiveNativeId);
    const effectiveAllowedTargets = effectiveNative
      ? allowedTargetsByNative[getLanguageKey(effectiveNative)] ?? []
      : [];

    if (!targetLanguageId && effectiveAllowedTargets.length > 0) {
      const targetKey = keys.find((key) => effectiveAllowedTargets.includes(key));
      if (targetKey) {
        const targetCandidate = languageByKey.get(targetKey);
        if (targetCandidate) {
          setTargetLanguageId(String(targetCandidate.id));
        }
      }
    }
  }, [lastUserMessage, nativeLanguageId, targetLanguageId, languageByKey, setNativeLanguageId, setTargetLanguageId, supportedLanguages]);

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
            This flow uses Hume EVI with your EVI 4 mini configuration. Speak naturally, then review and confirm your language pair.
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
