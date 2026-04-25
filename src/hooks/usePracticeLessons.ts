import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { PracticeLesson } from "@/lib/types";

export function usePracticeLessons(filters?: { language?: string; level?: string }) {
    const params = new URLSearchParams();
    if (filters?.language) params.set("language", filters.language);
    if (filters?.level) params.set("level", filters.level);
    const queryString = params.toString();
    const key = `/api/practice-lessons${queryString ? `?${queryString}` : ""}`;

    return useQuery<PracticeLesson[]>({
        queryKey: [key],
        queryFn: getQueryFn<PracticeLesson[]>({ on401: "returnNull" }),
    });
}
