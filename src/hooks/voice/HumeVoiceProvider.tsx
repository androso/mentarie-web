"use client";

import { VoiceProvider } from "@humeai/voice-react";
import type { ReactNode } from "react";

interface HumeVoiceProviderProps {
    children: ReactNode;
}

// Minimal wrapper — auth is handled imperatively in useHumeVoice.connect().
// VoiceProvider acts as the state container; no static config needed here.
export function HumeVoiceProvider({ children }: HumeVoiceProviderProps) {
    return <VoiceProvider>{children}</VoiceProvider>;
}
