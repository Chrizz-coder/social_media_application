import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute =
    req.nextUrl.pathname === "/feed" ||
    req.nextUrl.pathname.startsWith("/post/") ||
    req.nextUrl.pathname.startsWith("/profile/") ||
    req.nextUrl.pathname === "/compose";

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return null;
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return null;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
