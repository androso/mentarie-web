"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { LanguageOption } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useOpenAIVoice } from "@/hooks/voice/useOpenAIVoice";
import type { AgentConfig } from "@/lib/types";

type OnboardingResponse = {
	success: boolean;
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
	"Once both languages are confirmed by the user, call complete_onboarding to submit and finish setup.",
].join(" ");

const onboardingTools: AgentConfig["tools"] = [
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
	{
		type: "function",
		name: "complete_onboarding",
		description:
			"Submit the onboarding form and finish setup. Call this only after both native and target languages have been confirmed by the user.",
		parameters: {
			type: "object",
			properties: {},
			required: [],
			additionalProperties: false,
		},
	},
];

function getLanguageKey(language: LanguageOption): string {
	const raw = `${language.code} ${language.name}`.trim().toLowerCase();
	if (
		raw.includes("english") ||
		raw.includes(" en") ||
		raw.startsWith("en") ||
		raw.includes("en-")
	)
		return "english";
	if (
		raw.includes("french") ||
		raw.includes("francais") ||
		raw.includes("français") ||
		raw.includes(" fr") ||
		raw.startsWith("fr") ||
		raw.includes("fr-")
	)
		return "french";
	if (
		raw.includes("spanish") ||
		raw.includes("espanol") ||
		raw.includes("español") ||
		raw.includes(" es") ||
		raw.startsWith("es") ||
		raw.includes("es-")
	)
		return "spanish";
	return raw;
}

