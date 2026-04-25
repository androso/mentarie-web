"use client";

import React, { useEffect } from "react";
import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePracticeLessons } from "@/hooks/usePracticeLessons";
import AppSidebar from "@/components/AppSidebar";

const skillColors: Record<string, string> = {
    pronunciation: "bg-purple-100 text-purple-700",
    listening: "bg-blue-100 text-blue-700",
    reading: "bg-green-100 text-green-700",
    writing: "bg-yellow-100 text-yellow-700",
    speaking: "bg-orange-100 text-orange-700",
};

export default function PracticesPage() {
    const router = useRouter();
    const { user, isLoading, learningLanguages } = useAuth();

    const primaryLearningLanguage = learningLanguages[0];

    const { data: practiceLessons, isLoading: lessonsLoading } = usePracticeLessons({
        language: primaryLearningLanguage?.code,
        level: primaryLearningLanguage?.level,
    });

    useEffect(() => {
        if (!isLoading && !user) router.push("/");
    }, [isLoading, user, router]);

    if (isLoading) return <div className="bg-gray-100 min-h-screen" />;
    if (!user) return null;

    const primaryLanguageName = primaryLearningLanguage?.name ?? "your language";
    const primaryLanguageLevel = primaryLearningLanguage?.level.toUpperCase() ?? "";

    return (
        <div className="bg-gray-100 min-h-screen">
            <AppSidebar activeItem="practice" />
            <main className="ml-64">
                <div className="max-w-4xl mx-auto p-8">
                    <h1 className="text-3xl font-bold mb-2 text-[#4e342e]">Practice Lessons</h1>
                    <p className="text-gray-600 mb-8">
                        Voice-based practice sessions for {primaryLanguageName} — {primaryLanguageLevel}.
                    </p>

                    {lessonsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm animate-pulse">
                                    <div className="h-5 w-40 bg-gray-100 rounded mb-2" />
                                    <div className="h-4 w-56 bg-gray-100 rounded mb-4" />
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-5 w-16 bg-gray-100 rounded-full" />
                                        <div className="h-5 w-16 bg-gray-100 rounded-full" />
                                    </div>
                                    <div className="h-8 w-20 bg-gray-100 rounded-full ml-auto" />
                                </div>
                            ))}
                        </div>
                    ) : !practiceLessons || practiceLessons.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Mic className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg mb-2">No practice lessons yet</p>
                            <p className="text-sm">Practice lessons for your level are being prepared.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {practiceLessons.map((lesson) => (
                                <div
                                    key={lesson.id}
                                    className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg font-bold text-[#4e342e] leading-tight pr-2">
                                            {lesson.title}
                                        </h3>
                                        <span className="flex-shrink-0 text-xs py-1 px-2.5 rounded-full font-medium bg-gray-100 text-gray-500 uppercase">
                                            {lesson.levelCode}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4 flex-1">{lesson.objective}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {lesson.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className={`text-xs py-0.5 px-2 rounded-full font-medium ${skillColors[skill] ?? "bg-gray-100 text-gray-600"}`}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        {lesson.durationMinutes && (
                                            <span className="text-xs text-gray-400">{lesson.durationMinutes} min</span>
                                        )}
                                        <button
                                            onClick={() => router.push(`/practice/${lesson.id}`)}
                                            className="ml-auto bg-[#4e342e] text-white py-2 px-4 rounded-full text-sm hover:bg-[#6d4c41] transition-colors flex items-center gap-1.5"
                                        >
                                            <Mic className="h-3.5 w-3.5" />
                                            Start
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
