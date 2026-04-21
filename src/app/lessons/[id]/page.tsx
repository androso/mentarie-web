"use client"

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function LessonPage() {
    const router = useRouter();
    const params = useParams();
    const lessonId = params.id;
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return <div className="bg-gray-100 min-h-screen" />;
    }

    if (!user) {
        return null;
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto p-8">
                <button
                    onClick={() => router.push('/home')}
                    className="text-sm text-[#4e342e] hover:underline flex items-center gap-1 mb-6"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </button>

                <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                    <h1 className="text-3xl font-bold text-[#4e342e] mb-3">
                        Lesson {lessonId}
                    </h1>
                    <p className="text-gray-500">
                        Coming soon — lesson player is under construction.
                    </p>
                </div>
            </div>
        </div>
    );
}
