import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getAuthHeaders(): Record<string, string> {
	if (typeof window === "undefined") {
		return {};
	}

	const token = localStorage.getItem("accessToken");
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfResNotOk(res: Response) {
	if (!res.ok) {
		const text = (await res.text()) || res.statusText;
		throw new Error(`${res.status}: ${text}`);
	}
}

// Deduplicates concurrent refresh calls — only one request goes out at a time.
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		const refreshToken = localStorage.getItem("refreshToken");
		if (!refreshToken) return false;

		try {
			const res = await fetch("/api/auth/refresh", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ refreshToken }),
			});

			if (!res.ok) return false;

			const data = await res.json();
			localStorage.setItem("accessToken", data.accessToken);
			return true;
		} catch {
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

export async function apiRequest(
	method: string,
	url: string,
	data?: unknown | undefined,
): Promise<Response> {
	const res = await fetch(url, {
		method,
		headers: {
			...(data ? { "Content-Type": "application/json" } : {}),
			...getAuthHeaders(),
		},
		body: data ? JSON.stringify(data) : undefined,
		credentials: "include",
	});

	if (res.status === 401) {
		const refreshed = await attemptTokenRefresh();
		if (refreshed) {
			const retryRes = await fetch(url, {
				method,
				headers: {
					...(data ? { "Content-Type": "application/json" } : {}),
					...getAuthHeaders(),
				},
				body: data ? JSON.stringify(data) : undefined,
				credentials: "include",
			});
			await throwIfResNotOk(retryRes);
			return retryRes;
		}
	}

	await throwIfResNotOk(res);
	return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
	on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
	({ on401: unauthorizedBehavior }) =>
	async ({ queryKey }) => {
		const res = await fetch(queryKey[0] as string, {
			headers: {
				...getAuthHeaders(),
			},
			credentials: "include",
		});

		if (res.status === 401) {
			const refreshed = await attemptTokenRefresh();
			if (refreshed) {
				const retryRes = await fetch(queryKey[0] as string, {
					headers: { ...getAuthHeaders() },
					credentials: "include",
				});
				if (retryRes.ok) return await retryRes.json();
			}

			if (unauthorizedBehavior === "returnNull") return null;
			await throwIfResNotOk(res);
		}

		await throwIfResNotOk(res);
		return await res.json();
	};

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryFn: getQueryFn({ on401: "throw" }),
			refetchInterval: false,
			refetchOnWindowFocus: false,
			staleTime: Infinity,
			retry: false,
		},
		mutations: {
			retry: false,
		},
	},
});
