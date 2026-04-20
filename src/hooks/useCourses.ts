import { useQuery, useQueries } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { CourseWithUnits, EnrichedCourse, UnitWithStatus } from "@/lib/types";

export function useCourses(languageId?: number) {
    const url = languageId
        ? `/api/courses?languageId=${languageId}`
        : "/api/courses";
    return useQuery<EnrichedCourse[]>({
        queryKey: [url],
        queryFn: getQueryFn<EnrichedCourse[]>({ on401: "returnNull" }),
    });
}

// Fetches all courses for the user's language, then fetches units for each
// course matching the given levelCode. Returns an ordered list of courses
// with their units embedded, ready to render the level roadmap.
export function useLevelRoadmap(levelCode?: string, languageId?: number) {
    const coursesQuery = useCourses(languageId);

    const allCourses = coursesQuery.data ?? [];
    const levelCourses = levelCode
        ? allCourses.filter((c) => c.levelCode === levelCode)
        : allCourses;

    const unitQueries = useQueries({
        queries: levelCourses.map((course) => ({
            queryKey: [`/api/courses/${course.id}/units`],
            queryFn: getQueryFn<UnitWithStatus[]>({ on401: "returnNull" }),
            enabled: coursesQuery.isSuccess,
        })),
    });

    const isLoading =
        coursesQuery.isLoading || unitQueries.some((q) => q.isLoading);
    const isError =
        coursesQuery.isError || unitQueries.some((q) => q.isError);

    const coursesWithUnits: CourseWithUnits[] = levelCourses.map((course, i) => ({
        ...course,
        units: unitQueries[i]?.data ?? [],
    }));

    return { coursesWithUnits, isLoading, isError, allCourses };
}
