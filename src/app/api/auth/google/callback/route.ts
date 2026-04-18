import { NextRequest, NextResponse } from "next/server";

const backendApiUrl =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  const refreshCookieHeader = callbackResponse.headers.get("set-cookie");
  if (!refreshCookieHeader) {
    return NextResponse.redirect(new URL("/?error=oauth_missing_refresh_cookie", request.url));
  }

  const refreshTokenMatch = refreshCookieHeader.match(/refresh_token=([^;]+)/);
  if (!refreshTokenMatch?.[1]) {
    return NextResponse.redirect(new URL("/?error=oauth_missing_refresh_cookie", request.url));
  }

  const redirectUrl = new URL("/home", request.url);
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set({
    name: "refresh_token",
    value: refreshTokenMatch[1],
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
