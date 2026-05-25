import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Edge-compatible auth config — no Node.js APIs, no mongoose.
 * Used by middleware.ts to protect routes without hitting the DB.
 * The full config (with MongoDB adapter + JWT upsert) lives in auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages:   { signIn: "/login" },
  providers: [], // providers are added in auth.ts

  callbacks: {
    // Route protection — runs in the Edge Runtime on every request
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn  = !!auth?.user;
      const { pathname } = nextUrl;

      const isAuthPage = pathname.startsWith("/login");

      const isProtectedRoute =
        pathname === "/feed" ||
        pathname === "/compose" ||
        pathname === "/notifications" ||
        pathname === "/search" ||
        pathname.startsWith("/profile/") ||
        pathname.startsWith("/post/");

      if (isAuthPage) {
        if (isLoggedIn) return NextResponse.redirect(new URL("/feed", nextUrl));
        return true; // allow login page for unauthenticated users
      }

      if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl));
      }

      return true;
    },

    // Minimal session callback — real logic is in auth.ts
    session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { _id: string })._id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
