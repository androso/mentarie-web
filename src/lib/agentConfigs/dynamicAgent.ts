import { AgentConfig, VocabularyItem } from "../types";
import { injectTransferTools } from "./utils";

interface LessonInput {
    title: string;
    objective: string;
    targetChunks?: { order: number; text: string }[];
    vocabulary?: VocabularyItem[];
    competencies?: string[];
}

export function createDynamicAgent(lesson: LessonInput): AgentConfig {
    const targetChunks = lesson.targetChunks ?? [];
    const vocabulary = lesson.vocabulary ?? [];
    const competencies = lesson.competencies ?? [];

    const targetChunksText = targetChunks
        .map((chunk, index) => `  ${index + 1}. ${chunk.text}`)
        .join("\n");

    const competenciesSection = competencies.length > 0
        ? `**Learning objectives for this session:**\n${competencies.map((c) => `  - ${c}`).join("\n")}\n`
        : "";

    const vocabularySection = vocabulary.length > 0
        ? `**Vocabulary to weave in naturally during the conversation:**\n${vocabulary.map((v) => v.meaning ? `  - ${v.text}: ${v.meaning}` : `  - ${v.text}`).join("\n")}\nIntroduce these words naturally as they fit the conversation — don't list them all at once.\n`
        : "";

    const dynamicAgent: AgentConfig = {
        name: "dynamicLessonAgent",
        publicDescription: `Agent for ${lesson.title} - ${lesson.objective}`,
        instructions: `You are a helpful AI language teacher coaching the user through a practice conversation.

**Lesson:** ${lesson.title}
**Goal:** ${lesson.objective}

${competenciesSection}${vocabularySection}**Target phrases the user should produce (in order):**
${targetChunksText}

**Instructions:**
1. Start the conversation naturally — set the scene so the user has a reason to use the first chunk.
2. After the user uses each chunk, ask a follow-up that leads them naturally to the next one.
3. If the user skips or avoids a chunk, gently reintroduce it.
4. Keep the conversation engaging and realistic — you are simulating the real-world situation, not drilling.
5. When vocabulary words come up naturally, you may explain or use them in context.

When the user says something **similar** to one or more of the target phrases, call update_target_chunks with ALL matching phrases as an array.
update_target_chunks returns the total chunks used. When it equals ${targetChunks.length}, call finish_lesson and say goodbye warmly.
`,
        tools: [
            {
                type: "function",
                description: "greet the user via the console when the user asks for it",
                name: "console_greeting",
                parameters: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Message to send the user",
                        },
                    },
                    required: ["message"],
                },
            },
            {
                type: "function",
                name: "update_target_chunks",
                description:
                    "Update the used list of target chunks if the user mentions something similar to one or more of them during the conversation. Call this with ALL chunks that match what the user said, even if multiple chunks are mentioned in the same sentence.",
                parameters: {
                    type: "object",
                    properties: {
                        chunks: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description:
                                "Array of target chunks that are similar to what the user said. Include ALL matching chunks even if multiple are mentioned in the same sentence.",
                        },
                    },
                    required: ["chunks"],
                },
            },
            {
                type: "function",
                name: "finish_lesson",
                description:
                    "Mark the lesson as completed because the user has used all target chunks during this lesson.",
                parameters: {
                    type: "object",
                    properties: {
                        usedChunks: {
                            type: "number",
                            description: "the total of used chunks",
                        },
                    },
                },
            },
        ],
    };

    return dynamicAgent;
}

export function createDynamicAgentSet(lesson: LessonInput): AgentConfig[] {
    const dynamicAgent = createDynamicAgent(lesson);
    return injectTransferTools([dynamicAgent]);
}
