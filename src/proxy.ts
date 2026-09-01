import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";

// Matcher below already limits this middleware to /admin/* and /api/admin/*.
// /api/auth/* lives outside /api/admin/* on purpose so login/logout never need gating;
// only the /admin/login page itself needs to stay ungated.
const UNGATED_PATHS = ["/admin/login"];

function withNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, must-revalidate");
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (UNGATED_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return withNoStore(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }
    return withNoStore(NextResponse.redirect(new URL("/admin/login", req.url)));
  }

  return withNoStore(NextResponse.next());
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
