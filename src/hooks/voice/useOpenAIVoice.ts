"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranscript } from "@/contexts/TranscriptContext";
import { useRealtimeConnection } from "@/hooks/useRealtimeConnection";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import type { VoiceSession, OpenAIVoiceOptions } from "@/lib/voice/types";
import type { ServerEvent } from "@/lib/types";

export function useOpenAIVoice({
    agentConfig,
    onFunctionCall,
    turnDetection = null,
    voice = "sage",
}: OpenAIVoiceOptions): VoiceSession {
    const {
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        updateTranscriptItem,
        clearTranscriptItems,
    } = useTranscript();

    const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

    const {
        dataChannel,
        sessionStatus,
        connect,
        disconnect: rtcDisconnect,
        sendClientEvent,
        isMuted,
        mute,
        unmute,
    } = useRealtimeConnection({});

    // Send session config once the WebRTC connection is established
    useEffect(() => {
        if (sessionStatus !== "CONNECTED") return;
        sendClientEvent({ type: "input_audio_buffer.clear" });
        sendClientEvent({
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                instructions: agentConfig.instructions,
                voice,
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: turnDetection,
                tools: agentConfig.tools,
            },
        });
        sendClientEvent({ type: "response.create" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus]);

    // OpenAI Realtime event handler — kept in a ref so the data channel
    // listener never needs to be re-registered as agentConfig/transcript change.
    const handleEvent = useCallback(
        (event: ServerEvent) => {
            switch (event.type) {
                case "output_audio_buffer.started":
                    setIsAgentSpeaking(true);
                    break;
                case "output_audio_buffer.stopped":
                    setIsAgentSpeaking(false);
                    break;

                case "conversation.item.created": {
                    const itemId = event.item?.id;
                    const role = event.item?.role as "user" | "assistant" | undefined;
                    const text =
                        event.item?.content?.[0]?.text ??
                        event.item?.content?.[0]?.transcript ??
                        "";
                    if (itemId && role && !transcriptItems.some((i) => i.itemId === itemId)) {
                        addTranscriptMessage(
                            itemId,
                            role,
                            role === "user" && !text ? "[Transcribing...]" : text
                        );
                    }
                    break;
                }

                case "conversation.item.input_audio_transcription.completed": {
                    const itemId = event.item_id;
                    const transcript =
                        !event.transcript || event.transcript === "\n"
                            ? "[inaudible]"
                            : event.transcript;
                    if (itemId) updateTranscriptMessage(itemId, transcript, false);
                    break;
                }

                case "response.audio_transcript.delta": {
                    const itemId = event.item_id;
                    if (itemId && event.delta) updateTranscriptMessage(itemId, event.delta, true);
                    break;
                }

                case "response.function_call_arguments.done": {
                    const funcName = (event as any).name as string;
                    const callId = (event as any).call_id as string;
                    let funcArgs: Record<string, unknown> = {};
                    try { funcArgs = JSON.parse((event as any).arguments ?? "{}"); } catch {}

                    const fn = agentConfig.toolLogic?.[funcName];
                    // toolLogic takes precedence; onFunctionCall return value is used as fallback result
                    const resultPromise = fn
                        ? Promise.resolve(fn(funcArgs, transcriptItems))
                        : Promise.resolve(onFunctionCall?.(funcName, funcArgs) ?? { status: "ok" });

                    resultPromise.then((result) => {
                        sendClientEvent({
                            type: "conversation.item.create",
                            item: {
                                type: "function_call_output",
                                call_id: callId,
                                output: JSON.stringify(result ?? { status: "ok" }),
                            },
                        });
                        sendClientEvent({ type: "response.create" });
                    });
                    break;
                }

                case "response.output_item.done": {
                    const itemId = event.item?.id;
                    if (itemId) updateTranscriptItem(itemId, { status: "DONE" });
                    break;
                }
            }
        },
        [
            agentConfig,
            onFunctionCall,
            transcriptItems,
            addTranscriptMessage,
            updateTranscriptMessage,
            updateTranscriptItem,
            sendClientEvent,
        ]
    );

    const handleEventRef = useRef(handleEvent);
    handleEventRef.current = handleEvent;

    // Wire data channel messages to the event handler.
    // Re-subscribes only when the dataChannel object changes (i.e. connect/disconnect).
    useEffect(() => {
        if (!dataChannel) return;
        const handler = (e: MessageEvent) => {
            try { handleEventRef.current(JSON.parse(e.data)); } catch {}
        };
        dataChannel.addEventListener("message", handler);
        return () => dataChannel.removeEventListener("message", handler);
    }, [dataChannel]);

    const ptt = usePushToTalk({ sessionStatus, dataChannel, sendClientEvent });

    const connectVoid = useCallback(async () => { await connect(); }, [connect]);

    const disconnect = useCallback(() => {
        sendClientEvent({ type: "response.cancel" });
        rtcDisconnect();
    }, [rtcDisconnect, sendClientEvent]);

    const sendTextMessage = useCallback(
        (text: string) => {
            if (!dataChannel) return;
            sendClientEvent({
                type: "conversation.item.create",
                item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
            });
            sendClientEvent({ type: "response.create" });
        },
        [dataChannel, sendClientEvent]
    );

    return useMemo<VoiceSession>(
        () => ({
            status: sessionStatus,
            error: null,
            connect: connectVoid,
            disconnect,
            isMuted,
            mute,
            unmute,
            toggleMute: isMuted ? unmute : mute,
            isAgentSpeaking,
            isUserSpeaking: ptt.isPTTUserSpeaking,
            startTurn: ptt.handleTalkButtonDown,
            endTurn: ptt.handleTalkButtonUp,
            sendTextMessage,
            transcript: transcriptItems,
            clearTranscript: clearTranscriptItems,
        }),
        [
            sessionStatus,
            isMuted,
            isAgentSpeaking,
            ptt.isPTTUserSpeaking,
            ptt.handleTalkButtonDown,
            ptt.handleTalkButtonUp,
            transcriptItems,
            connectVoid,
            disconnect,
            mute,
            unmute,
            sendTextMessage,
            clearTranscriptItems,
        ]
    );
}
