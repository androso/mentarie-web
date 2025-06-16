import { AgentConfig } from "../types";
import { injectTransferTools } from "./utils";

export function createDynamicAgent(lesson: any): AgentConfig {
    // Safety check for targetChunks - provide fallback if undefined
    const targetChunks = lesson.targetChunks ?? [];

    // Format target chunks for the prompt
    const targetChunksText = targetChunks
        .map((chunk: any, index: any) => `  ${index + 1}. ${chunk.text}`)
        .join("\n");
    const dynamicAgent: AgentConfig = {
        name: "dynamicLessonAgent",
        publicDescription: `Agent for ${lesson.title} - ${lesson.objective}`,
        instructions: `
    you're a helpful ai language teacher who is coaching the user through this lesson 
    **helpful Instructions**:
    1. Start the conversation by asking questions or making statements that guide the user to use the first chunk
    2. After the user uses the first chunk, proceed to ask a follow-up question or statement that encourages them to use the second chunk
    3. Continue this process for each target chunk in the list, asking relevant questions or making statements that lead the user to naturally use the chunk in the order provided.
    4. If the user skips or avoids a chunk, ask prompts that reintroduce the chunk to ensure it is used within the conversation.
    5. Make sure the conversation flows naturally from one chunk to the next, maintaining an engaging and conversational tone, while gently nudging the user to use the required phrases.
    The chunks are ${targetChunksText}
    if they pronounce something similar to one or more of these target chunks:
${targetChunksText}
    Take note of ALL chunks that are **similar** to what they said and call update_target_chunks with ALL matching chunks as an array. Even if they say multiple target chunks in the same sentence, make sure to detect and include all of them.
    update_target_chunks will return the total of chunks used after the update, if you see that it returns a number strictly equal to ${targetChunks.length}, you will call the finish_lesson function to end the session and say goodbye
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

export function createDynamicAgentSet(lesson: any): AgentConfig[] {
    const dynamicAgent = createDynamicAgent(lesson);
    return injectTransferTools([dynamicAgent]);
}
