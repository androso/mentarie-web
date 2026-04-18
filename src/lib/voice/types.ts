import type { TranscriptItem, AgentConfig } from "@/lib/types";

export type VoiceStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "ERROR";

export interface VoiceSession {
    status: VoiceStatus;
    error: string | null;

    connect: () => Promise<void>;
    disconnect: () => void;

    isMuted: boolean;
    mute: () => void;
    unmute: () => void;
    toggleMute: () => void;

    // True while the AI is producing audio output
    isAgentSpeaking: boolean;
    // True while the user has the PTT button held (OpenAI) or false (Hume uses server-side VAD)
    isUserSpeaking: boolean;

    // PTT controls — no-ops for Hume (continuous VAD), active for OpenAI PTT mode
    startTurn: () => void;
    endTurn: () => void;

    sendTextMessage: (text: string) => void;

    transcript: TranscriptItem[];
    clearTranscript: () => void;
}

export interface OpenAIVoiceTurnDetection {
    type: "server_vad";
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
}

export interface OpenAIVoiceOptions {
    agentConfig: AgentConfig;
    /** Called when OpenAI invokes a tool. Return value is sent back as function_call_output. */
    onFunctionCall?: (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>;
    /** Defaults to null (PTT mode). Pass server_vad config for automatic turn detection. */
    turnDetection?: OpenAIVoiceTurnDetection | null;
    voice?: string;
}

export interface HumeVoiceOptions {
    configId: string;
    onEmotion?: (scores: Record<string, number>) => void;
}
