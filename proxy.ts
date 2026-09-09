import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip internal Next.js paths, static files, API routes, and Server Actions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") || // matches files with extensions like .ico, .png, etc.
    request.headers.has("next-action")
  ) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // Routes that do not require authentication (login, signup, and password reset pages)
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

  // 2. Unauthenticated users trying to access any protected route (including home)
  if (!sessionCookie && !isAuthRoute) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Authenticated users trying to access root should be redirected home
  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 4. All other cases are allowed
  return NextResponse.next();
}

export const config = {
  // Match all paths except Next.js static files and favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
