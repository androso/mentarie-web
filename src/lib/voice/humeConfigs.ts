// Named registry for Hume EVI config IDs.
// Add one entry per feature area that uses Hume; set the corresponding
// NEXT_PUBLIC_HUME_CONFIG_* env var in .env.local for each environment.
export const HUME_CONFIGS = {
    freeConversation: process.env.NEXT_PUBLIC_HUME_CONFIG_FREE_CONVERSATION ?? "",
} as const;

export type HumeConfigKey = keyof typeof HUME_CONFIGS;
