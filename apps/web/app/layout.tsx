import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { ApolloClientProvider } from "@/lib/apollo-provider";
import { SessionProvider } from "next-auth/react";
import jwt from "jsonwebtoken";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const viewport: Viewport = {
  themeColor: "#0a0914",
};

export const metadata: Metadata = {
  title: { default: "Social", template: "%s · Social" },
  description: "A production-grade open-source social network.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  // Sign a short-lived JWT for the GraphQL API (same JWT_SECRET as the API).
  // This runs server-side on every request, so the token is always fresh.
  let apiToken: string | null = null;
  const userId = (session?.user as any)?._id as string | undefined;
  if (userId && process.env.JWT_SECRET) {
    apiToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  }

  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SessionProvider session={session}>
          <ApolloClientProvider token={apiToken}>
            {children}
          </ApolloClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
