import { useEffect, useRef, useState } from "react";
import { SessionStatus } from "../lib/types";
import { createRealtimeConnection } from "../lib/webrtc";

interface UseRealtimeConnectionProps {
    onDataChannelOpen?: () => void;
    onDataChannelClose?: () => void;
    onDataChannelError?: (event: any) => void;
    onDataChannelMessage?: (event: MessageEvent) => void;
}

export const useRealtimeConnection = ({
    onDataChannelClose,
    onDataChannelError,
    onDataChannelMessage,
    onDataChannelOpen,
}: UseRealtimeConnectionProps) => {
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [sessionStatus, setSessionStatus] =
        useState<SessionStatus>("DISCONNECTED");
    const [isDataChannelReady, setIsDataChannelReady] = useState(false);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const pendingEventsRef = useRef<any[]>([]);

    const fetchEphemeralKey = async (): Promise<string | null> => {
        const tokenResponse = await fetch("/api/session");
        const data = await tokenResponse.json();

        if (!data.client_secret?.value) {
            console.error("No ephemeral key provided by the server");
            setSessionStatus("DISCONNECTED");
            return null;
        }

        return data.client_secret.value;
    };

    const connect = async () => {
        if (sessionStatus !== "DISCONNECTED") return null;

        setSessionStatus("CONNECTING");
        setIsDataChannelReady(false);

        try {
            const EPHEMERAL_KEY = await fetchEphemeralKey();
            if (!EPHEMERAL_KEY) {
                return;
            }

            if (!audioElementRef.current) {
                audioElementRef.current = document.createElement("audio");
            }
            audioElementRef.current.autoplay = true;

            const { pc, dataChannel: dc } = await createRealtimeConnection(
                EPHEMERAL_KEY,
                audioElementRef
            );

            pcRef.current = pc;
            dcRef.current = dc;

            dc.addEventListener("open", () => {
                setIsDataChannelReady(true);
                onDataChannelOpen?.();
                while (pendingEventsRef.current.length > 0) {
                    const event = pendingEventsRef.current.shift();
                    if (event) {
                        dc.send(JSON.stringify(event));
                    }
                }
            });

            dc.addEventListener("close", () => {
                setIsDataChannelReady(false);
                onDataChannelClose?.();
            });

            dc.addEventListener("error", (err) => {
                setIsDataChannelReady(false);
                onDataChannelError?.(err);
            });

            dc.addEventListener("message", (e) => onDataChannelMessage?.(e));

            setDataChannel(dc);
            setSessionStatus("CONNECTED");
            console.log("REALTIME CONNECTED")
        } catch (e) {
            console.error("Error connecting to realtime:", e);
            setSessionStatus("DISCONNECTED");
            setIsDataChannelReady(false);
        }
    };

    const disconnect = () => {
        if (pcRef.current) {
            pcRef.current.getSenders().forEach((sender) => {
                if (sender.track) {
                    sender.track.stop();
                }
            });

            pcRef.current.close();
            pcRef.current = null;
        }

        setDataChannel(null);
        setSessionStatus("DISCONNECTED");
        setIsDataChannelReady(false);
        pendingEventsRef.current = [];
        console.log("REALTIME DISCONNECTED")
    };

    const sendClientEvent = (eventObj: any) => {
        if (isDataChannelReady && dcRef.current?.readyState === "open") {
            dcRef.current.send(JSON.stringify(eventObj));
        } else {
            pendingEventsRef.current.push(eventObj);
        }
    };

    useEffect(() => {
        if (audioElementRef.current) {
            if (sessionStatus === "CONNECTED" && audioElementRef.current.autoplay) {
                audioElementRef.current.play().catch((err) => {
                    console.warn("Autoplay may be blocked by browser:", err);
                });
            } else if (sessionStatus !== "CONNECTED") {
                audioElementRef.current.pause();
            }
        }
    }, [sessionStatus]);

    return {
        dataChannel,
        sessionStatus,
        audioElementRef,
        connect,
        disconnect,
        sendClientEvent,
        isDataChannelReady,
    };
};
