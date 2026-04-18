import { NextRequest, NextResponse } from "next/server";

const backendApiUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export async function POST(request: NextRequest) {
  const res = await fetch(`${backendApiUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
