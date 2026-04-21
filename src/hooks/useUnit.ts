import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import type { UnitWithLessons, LessonProgressStatus } from "@/lib/types";

export function useUnit(unitId: number | string) {
    return useQuery<UnitWithLessons>({
        queryKey: [`/api/units/${unitId}`],
        queryFn: getQueryFn<UnitWithLessons>({ on401: "returnNull" }),
        enabled: !!unitId,
    });
}

export function useUpdateLessonProgress(unitId: number | string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            lessonId,
            status,
            score,
        }: {
            lessonId: number;
            status: LessonProgressStatus;
            score?: number;
        }) =>
            apiRequest("PUT", `/api/lessons/${lessonId}/progress`, {
                status,
                ...(score !== undefined ? { score } : {}),
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [`/api/units/${unitId}`] });
        },
    });
}
