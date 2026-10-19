import { NextResponse, type NextRequest } from "next/server";

// Pages anyone can open. Everything else needs a session cookie; the cookie is
// fully verified server-side, this only avoids rendering app pages when signed out.
// /onboarding needs a session, so it is not listed here.
const PUBLIC_PREFIXES = ["/sign-in", "/sign-up", "/verify-email", "/forgot-password", "/invite/", "/s/", "/g/", "/api/", "/terms", "/privacy", "/pricing"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.has("mt_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|images/|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|ico|webp)$).*)"],
};
