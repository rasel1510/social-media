import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip internal Next.js paths, static files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // matches files with extensions like .ico, .png, etc.
  ) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // Routes that do not require authentication (login & signup pages)
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // 2. Unauthenticated users trying to access any protected route (including home)
  if (!sessionCookie && !isAuthRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Authenticated users trying to access root or login/signup should be redirected home
  if (sessionCookie && (isAuthRoute || pathname === "/")) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 4. All other cases are allowed, but add cache control to prevent back-button showing stale authenticated content
  const response = NextResponse.next();
  
  // Prevent caching for all routes handled by proxy (except maybe static ones which are skipped at the top)
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  
  return response;
}

export const config = {
  // Match all paths except Next.js static files and favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
