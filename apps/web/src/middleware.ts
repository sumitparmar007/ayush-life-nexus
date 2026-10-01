/**
 * Middleware is intentionally minimal.
 *
 * Authentication is enforced by (app)/layout.tsx (a server component that
 * reads the cookie on every request). Middleware only handles the fast-path
 * for static assets — it does NOT duplicate auth logic, which was the root
 * cause of redirect loops in the previous implementation.
 */
import { type NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};
