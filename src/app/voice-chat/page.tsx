"use client";

import AppSidebar from "@/components/AppSidebar";
import VoiceChatInterface, { LessonData } from "@/components/voice/VoiceChatInterface";
import { ConversationMessage, ResponseSuggestion } from "@/lib/types";

const staticLesson: LessonData = {
  title: "Ordering at a Restaurant",
  objective:
    "Make a reservation, order food/drinks politely, handle menu questions, and pay the bill.",
  targetChunks: [
    { order: 1, text: "Table for two, please." },
    { order: 2, text: "Do you have a reservation?" },
    { order: 3, text: "Can I see the menu?" },
    { order: 4, text: "I need more time, please." },
    { order: 5, text: "I would like..." },
    { order: 6, text: "I'll have water, please." },
    { order: 7, text: "What do you recommend?" },
    { order: 8, text: "How much is it?" },
    { order: 9, text: "Can I have the bill, please?" },
    { order: 10, text: "I'll pay by card." },
  ],
};

const staticMessages: ConversationMessage[] = [
  {
    role: "assistant",
    content: "Good afternoon! Welcome to La Bella. Do you have a reservation?",
  },
  {
    role: "user",
    content: "Table for two, please.",
  },
  {
    role: "assistant",
    content:
      "Of course! Right this way. Here are your menus. Can I start you off with something to drink?",
  },
  {
    role: "user",
    content: "I'll have water, please. What do you recommend?",
  },
  {
    role: "assistant",
    content:
      "Excellent choices! Our chef's special today is the grilled salmon with lemon butter sauce. It's very popular. Are you ready to order, or do you need more time?",
  },
];

const staticUsedChunks = [
  "Table for two, please.",
  "Do you have a reservation?",
  "I'll have water, please.",
  "What do you recommend?",
];

const staticSuggestions: ResponseSuggestion[] = [
  {
    text: "Can I see the menu?",
    translation: "¿Puedo ver el menú?",
    type: "question",
  },
  {
    text: "I need more time, please.",
    translation: "Necesito más tiempo, por favor.",
    type: "statement",
  },
  {
    text: "I would like the grilled salmon.",
    translation: "Quisiera el salmón a la parrilla.",
    type: "statement",
  },
];

export default function VoiceChatPage() {
  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <AppSidebar activeItem="learn" />
      <main className="ml-64 h-screen overflow-hidden">
        <VoiceChatInterface
          title={staticLesson.title}
          showBackButton={false}
          lessonData={staticLesson}
          initialMessages={staticMessages}
          initialUsedChunks={staticUsedChunks}
          initialSuggestions={staticSuggestions}
        />
      </main>
    </div>
  );
}
