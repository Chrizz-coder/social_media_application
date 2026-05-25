import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware runs in the Edge Runtime — must NOT import mongoose or Node-only modules.
 * We use `authConfig` (the edge-compatible config) here, not the full `auth.ts`.
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Apply to all routes except Next.js internals, static files, and favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
