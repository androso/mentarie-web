import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { PracticeLesson } from "@/lib/types";

export function usePracticeLesson(lessonId: number | string | undefined) {
    return useQuery<PracticeLesson>({
        queryKey: [`/api/practice-lessons/${lessonId}`],
        queryFn: getQueryFn<PracticeLesson>({ on401: "returnNull" }),
        enabled: !!lessonId,
    });
}
