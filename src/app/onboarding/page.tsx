"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { LanguageOption } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

type OnboardingResponse = {
  success: boolean;
};

const supportedLanguageKeys = ["english", "french", "spanish"] as const;

const allowedTargetsByNative: Record<string, string[]> = {
  english: ["french", "spanish"],
  french: ["english", "spanish"],
  spanish: ["english", "french"],
};

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

  const onboardingCompleted = useMemo(() => {
    return Boolean(nativeLanguage) && learningLanguages.length > 0;
  }, [learningLanguages.length, nativeLanguage]);

  const supportedLanguages = useMemo(() => {
    return (languageOptions ?? []).filter((language) =>
      supportedLanguageKeys.includes(getLanguageKey(language) as (typeof supportedLanguageKeys)[number])
    );
  }, [languageOptions]);

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
      return;
    }

    if (!isLoading && user && onboardingCompleted) {
      router.push("/home");
    }
  }, [isLoading, user, onboardingCompleted, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
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

  if (!user || onboardingCompleted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f5f2ef] py-10 px-4">
      <div className="mx-auto max-w-xl rounded-2xl bg-white shadow-md p-8">
        <h1 className="text-3xl font-bold text-[#4a3728] mb-2">Set Up Your Learning</h1>
        <p className="text-gray-600 mb-8">
          Tell us your native language and your target language. We will start your target language at A1.
        </p>
        <p className="text-sm text-[#4a3728] mb-6">
          Available pairs for now: French/Spanish -> English, English/Spanish -> French, English/French -> Spanish.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nativeLanguage" className="block text-sm font-medium text-[#4a3728] mb-2">
              Native language
            </label>
            <select
              id="nativeLanguage"
              value={nativeLanguageId}
              onChange={(event) => setNativeLanguageId(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select native language</option>
              {supportedLanguages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            {supportedLanguages.length === 0 ? (
              <p className="mt-2 text-xs text-red-600">No supported onboarding languages were found in your language catalog. Please ensure English, French, and Spanish exist in backend languages.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="targetLanguage" className="block text-sm font-medium text-[#4a3728] mb-2">
              Target language
            </label>
            <select
              id="targetLanguage"
              value={targetLanguageId}
              onChange={(event) => setTargetLanguageId(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Select target language</option>
              {targetLanguageOptions.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            {!nativeLanguageId ? (
              <p className="mt-2 text-xs text-gray-500">Choose your native language first to see available target languages.</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#4a3728] text-white py-3 rounded-md hover:bg-[#3a2a1f] disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
