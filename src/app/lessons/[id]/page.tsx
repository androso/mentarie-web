"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLesson } from "@/hooks/useLesson";
import { useUpdateLessonProgress } from "@/hooks/useUnit";
import { createDynamicAgent } from "@/lib/agentConfigs/dynamicAgent";
import VoiceChatInterface, { LessonData } from "@/components/voice/VoiceChatInterface";
import AppSidebar from "@/components/AppSidebar";

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const lessonId = params.id as string;

    const { user, isLoading: authLoading } = useAuth();
    const { data: lesson, isLoading: lessonLoading } = useLesson(lessonId);
    const updateProgress = useUpdateLessonProgress(lesson?.unitId ?? 0);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [authLoading, user, router]);

    const agentConfig = useMemo(() => {
        if (!lesson) return null;
        return createDynamicAgent(lesson);
    }, [lesson]);

    const lessonData = useMemo<LessonData | undefined>(() => {
        if (!lesson) return undefined;
        return {
            title: lesson.title,
            objective: lesson.objective,
            targetChunks: lesson.targetChunks,
        };
    }, [lesson]);

    const handleLessonComplete = useCallback(() => {
        updateProgress.mutate({ lessonId: Number(lessonId), status: "completed" });
    }, [lessonId, updateProgress]);

    if (authLoading || lessonLoading) {
        return <div className="bg-gray-100 min-h-screen" />;
    }

    if (!user) return null;

    if (!lesson || !agentConfig) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Lesson not found.</p>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-gray-100">
            <AppSidebar activeItem="learn" />
            <main className="ml-64 h-screen overflow-hidden">
                <VoiceChatInterface
                    title={lesson.title}
                    showBackButton
                    onBack={() => router.back()}
                    lessonData={lessonData}
                    agentConfig={agentConfig}
                    onLessonComplete={handleLessonComplete}
                />
            </main>
        </div>
    );
}
