import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/agency/:path*", "/api/agency/:path*"],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");
  const isAgencyRoute = pathname.startsWith("/agency") || pathname.startsWith("/api/agency");

  // Never gate the login page itself, or callers loop-redirect forever.
  if (pathname === "/admin/login") return NextResponse.next();

  // Accept the session either from the cookie (browser navigation) or an
  // Authorization header (server-to-server / API clients).
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const session = await verifySession(cookieToken ?? headerToken);

  const deny = (status: 403 | 401) => {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden — you don't have access to this resource." }, { status });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  };

  if (!session) return deny(401);

  if (isAgencyRoute) {
    // Admins can view any agency's dashboard; partner_agency users are
    // scoped to their own agency's slug, checked from the JWT claim set at
    // login — no DB round trip needed in middleware (which may run on the
    // Edge runtime, where extra latency compounds across every request).
    if (session.role === "admin") {
      // fall through — full access
    } else if (session.role === "partner_agency") {
      const slugInPath = pathname.split("/")[2]; // /agency/[slug]/... or /api/agency/[slug]/...
      if (!slugInPath || session.agencySlug !== slugInPath) {
        return deny(403);
      }
    } else {
      return deny(403);
    }
  } else {
    // /admin/* and /api/admin/* — admin role only.
    if (session.role !== "admin") return deny(403);
  }

  // Pass the verified identity down to Server Components/Route Handlers via
  // request headers, so they don't need to re-verify the JWT.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-user-role", session.role);
  if (session.agencyId) requestHeaders.set("x-agency-id", session.agencyId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}