export default function OnboardingPage() {
	const router = useRouter();
	const { user, learningLanguages, nativeLanguage, isLoading } = useAuth();
	const [nativeLanguageId, setNativeLanguageId] = useState<string>("");
	const [targetLanguageId, setTargetLanguageId] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: languageOptions, isLoading: isLanguageOptionsLoading } =
		useQuery<LanguageOption[]>({
			queryKey: ["/api/user/language-options"],
			queryFn: getQueryFn<LanguageOption[]>({ on401: "throw" }),
			enabled: !!user,
		});

	const supportedLanguages = useMemo(() => {
		return (languageOptions ?? []).filter((language) =>
			supportedLanguageKeys.includes(
				getLanguageKey(language) as (typeof supportedLanguageKeys)[number],
			),
		);
	}, [languageOptions]);

	useEffect(() => {
		if (nativeLanguageId || !nativeLanguage || supportedLanguages.length === 0)
			return;
		const matched = supportedLanguages.find(
			(l) => String(l.id) === String(nativeLanguage.id),
		);
		if (matched) setNativeLanguageId(String(matched.id));
	}, [nativeLanguageId, nativeLanguage, supportedLanguages]);

	useEffect(() => {
		if (
			targetLanguageId ||
			learningLanguages.length === 0 ||
			supportedLanguages.length === 0
		)
			return;
		const matched = supportedLanguages.find(
			(l) => String(l.id) === String(learningLanguages[0].languageId),
		);
		if (matched) setTargetLanguageId(String(matched.id));
	}, [targetLanguageId, learningLanguages, supportedLanguages]);

	const selectedNativeLanguage = useMemo(
		() => supportedLanguages.find((l) => String(l.id) === nativeLanguageId),
		[supportedLanguages, nativeLanguageId],
	);

	const allowedTargetKeys = useMemo(() => {
		if (!selectedNativeLanguage) return [];
		return allowedTargetsByNative[getLanguageKey(selectedNativeLanguage)] ?? [];
	}, [selectedNativeLanguage]);

	const targetLanguageOptions = useMemo(
		() =>
			supportedLanguages.filter((l) =>
				allowedTargetKeys.includes(getLanguageKey(l)),
			),
		[supportedLanguages, allowedTargetKeys],
	);

	useEffect(() => {
		if (!targetLanguageId) return;
		const stillValid = targetLanguageOptions.some(
			(l) => String(l.id) === targetLanguageId,
		);
		if (!stillValid) setTargetLanguageId("");
	}, [targetLanguageId, targetLanguageOptions]);

	useEffect(() => {
		if (!isLoading && !user) router.push("/");
	}, [isLoading, user, router]);

	const submitOnboarding = async () => {
		setError("");
		if (!nativeLanguageId || !targetLanguageId) {
			setError("Please choose both native and target language.");
			return;
		}
		const selectedTarget = supportedLanguages.find(
			(l) => String(l.id) === targetLanguageId,
		);
		if (!selectedNativeLanguage || !selectedTarget) {
			setError("Please select supported onboarding languages.");
			return;
		}
		if (!allowedTargetKeys.includes(getLanguageKey(selectedTarget))) {
			setError(
				"That target language is not available for your selected native language yet.",
			);
			return;
		}
		setIsSubmitting(true);
		try {
			const response = await apiRequest("POST", "/api/user/onboarding", {
				nativeLanguageId: Number(nativeLanguageId),
				targetLanguageId: Number(targetLanguageId),
			});
			(await response.json()) as OnboardingResponse;
			await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
			router.push("/home");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not complete onboarding.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading || isLanguageOptionsLoading) {
		return <div className="min-h-screen bg-[#f5f2ef]" />;
	}

	if (!user) return null;

	return (
		<main className="min-h-screen bg-[#f5f2ef] py-10 px-4">
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
	const [pendingSubmit, setPendingSubmit] = useState(false);
	const [voiceError, setVoiceError] = useState("");

	// Keep refs for current IDs so toolLogic closures always see latest values
	const nativeLanguageIdRef = useRef(nativeLanguageId);
	const targetLanguageIdRef = useRef(targetLanguageId);
	useEffect(() => {
		nativeLanguageIdRef.current = nativeLanguageId;
	}, [nativeLanguageId]);
	useEffect(() => {
		targetLanguageIdRef.current = targetLanguageId;
	}, [targetLanguageId]);

	const languageByKey = useMemo(() => {
		const map = new Map<string, LanguageOption>();
		for (const language of supportedLanguages) {
			map.set(getLanguageKey(language), language);
		}
		return map;
	}, [supportedLanguages]);

	const applyOnboardingLanguageUpdate = useCallback(
		({
			nativeLanguageKey,
			targetLanguageKey,
		}: {
			nativeLanguageKey?: string;
			targetLanguageKey?: string;
		}) => {
			const currentNativeId = nativeLanguageIdRef.current;
			const currentTargetId = targetLanguageIdRef.current;

			const nextNative = nativeLanguageKey
				? languageByKey.get(nativeLanguageKey)
				: undefined;
			if (nativeLanguageKey && !nextNative) {
				return {
					success: false,
					message: `Unsupported native language: ${nativeLanguageKey}`,
				};
			}
			const nextTarget = targetLanguageKey
				? languageByKey.get(targetLanguageKey)
				: undefined;
			if (targetLanguageKey && !nextTarget) {
				return {
					success: false,
					message: `Unsupported target language: ${targetLanguageKey}`,
				};
			}

			const effectiveNativeId = nextNative
				? String(nextNative.id)
				: currentNativeId;
			const effectiveNative = supportedLanguages.find(
				(l) => String(l.id) === effectiveNativeId,
			);
			const effectiveNativeKey = effectiveNative
				? getLanguageKey(effectiveNative)
				: undefined;

			if (targetLanguageKey && effectiveNativeKey) {
				const allowed = allowedTargetsByNative[effectiveNativeKey] ?? [];
				if (!allowed.includes(targetLanguageKey)) {
					const message =
						"That target language is not available for the selected native language yet.";
					setError(message);
					return { success: false, message };
				}
			}

			if (nextNative) {
				const id = String(nextNative.id);
				if (id !== currentNativeId) setNativeLanguageId(id);
			}
			if (nextTarget) {
				const id = String(nextTarget.id);
				if (id !== currentTargetId) setTargetLanguageId(id);
			}

			setError("");
			return {
				success: true,
				nativeLanguageId: nextNative ? String(nextNative.id) : currentNativeId,
				targetLanguageId: nextTarget ? String(nextTarget.id) : currentTargetId,
			};
		},
		[
			languageByKey,
			supportedLanguages,
			setNativeLanguageId,
			setTargetLanguageId,
			setError,
		],
	);

	const onFunctionCall = useCallback(
		(name: string, args: Record<string, unknown>) => {
			if (name === "set_native_language") {
				return applyOnboardingLanguageUpdate({
					nativeLanguageKey: args.native_language as string,
				});
			}
			if (name === "set_target_language") {
				return applyOnboardingLanguageUpdate({
					targetLanguageKey: args.target_language as string,
				});
			}
			if (name === "set_language_pair") {
				return applyOnboardingLanguageUpdate({
					nativeLanguageKey: args.native_language as string,
					targetLanguageKey: args.target_language as string,
				});
			}
			if (name === "complete_onboarding") {
				if (!nativeLanguageIdRef.current || !targetLanguageIdRef.current) {
					return {
						success: false,
						message: "Both native and target languages must be set first.",
					};
				}
				setPendingSubmit(true);
				return {
					success: true,
					message: "Onboarding will be submitted once you finish speaking.",
				};
			}
			return { status: "ok" };
		},
		[applyOnboardingLanguageUpdate],
	);

	const agentConfig = useMemo<AgentConfig>(
		() => ({
			name: "onboarding",
			publicDescription: "Voice onboarding guide for language selection",
			instructions: `${onboardingSystemPrompt} ${openAiToolInstructions}`,
			tools: onboardingTools,
		}),
		[],
	);

	const session = useOpenAIVoice({
		agentConfig,
		onFunctionCall,
		turnDetection: {
			type: "server_vad",
			threshold: 0.75,
			prefix_padding_ms: 220,
			silence_duration_ms: 900,
		},
	});

	// Submit once the AI has finished its confirmation speech
	useEffect(() => {
		if (pendingSubmit && !session.isAgentSpeaking) {
			setPendingSubmit(false);
			void onSubmit();
		}
	}, [pendingSubmit, session.isAgentSpeaking, onSubmit]);

	const connect = async () => {
		setVoiceError("");
		try {
			await session.connect();
		} catch (err) {
			setVoiceError(
				err instanceof Error
					? err.message
					: "Could not start voice onboarding.",
			);
		}
	};

	const selectedNative = supportedLanguages.find(
		(l) => String(l.id) === nativeLanguageId,
	);
	const selectedTarget = supportedLanguages.find(
		(l) => String(l.id) === targetLanguageId,
	);

	// Show last 8 transcript entries
	const recentTranscript = useMemo(
		() => session.transcript.slice(-8),
		[session.transcript],
	);

	return (
		<div className="mx-auto max-w-4xl rounded-3xl border border-[#d6cfc8] bg-gradient-to-br from-[#fff7ef] via-[#f9f4ec] to-[#e9f5f1] p-6 shadow-xl md:p-10">
			<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<p className="mb-2 inline-block rounded-full bg-[#4a3728] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#fff2df]">
						Voice Onboarding
					</p>
					<h1 className="text-3xl font-black tracking-tight text-[#2f241d] md:text-5xl">
						Set Up Your Learning with Realtime Voice
					</h1>
					<p className="mt-3 max-w-2xl text-sm text-[#4f453d] md:text-base">
						This flow uses OpenAI Realtime Voice. Speak naturally, then review
						and confirm your language pair.
					</p>
				</div>

				<div className="rounded-2xl border border-[#cbb79e] bg-[#fff3df] px-4 py-3 text-sm text-[#5b4331]">
					<p className="font-semibold">
						Voice status: {session.status.toLowerCase()}
					</p>
					<p>Mic: {session.isMuted ? "muted" : "live"}</p>
					<p>Assistant: {session.isAgentSpeaking ? "speaking" : "idle"}</p>
				</div>
			</div>

			<div className="mb-8 grid gap-3 md:grid-cols-3">
				<button
					type="button"
					onClick={() => void connect()}
					disabled={
						session.status !== "DISCONNECTED" || supportedLanguages.length === 0
					}
					className="rounded-xl bg-[#2f241d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1f1712] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{session.status === "CONNECTING"
						? "Connecting..."
						: "Start Voice Session"}
				</button>

				<button
					type="button"
					onClick={session.disconnect}
					disabled={session.status !== "CONNECTED"}
					className="rounded-xl bg-[#8b6a4f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#77563f] disabled:cursor-not-allowed disabled:opacity-60"
				>
					End Session
				</button>

				<button
					type="button"
					onClick={session.toggleMute}
					disabled={session.status !== "CONNECTED"}
					className="rounded-xl border border-[#8b6a4f] bg-white px-4 py-3 text-sm font-semibold text-[#5d4838] transition hover:bg-[#fffaf3] disabled:cursor-not-allowed disabled:opacity-60"
				>
					{session.isMuted ? "Unmute Mic" : "Mute Mic"}
				</button>
			</div>

			{voiceError ? (
				<p className="mb-4 rounded-md bg-[#ffe8e6] px-4 py-3 text-sm text-[#a13934]">
					{voiceError}
				</p>
			) : null}

			<div className="mb-8 rounded-2xl border border-[#d6cec4] bg-white/70 p-4">
				<p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#68574a]">
					Live transcript
				</p>
				{recentTranscript.length === 0 ? (
					<p className="text-sm text-[#736455]">
						No finalized messages yet. Start a voice session and speak to begin.
					</p>
				) : (
					<div className="space-y-3">
						{recentTranscript.map((entry) => (
							<div
								key={entry.itemId}
								className={`rounded-xl px-4 py-3 text-sm ${
									entry.role === "assistant"
										? "bg-[#e9f6f0] text-[#28473a]"
										: "bg-[#f4efe8] text-[#3d332c]"
								}`}
							>
								<p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">
									{entry.role === "assistant" ? "Guide" : "You"}
								</p>
								<p>{entry.title}</p>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<label
						htmlFor="nativeLanguage"
						className="mb-2 block text-sm font-semibold text-[#4a3728]"
					>
						Native language
					</label>
					<select
						id="nativeLanguage"
						value={nativeLanguageId}
						onChange={(e) => setNativeLanguageId(e.target.value)}
						className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
					>
						<option value="">Select native language</option>
						{supportedLanguages.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
							</option>
						))}
					</select>
				</div>

				<div>
					<label
						htmlFor="targetLanguage"
						className="mb-2 block text-sm font-semibold text-[#4a3728]"
					>
						Target language
					</label>
					<select
						id="targetLanguage"
						value={targetLanguageId}
						onChange={(e) => setTargetLanguageId(e.target.value)}
						className="w-full rounded-lg border border-[#ccb9a8] bg-white px-3 py-3 text-[#33271f]"
					>
						<option value="">Select target language</option>
						{targetLanguageOptions.map((l) => (
							<option key={l.id} value={l.id}>
								{l.name}
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
					Allowed target keys for current native:{" "}
					{allowedTargetKeys.length > 0 ? allowedTargetKeys.join(", ") : "none"}
				</p>
			</div>

			{supportedLanguages.length === 0 ? (
				<p className="mt-5 text-sm text-red-700">
					No supported onboarding languages were found. Ensure English, French,
					and Spanish exist in backend languages.
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
