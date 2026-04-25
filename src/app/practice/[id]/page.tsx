"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeLesson } from "@/hooks/usePracticeLesson";
import { createDynamicAgent } from "@/lib/agentConfigs/dynamicAgent";
import VoiceChatInterface, { LessonData } from "@/components/voice/VoiceChatInterface";
import AppSidebar from "@/components/AppSidebar";

export default function PracticeLessonPage() {
    const router = useRouter();
    const params = useParams();
    const lessonId = params.id as string;

    const { user, isLoading: authLoading } = useAuth();
    const { data: lesson, isLoading: lessonLoading } = usePracticeLesson(lessonId);

    const agentConfig = useMemo(() => {
        if (!lesson) return null;
        return createDynamicAgent({
            title: lesson.title,
            objective: lesson.objective,
            targetChunks: lesson.functionalLanguage,
            vocabulary: lesson.vocabulary,
            competencies: lesson.competencies,
        });
    }, [lesson]);

    const lessonData = useMemo<LessonData | undefined>(() => {
        if (!lesson) return undefined;
        return {
            title: lesson.title,
            objective: lesson.objective,
            targetChunks: lesson.functionalLanguage,
            vocabulary: lesson.vocabulary,
            competencies: lesson.competencies,
        };
    }, [lesson]);

    const handleBack = useCallback(() => router.back(), [router]);

    if (authLoading || lessonLoading) {
        return <div className="bg-gray-100 min-h-screen" />;
    }

    if (!user) {
        router.push("/");
        return null;
    }

    if (!lesson || !agentConfig) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Practice lesson not found.</p>
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
                    onBack={handleBack}
                    lessonData={lessonData}
                    agentConfig={agentConfig}
                />
            </main>
        </div>
    );
}
