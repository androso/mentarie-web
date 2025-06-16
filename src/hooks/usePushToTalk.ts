import { useEffect, useState } from "react";
import { SessionStatus } from "../lib/types";

interface UsePushToTalkProps {
  sessionStatus: SessionStatus;
  dataChannel: RTCDataChannel | null;
  sendClientEvent: (event: any) => void;
  onPTTStateChange?: (isSpeaking: boolean) => void;
}

export const usePushToTalk = ({
  sessionStatus,
  dataChannel,
  sendClientEvent,
  onPTTStateChange,
}: UsePushToTalkProps) => {
  const [isPTTCheckboxChecked, setIsPTTCheckboxChecked] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTCheckboxChecked(storedPushToTalkUI === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTCheckboxChecked.toString());
  }, [isPTTCheckboxChecked]);

  const handleTalkButtonDown = () => {
    if (sessionStatus !== "CONNECTED" || dataChannel?.readyState !== "open")
      return;

    setIsPTTUserSpeaking(true);
    onPTTStateChange?.(true);
    sendClientEvent({ type: "input_audio_buffer.clear" });
  };

  const handleTalkButtonUp = () => {
    if (
      sessionStatus !== "CONNECTED" ||
      dataChannel?.readyState !== "open" ||
      !isPTTUserSpeaking
    )
      return;

    setIsPTTUserSpeaking(false);
    onPTTStateChange?.(false);
    sendClientEvent({ type: "input_audio_buffer.commit" });
    sendClientEvent({ type: "response.create" });
  };

  return {
    isPTTCheckboxChecked,
    setIsPTTCheckboxChecked,
    isPTTUserSpeaking,
    handleTalkButtonDown,
    handleTalkButtonUp,
  };
}; 