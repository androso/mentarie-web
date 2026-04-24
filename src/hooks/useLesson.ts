import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { LessonWithProgress } from "@/lib/types";

export function useLesson(lessonId: number | string | undefined) {
    return useQuery<LessonWithProgress>({
        queryKey: [`/api/lessons/${lessonId}`],
        queryFn: getQueryFn<LessonWithProgress>({ on401: "returnNull" }),
        enabled: !!lessonId,
    });
}
