import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
	clearAccessToken,
	getAccessToken,
	setAccessToken,
} from "@/lib/authTokens";

function getAuthHeaders(): Record<string, string> {
	const token = getAccessToken();
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
		try {
			const res = await fetch("/api/auth/refresh", {
				method: "POST",
				credentials: "include",
			});

			if (!res.ok) {
				clearAccessToken();
				return false;
			}

			const data = (await res.json()) as { accessToken?: string };
			if (!data.accessToken) {
				clearAccessToken();
				return false;
			}

			setAccessToken(data.accessToken);
			return true;
		} catch {
			clearAccessToken();
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
