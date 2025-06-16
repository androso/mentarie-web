import { useTranscript } from "../contexts/TranscriptContext";
import { AgentConfig, ServerEvent, SessionStatus } from "../lib/types";
import { useRef } from "react";

export interface UseHandleServerEventParams {
    setSessionStatus: (status: SessionStatus) => void;
    selectedAgentName: string;
    selectedAgentConfigSet: AgentConfig[] | null;
    sendClientEvent: (eventObj: any, eventNameSuffix?: string) => void;
    setSelectedAgentName: (name: string) => void;
    shouldForceResponse?: boolean;
    setIsOutputAudioBufferActive: (active: boolean) => void;
    functions: Record<string, (params: any) => any>;
    onAssistantResponseComplete?: (transcript: string) => void;
    onUserMessageComplete?: (message: string) => void;
}

export function useHandleServerEvent({
    setSessionStatus,
    selectedAgentName,
    selectedAgentConfigSet,
    sendClientEvent,
    setSelectedAgentName,
    setIsOutputAudioBufferActive,
    functions,
    onAssistantResponseComplete,
    onUserMessageComplete,
}: UseHandleServerEventParams) {
    const {
        transcriptItems,
        addTranscriptMessage,
        updateTranscriptMessage,
        updateTranscriptItem,
    } = useTranscript();

    const assistantDeltasRef = useRef<{ [itemId: string]: string }>({});

    async function processGuardrail(itemId: string, text: string) {
        let res;
        try {
            // res = await runGuardrailClassifier(text);
        } catch (error) {
            console.warn(error);
            return;
        }

        const currentItem = transcriptItems.find((item) => item.itemId === itemId);
        // if ((currentItem?.guardrailResult?.testText?.length ?? 0) > text.length) {
        // 	// If the existing guardrail result is more complete, skip updating. We're running multiple guardrail checks and you don't want an earlier one to overwrite a later, more complete result.
        // 	return;
        // }

        // const newGuardrailResult: GuardrailResultType = {
        // 	status: "DONE",
        // 	testText: text,
        // 	category: res.moderationCategory,
        // 	rationale: res.moderationRationale,
        // };

        // Update the transcript item with the new guardrail result.
        // updateTranscriptItem(itemId, { guardrailResult: newGuardrailResult });
    }

    const handleFunctionCall = async (functionCallParams: {
        name: string;
        call_id?: string;
        arguments: string;
    }) => {
        const args = JSON.parse(functionCallParams.arguments);
        const currentAgent = selectedAgentConfigSet?.find(
            (a) => a.name === selectedAgentName
        );

        if (currentAgent?.toolLogic?.[functionCallParams.name]) {
            const fn = currentAgent.toolLogic[functionCallParams.name];
            const fnResult = await fn(args, transcriptItems);

            sendClientEvent({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: functionCallParams.call_id,
                    output: JSON.stringify(fnResult),
                },
            });
            sendClientEvent({ type: "response.create" });
        } else if (functionCallParams.name === "transferAgents") {
            const destinationAgent = args.destination_agent;
            const newAgentConfig =
                selectedAgentConfigSet?.find((a) => a.name === destinationAgent) ||
                null;
            if (newAgentConfig) {
                setSelectedAgentName(destinationAgent);
            }
            const functionCallOutput = {
                destination_agent: destinationAgent,
                did_transfer: !!newAgentConfig,
            };
            sendClientEvent({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: functionCallParams.call_id,
                    output: JSON.stringify(functionCallOutput),
                },
            });
        } else {
            const simulatedResult = { result: true };

            sendClientEvent({
                type: "conversation.item.create",
                item: {
                    type: "function_call_output",
                    call_id: functionCallParams.call_id,
                    output: JSON.stringify(simulatedResult),
                },
            });
            sendClientEvent({ type: "response.create" });
        }
    };

    const handleServerEvent = (serverEvent: ServerEvent) => {
        switch (serverEvent.type) {
            case "session.created": {
                setSessionStatus("CONNECTED");
                break;
            }
            case "output_audio_buffer.started": {
                setIsOutputAudioBufferActive(true);
                break;
            }
            case "output_audio_buffer.stopped": {
                setIsOutputAudioBufferActive(false);
                break;
            }

            case "conversation.item.created": {
                let text =
                    serverEvent.item?.content?.[0]?.text ||
                    serverEvent.item?.content?.[0]?.transcript ||
                    "";
                const role = serverEvent.item?.role as "user" | "assistant";
                const itemId = serverEvent.item?.id;

                if (itemId && transcriptItems.some((item) => item.itemId === itemId)) {
                    // don't add transcript message if already exists
                    break;
                }

                if (itemId && role) {
                    if (role === "user" && !text) {
                        text = "[Transcribing...]";
                    }
                    addTranscriptMessage(itemId, role, text);
                }
                break;
            }

            case "conversation.item.input_audio_transcription.completed": {
                const itemId = serverEvent.item_id;
                const finalTranscript =
                    !serverEvent.transcript || serverEvent.transcript === "\n"
                        ? "[inaudible]"
                        : serverEvent.transcript;
                if (itemId) {
                    updateTranscriptMessage(itemId, finalTranscript, false);

                    // If this is a valid user transcription, add to conversation history
                    if (finalTranscript && finalTranscript !== "[inaudible]" && onUserMessageComplete) {
                        console.log("User voice message completed, adding to conversation history:", finalTranscript);
                        onUserMessageComplete(finalTranscript);
                    }
                }
                break;
            }

            case "response.audio_transcript.delta": {
                const itemId = serverEvent.item_id;
                const deltaText = serverEvent.delta || "";
                if (itemId) {
                    // Update the transcript message with the new text.
                    updateTranscriptMessage(itemId, deltaText, true);

                    // Accumulate the deltas and run the output guardrail at regular intervals.
                    if (!assistantDeltasRef.current[itemId]) {
                        assistantDeltasRef.current[itemId] = "";
                    }
                    assistantDeltasRef.current[itemId] += deltaText;
                    const newAccumulated = assistantDeltasRef.current[itemId];
                    const wordCount = newAccumulated.trim().split(" ").length;

                    // Run guardrail classifier every 5 words.
                    if (wordCount > 0 && wordCount % 5 === 0) {
                        processGuardrail(itemId, newAccumulated);
                    }
                }
                break;
            }
            case "response.function_call_arguments.done": {
                console.log("function call");

                const funcName = (serverEvent as any).name;
                const funcArgs = JSON.parse((serverEvent as any).arguments || "{}");
                const callId = (serverEvent as any).call_id;

                console.log({ funcName, funcArgs });

                // Generic function call handler
                if (functions[funcName]) {
                    Promise.resolve(functions[funcName](funcArgs))
                        .then(res => {
                            const payload = {
                                type: "conversation.item.create",
                                item: {
                                    type: "function_call_output",
                                    call_id: callId,
                                    output: JSON.stringify(res ?? { status: "ok" })
                                }
                            };
                            sendClientEvent(payload);
                        })
                        .catch(error => {
                            console.error(`Error executing function ${funcName}:`, error);
                            const errorPayload = {
                                type: "conversation.item.create",
                                item: {
                                    type: "function_call_output",
                                    call_id: callId,
                                    output: JSON.stringify({ status: "error", error: error.message })
                                }
                            };
                            sendClientEvent(errorPayload);
                        });
                } else {
                    console.warn(`Function ${funcName} not found in functions object`);
                }
                break;
            }
            case "response.done": {
                if (serverEvent.response?.output) {
                    serverEvent.response.output.forEach((outputItem) => {
                        if (
                            outputItem.type === "function_call" &&
                            outputItem.name &&
                            outputItem.arguments 
                        ) {
                            handleFunctionCall({
                                name: outputItem.name,
                                call_id: outputItem.call_id,
                                arguments: outputItem.arguments,
                            });
                        }
                        if (
                            outputItem.type === "message" &&
                            outputItem.role === "assistant"
                        ) {
                            const itemId = outputItem.id;
                            const text = outputItem.content[0].transcript;
                            // Final guardrail for this message
                            processGuardrail(itemId, text);
                        }
                    });
                }
                break;
            }

            case "response.output_item.done": {
                const itemId = serverEvent.item?.id;
                if (itemId) {
                    updateTranscriptItem(itemId, { status: "DONE" });

                    // Check if this is an assistant message completion
                    const completedItem = transcriptItems.find(item => item.itemId === itemId);
                    if (completedItem && completedItem.role === "assistant" && completedItem.title) {
                        console.log("AI response completed, triggering suggestions for transcript:", completedItem.title);
                        // Trigger suggestions when AI response is complete
                        if (onAssistantResponseComplete) {
                            setTimeout(() => {
                                onAssistantResponseComplete(completedItem.title || "");
                            }, 500); // Small delay to ensure UI is updated
                        }
                    }
                }
                break;
            }

            default:
                break;
        }
    };

    const handleServerEventRef = useRef(handleServerEvent);
    handleServerEventRef.current = handleServerEvent;

    return handleServerEventRef;
}
