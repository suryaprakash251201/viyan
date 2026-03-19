import { NextResponse, type NextRequest } from "next/server";

function hasSessionToken(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value,
  );
}

export function proxy(request: NextRequest) {
  const isLoggedIn = hasSessionToken(request);
  const isOnLogin = request.nextUrl.pathname === "/login";

  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isOnLogin && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
