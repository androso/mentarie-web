import { RefObject } from "react";
export interface WebRTCState {
    pc: RTCPeerConnection;
    dc: RTCDataChannel;
    stream: MediaStream;
    onTranscriptUpdate?: (text: string) => void;
}

export async function initWebRTC(
    ephemeralKey: string,
    onTranscriptUpdate?: (text: string) => void
): Promise<WebRTCState> {
    const pc = new RTCPeerConnection();

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

    // Add microphone input
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
            },
        });
        const audioTrack = stream.getAudioTracks()[0];
        // Initially disable the audio track until user starts speaking
        audioTrack.enabled = false;
        pc.addTrack(audioTrack, stream);
    } catch (error) {
        console.error("Error accessing microphone:", error);
        throw new Error(
            "Could not access microphone. Please ensure microphone permissions are granted."
        );
    }

    // Set up data channel
    const dc = pc.createDataChannel("oai-events");
    dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event);

        // Handle transcript events
        if (
            event.type === "response.text.delta" &&
            onTranscriptUpdate &&
            event.delta
        ) {
            console.log("response.text.delta");
            onTranscriptUpdate(event.delta);
        } else if (
            event.type === "response.audio_transcript.delta" &&
            onTranscriptUpdate &&
            event.delta
        ) {
            console.log("response.audio_transcript.delta");
            onTranscriptUpdate(event.delta);
        } else if (event.type === "response.created" && onTranscriptUpdate) {
            // Clear transcript when a new response starts
            onTranscriptUpdate("");
        } else if (event.type === "response.ended") {
            // When the AI response ends, it's the user's turn again
            if (onTranscriptUpdate) {
                onTranscriptUpdate("\n\nYour turn to speak...");
            }
        }
    });

    // Wait until the data channel is open
    dc.addEventListener("open", () => {
        console.log("Data channel is open, sending message...");
        dc.send(
            JSON.stringify({
                type: "response.create",
                response: {
                    modalities: ["text", "audio"],
                    instructions:
                        "You are a helpful language learning assistant. Engage in natural conversation while helping the user practice their language skills. Correct any errors gently and provide encouragement. Wait for the user to finish speaking before responding.",
                },
            })
        );
    });

    // Initialize session
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview-2024-12-17";

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
            Authorization: `Bearer ${ephemeralKey}`,
            "Content-Type": "application/sdp",
        },
    });

    if (!sdpResponse.ok) {
        throw new Error(
            `Failed to establish connection: ${sdpResponse.statusText}`
        );
    }

    const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
    };

    await pc.setRemoteDescription(answer);

    return { pc, dc, stream, onTranscriptUpdate };
}

export async function createRealtimeConnection(
    EPHEMERAL_KEY: string,
    audioElementRef: RefObject<HTMLAudioElement | null>
) {
    const pc = new RTCPeerConnection();

    pc.ontrack = (e) => {
        if (audioElementRef.current) {
            audioElementRef.current.srcObject = e.streams[0];
        }
    };
    const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
    });
    pc.addTrack(mediaStream.getTracks()[0]);

    const capabilities = RTCRtpSender.getCapabilities("audio");
    if (capabilities) {
        const chosenCodec = capabilities.codecs.find(
            (c) => c.mimeType.toLowerCase() == "audio/opus"
        );
        if (chosenCodec) {
            pc.getTransceivers()[0].setCodecPreferences([chosenCodec]);
        } else {
            console.warn(`Codec opus not found in capabilities. Using default.`);
        }
    }

    const dataChannel = pc.createDataChannel("realtime-events");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";

    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
        },
    });

    const answerSDP = await sdpResponse.text();
    const answer: RTCSessionDescriptionInit = {
        type: "answer",
        sdp: answerSDP,
    };

    await pc.setRemoteDescription(answer);
    return { pc, dataChannel };
}
