export type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";
export interface TranscriptItem {
    itemId: string;
    type: "MESSAGE" | "BREADCRUMB";
    role?: "user" | "assistant";
    title?: string;
    data?: Record<string, any>;
    timestamp: string;
    createdAtMs: number;
    status: "IN_PROGRESS" | "DONE";
}

export interface ToolParameterProperty {
    type: string;
    description?: string;
    enum?: string[];
    pattern?: string;
    properties?: Record<string, ToolParameterProperty>;
    required?: string[];
    additionalProperties?: boolean;
    items?: ToolParameterProperty;
}
export interface ToolParameters {
    type: string;
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
    additionalProperties?: boolean;
}

export interface Tool {
    type: "function";
    name: string;
    description: string;
    parameters: ToolParameters;
}
export interface AgentConfig {
    name: string;
    publicDescription: string; // context for agent transfer tool
    instructions: string;
    tools: Tool[];
    toolLogic?: Record<
        string,
        (ards: any, transcriptLogsFiltered: TranscriptItem[]) => Promise<any> | any
    >;
    downstreamAgents?:
        | AgentConfig[]
        | { name: string; publicDescription: string }[];
}

export interface ServerEvent {
    type: string;
    event_id?: string;
    item_id?: string;
    transcript?: string;
    delta?: string;
    session?: {
        id?: string;
    };
    item?: {
        id?: string;
        object?: string;
        type?: string;
        status?: string;
        name?: string;
        arguments?: string;
        role?: "user" | "assistant";
        content?: {
            type?: string;
            transcript?: string | null;
            text?: string;
        }[];
    };
    response?: {
        output?: {
            id: string;
            type?: string;
            name?: string;
            arguments?: any;
            call_id?: string;
            role: string;
            content?: any;
        }[];
        metadata: Record<string, any>;
        status_details?: {
            error?: any;
        };
    };
}

export type AllAgentConfigsType = Record<string, AgentConfig[]>;

export interface ResponseSuggestion {
    text: string;
    translation: string;
    type: 'question' | 'statement' | 'casual' | 'formal' | 'agreeing' | 'disagreeing';
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export type SelectUser = {
    id: string;
    email: string;
    name: string;
    image: string | null;
    googleId: string | null;
    createdAt: string;
    isActive: boolean;
}

export type UserLevel = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";

export type UserLearningLanguage = {
    languageId: number;
    level: UserLevel;
    code: string;
    name: string;
    flagUrl: string | null;
}

export type CurrentUserResponse = {
    user: SelectUser;
    learningLanguages: UserLearningLanguage[];
}

export type InsertUser = {
    email: string;
    password: string;
    name: string;
}

export type LoginUser = {
    email: string;
    password: string;
}