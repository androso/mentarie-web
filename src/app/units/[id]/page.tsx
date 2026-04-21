"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Home, Book, BarChart2, User, LogOut, Lock, Trophy, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnit, useUpdateLessonProgress } from '@/hooks/useUnit';
import type { LessonWithProgress } from '@/lib/types';

export default function UnitPage() {
    const router = useRouter();
    const params = useParams();
    const unitId = Number(params.id);

    const { user, isLoading: authLoading, logoutMutation } = useAuth();
    const { data: unit, isLoading: unitLoading } = useUnit(unitId);
    const updateProgress = useUpdateLessonProgress(unitId);

    const [lessonError, setLessonError] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [authLoading, user, router]);

    const handleSignOut = () => {
        logoutMutation.mutate(undefined, {
            onSuccess: () => router.push('/'),
        });
    };

    const handleLessonClick = async (lesson: LessonWithProgress) => {
        setLessonError(null);
        const alreadyActive =
            lesson.progress?.status === 'in_progress' ||
            lesson.progress?.status === 'completed';
        if (!alreadyActive) {
            try {
                await updateProgress.mutateAsync({ lessonId: lesson.id, status: 'in_progress' });
            } catch {
                setLessonError(lesson.id);
                return;
            }
        }
        router.push(`/lessons/${lesson.id}`);
    };

    if (authLoading) {
        return <div className="bg-gray-100 min-h-screen" />;
    }

    if (!user) {
        return null;
    }

    const isLoading = unitLoading || !unit;

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-green-100 text-green-700',
            in_progress: 'bg-amber-50 text-amber-700',
            unlocked: 'bg-gray-100 text-[#4e342e]',
            locked: 'bg-gray-100 text-gray-400',
        };
        const label: Record<string, string> = {
            completed: 'Completed',
            in_progress: 'In progress',
            unlocked: 'Unlocked',
            locked: 'Locked',
        };
        return (
            <span className={`text-xs font-medium py-1 px-2.5 rounded-full ${map[status] ?? 'bg-gray-100 text-gray-400'}`}>
                {label[status] ?? status}
            </span>
        );
    };

    const lessonStatusBadge = (lesson: LessonWithProgress) => {
        const s = lesson.progress?.status;
        if (s === 'completed') {
            return <span className="text-xs font-medium py-1 px-2.5 rounded-full bg-green-100 text-green-700">Completed</span>;
        }
        if (s === 'in_progress') {
            return <span className="text-xs font-medium py-1 px-2.5 rounded-full bg-amber-50 text-amber-700">In progress</span>;
        }
        return null;
    };

    const lessonCTA = (lesson: LessonWithProgress) => {
        const s = lesson.progress?.status;
        if (s === 'completed') {
            return (
                <button
                    onClick={() => handleLessonClick(lesson)}
                    className="border border-[#4e342e] text-[#4e342e] py-2 px-4 rounded-full text-sm hover:bg-gray-50 transition-colors"
                >
                    Review
                </button>
            );
        }
        if (s === 'in_progress') {
            return (
                <button
                    onClick={() => handleLessonClick(lesson)}
                    className="bg-[#4e342e] text-white py-2 px-4 rounded-full text-sm hover:bg-[#6d4c41] transition-colors"
                >
                    Resume
                </button>
            );
        }
        return (
            <button
                onClick={() => handleLessonClick(lesson)}
                disabled={updateProgress.isPending}
                className="bg-[#4e342e] text-white py-2 px-4 rounded-full text-sm hover:bg-[#6d4c41] transition-colors disabled:opacity-50"
            >
                {updateProgress.isPending ? 'Starting…' : 'Start'}
            </button>
        );
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-white text-[#4e342e] flex flex-col h-screen fixed left-0 border-r border-gray-200">
                <div className="pt-5 pb-4">
                    <h1 className="text-2xl font-bold text-[#4e342e] text-center">Mentarie</h1>
                </div>
                <nav className="flex-1 flex flex-col">
                    <a
                        href="#"
                        className="flex items-center px-5 py-4 font-medium gap-2.5 bg-[#4e342e] text-white"
                        onClick={(e) => { e.preventDefault(); router.push('/home'); }}
                    >
                        <Home className="h-5 w-5" />
                        Learn
                    </a>
                    <a
                        href="#"
                        className="flex items-center px-5 py-4 font-medium gap-2.5 text-[#4e342e] hover:bg-gray-100"
                        onClick={(e) => { e.preventDefault(); router.push('/home'); }}
                    >
                        <Book className="h-5 w-5" />
                        Courses
                    </a>
                    <a
                        href="#"
                        className="flex items-center px-5 py-4 font-medium gap-2.5 text-[#4e342e] hover:bg-gray-100"
                        onClick={(e) => { e.preventDefault(); router.push('/home'); }}
                    >
                        <BarChart2 className="h-5 w-5" />
                        Stats
                    </a>
                    <a
                        href="#"
                        className="flex items-center px-5 py-4 font-medium gap-2.5 text-[#4e342e] hover:bg-gray-100"
                        onClick={(e) => { e.preventDefault(); router.push('/home'); }}
                    >
                        <User className="h-5 w-5" />
                        Account
                    </a>
                    <div className="mt-auto">
                        <a
                            href="#"
                            className="flex items-center px-5 py-4 text-[#4e342e] hover:bg-gray-100 gap-2.5 border-t border-gray-200"
                            onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </a>
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="ml-64 min-h-screen">
                <div className="max-w-4xl mx-auto p-8">
                    {/* Back */}
                    <button
                        onClick={() => router.push('/home')}
                        className="text-sm text-[#4e342e] hover:underline flex items-center gap-1 mb-6"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Dashboard
                    </button>

                    {/* Loading skeleton */}
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-8 animate-pulse space-y-3">
                                <div className="h-8 w-64 bg-gray-100 rounded" />
                                <div className="h-4 w-96 bg-gray-100 rounded" />
                                <div className="h-3 w-72 bg-gray-100 rounded" />
                            </div>
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm animate-pulse flex justify-between">
                                    <div className="space-y-2">
                                        <div className="h-3 w-16 bg-gray-100 rounded" />
                                        <div className="h-5 w-48 bg-gray-100 rounded" />
                                        <div className="h-3 w-72 bg-gray-100 rounded" />
                                    </div>
                                    <div className="h-9 w-20 bg-gray-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Unit header */}
                            <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-8">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {unit.isCapstone && (
                                            <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Trophy className="h-3 w-3" /> Capstone
                                            </span>
                                        )}
                                    </div>
                                    {statusBadge(unit.status)}
                                </div>
                                <h1 className="text-3xl font-bold text-[#4e342e] mb-1">{unit.title}</h1>
                                <p className="text-gray-600 mt-1">{unit.communicativeGoal}</p>
                                <p className="text-sm text-gray-500 mt-2 italic">{unit.grammarTarget}</p>
                                {unit.whyHardNote && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 text-sm text-amber-800">
                                        <span className="font-semibold">Why it's tricky: </span>
                                        {unit.whyHardNote}
                                    </div>
                                )}
                            </div>

                            {/* Locked guard */}
                            {unit.status === 'locked' ? (
                                <div className="text-center py-16">
                                    <Lock className="h-12 w-12 text-gray-300 mx-auto" />
                                    <p className="text-gray-400 font-medium mt-3">This unit is locked</p>
                                    <p className="text-sm text-gray-400 mt-1">Complete earlier units to unlock it.</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-[#4e342e] mb-4 mt-8">Lessons</h2>
                                    {unit.lessons.map((lesson) => (
                                        <div
                                            key={lesson.id}
                                            className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm mb-3 flex items-start justify-between gap-4"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs text-gray-400">Lesson {lesson.order}</span>
                                                <p className="font-semibold text-gray-900">{lesson.title}</p>
                                                <p className="text-sm text-gray-500 mt-1">{lesson.objective}</p>
                                                <span className="text-xs text-gray-400 mt-2 inline-block">
                                                    {lesson.durationMinutes ?? 20} min
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                {lessonStatusBadge(lesson)}
                                                {lessonCTA(lesson)}
                                                {lessonError === lesson.id && (
                                                    <p className="text-red-500 text-xs">Something went wrong</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
