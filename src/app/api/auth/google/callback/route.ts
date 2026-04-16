import { NextRequest, NextResponse } from "next/server";

const backendApiUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type GoogleCallbackResponse = {
  token?: {
    accessTk?: string;
    refreshTk?: string;
  };
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=oauth_missing_params", request.url));
  }

  const backendUrl = new URL(`${backendApiUrl}/api/auth/google/callback`);
  backendUrl.searchParams.set("code", code);
  backendUrl.searchParams.set("state", state);

  const callbackResponse = await fetch(backendUrl.toString(), {
    method: "GET",
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!callbackResponse.ok) {
    return NextResponse.redirect(new URL("/?error=oauth_callback_failed", request.url));
  }

  const data = (await callbackResponse.json()) as GoogleCallbackResponse;
  const accessToken = data.token?.accessTk;
  const refreshToken = data.token?.refreshTk;

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/?error=oauth_missing_tokens", request.url));
  }

  const redirectUrl = new URL("/home", request.url);
  redirectUrl.searchParams.set("accessToken", accessToken);
  redirectUrl.searchParams.set("refreshToken", refreshToken);

  return NextResponse.redirect(redirectUrl);
}
