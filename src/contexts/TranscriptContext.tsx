import { TranscriptItem } from "../lib/types";
import {
    createContext,
    FC,
    PropsWithChildren,
    useContext,
    useState,
} from "react";


type TranscriptContextValue = {
    transcriptItems: TranscriptItem[];
    addTranscriptMessage: (
        itemId: string,
        role: "user" | "assistant",
        text: string
    ) => void;
    updateTranscriptMessage: (
        itemId: string,
        text: string,
        isDelta: boolean
    ) => void;
    updateTranscriptItem: (
        itemId: string,
        updatedProperties: Partial<TranscriptItem>
    ) => void;
};

const TranscriptContext = createContext<TranscriptContextValue | null>(null);

export const TranscriptProvider: FC<PropsWithChildren> = ({ children }) => {
    const [transcriptItems, setTranscriptItems] = useState<TranscriptItem[]>([]);

    function newTimestampPretty(): string {
        return new Date().toLocaleTimeString([], {
            hour12: true,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        });
    }

    const addTranscriptMessage: TranscriptContextValue["addTranscriptMessage"] = (
        itemId,
        role,
        text = ""
    ) => {
        setTranscriptItems((prev) => {
            if (prev.some((itm) => itm.itemId === itemId && itm.type === "MESSAGE")) {
                console.warn(
                    `message already exists for itemId=${itemId}, role=${role}, text=${text}`
                );
                return prev;
            }

            const newItem: TranscriptItem = {
                itemId,
                type: "MESSAGE",
                role,
                title: text,
                timestamp: newTimestampPretty(),
                createdAtMs: Date.now(),
                status: "IN_PROGRESS",
            };

            return [...prev, newItem];
        });
    };

    const updateTranscriptMessage: TranscriptContextValue["updateTranscriptMessage"] =
        (itemId, newText, append = false) => {
            setTranscriptItems((prev) => {
                return prev.map((item) => {
                    if (item.itemId == itemId && item.type === "MESSAGE") {
                        return {
                            ...item,
                            title: append ? (item.title ?? "") + newText : newText,
                        };
                    }
                    return item;
                });
            });
        };

    const updateTranscriptItem: TranscriptContextValue["updateTranscriptItem"] = (
        itemId,
        updatedProperties
    ) => {
        setTranscriptItems((prev) => {
            return prev.map((item) => {
                return item.itemId == itemId ? { ...item, ...updatedProperties } : item;
            });
        });
    };

    return (
        <TranscriptContext.Provider 
            value={{
                transcriptItems,
                addTranscriptMessage,
                updateTranscriptMessage,
                updateTranscriptItem
            }}
        >
            {children}
        </TranscriptContext.Provider>
    );
};

export const useTranscript = () => {
    const context = useContext(TranscriptContext);
    if (!context) {
        throw new Error("usetranscript must be used within a transcript provider");
    }

    return context;
};
