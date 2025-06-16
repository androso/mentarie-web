import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { SessionStatus, AgentConfig } from "../lib/types";

interface UseSessionManagementProps {
  agents: AgentConfig[];
  sessionStatus: SessionStatus;
  sendClientEvent: (event: any) => void;
  addTranscriptMessage: (id: string, role: string, content: string, isComplete: boolean) => void;
}

export const useSessionManagement = ({
  agents,
  sessionStatus,
  sendClientEvent,
  addTranscriptMessage,
}: UseSessionManagementProps) => {
  const defaultAgentName = agents[0]?.name;
  const [selectedAgentName, setSelectedAgentName] = useState<string | undefined>(defaultAgentName);
  const [isOutputAudioBufferActive, setIsOutputAudioBufferActive] = useState<boolean>(false);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && selectedAgentName) {
      const currentAgent = agents.find((a) => a.name === selectedAgentName);
      updateSession(true);
    }
  }, [sessionStatus, selectedAgentName]);

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    sendClientEvent({ type: "input_audio_buffer.clear" });

    const currentAgent = agents.find((a) => a.name === selectedAgentName);
    const instructions = currentAgent?.instructions || "";
    const tools = currentAgent?.tools || [];

    const sessionUpdateEvent = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions,
        voice: "sage",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: null,
        tools,
      },
    };

    sendClientEvent(sessionUpdateEvent);

    if (shouldTriggerResponse) {
      sendClientEvent({ type: "response.create" });
    }
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: "conversation.item.create",
      item: {
        id,
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    });
    sendClientEvent({ type: "response.create" });
  };

  const cancelAssistantSpeech = async () => {
    sendClientEvent({ type: "response.cancel" });

    if (isOutputAudioBufferActive) {
      sendClientEvent({ type: "output_audio_buffer.clear" });
    }
  };

  return {
    selectedAgentName,
    setSelectedAgentName,
    isOutputAudioBufferActive,
    setIsOutputAudioBufferActive,
    updateSession,
    cancelAssistantSpeech,
  };
}; 