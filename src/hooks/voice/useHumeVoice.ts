"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useVoice, VoiceReadyState } from "@humeai/voice-react";
import { useTranscript } from "@/contexts/TranscriptContext";
import type { VoiceSession, HumeVoiceOptions } from "@/lib/voice/types";
import type { VoiceStatus } from "@/lib/voice/types";
import { apiRequest } from "@/lib/queryClient";

// Must be called inside a HumeVoiceProvider ancestor.
export function useHumeVoice({ configId, onEmotion }: HumeVoiceOptions): VoiceSession {
    const {
        transcriptItems,
        addTranscriptMessage,
        clearTranscriptItems,
    } = useTranscript();

    const {
        connect: humeConnect,
        disconnect: humeDisconnect,
        sendUserInput,
        mute: humeMute,
        unmute: humeUnmute,
        isMuted,
        readyState,
        isPlaying,
        messages,
        lastVoiceMessage,
        error,
    } = useVoice();

    // Sync the latest Hume message into TranscriptContext.
    // We depend on messages.length so we only run when a new message is appended.
    const messagesLength = messages.length;
    useEffect(() => {
        if (!messagesLength) return;
        const latest = messages[messagesLength - 1] as any;
        if (latest.type === "user_message" || latest.type === "assistant_message") {
            const role: "user" | "assistant" =
                latest.type === "user_message" ? "user" : "assistant";
            const text: string = latest.message?.content ?? "";
            // Use receivedAt timestamp as itemId — unique per message
            const itemId = (latest.receivedAt as Date).toISOString();
            addTranscriptMessage(itemId, role, text);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messagesLength]);

    // Surface emotion prosody scores when the assistant finishes speaking
    useEffect(() => {
        if (!onEmotion || !lastVoiceMessage) return;
        const scores = (lastVoiceMessage as any)?.models?.prosody?.scores as
            | Record<string, number>
            | undefined;
        if (scores) onEmotion(scores);
    }, [lastVoiceMessage, onEmotion]);

    const voiceStatus = useMemo<VoiceStatus>(() => {
        if (error) return "ERROR";
        switch (readyState) {
            case VoiceReadyState.OPEN:       return "CONNECTED";
            case VoiceReadyState.CONNECTING: return "CONNECTING";
            default:                          return "DISCONNECTED";
        }
    }, [readyState, error]);

    const connect = useCallback(async () => {
        const res = await apiRequest("GET", "/api/hume/access-token");
        const data = await res.json();
        await humeConnect({
            auth: { type: "accessToken", value: data.accessToken },
            configId,
            verboseTranscription: true,
        } as any);
    }, [humeConnect, configId]);

    const disconnect = useCallback(() => {
        humeDisconnect();
    }, [humeDisconnect]);

    return useMemo<VoiceSession>(
        () => ({
            status: voiceStatus,
            error: error?.message ?? null,
            connect,
            disconnect,
            isMuted: isMuted ?? false,
            mute: humeMute,
            unmute: humeUnmute,
            toggleMute: isMuted ? humeUnmute : humeMute,
            isAgentSpeaking: isPlaying,
            isUserSpeaking: false, // Hume uses server-side VAD; no client signal exposed
            startTurn: () => {},   // no-op: continuous VAD
            endTurn: () => {},
            sendTextMessage: sendUserInput,
            transcript: transcriptItems,
            clearTranscript: clearTranscriptItems,
        }),
        [
            voiceStatus,
            error,
            isMuted,
            isPlaying,
            transcriptItems,
            connect,
            disconnect,
            humeMute,
            humeUnmute,
            sendUserInput,
            clearTranscriptItems,
        ]
    );
}
