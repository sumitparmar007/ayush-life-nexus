import { type NextRequest, NextResponse } from "next/server";
import { verifySessionJwt, makeClearCookieHeader, SESSION_COOKIE } from "@/lib/session.ts";
import { invalidateSession } from "@/lib/store.ts";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const sessionId = await verifySessionJwt(token);
    if (sessionId) invalidateSession(sessionId);
  }
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.headers.set("Set-Cookie", makeClearCookieHeader());
  return response;
}
