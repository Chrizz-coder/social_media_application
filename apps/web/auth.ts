import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectDB, getMongoClient } from "@/lib/db";
import { User } from "@/lib/models/User";
import { authConfig } from "./auth.config";

// Lazy promise — DB connection is only initiated on first request, not during next build.
let _clientPromise: ReturnType<typeof getMongoClient> | null = null;
function lazyClient(): ReturnType<typeof getMongoClient> {
  if (!_clientPromise) _clientPromise = getMongoClient();
  return _clientPromise;
}
// MongoDBAdapter accepts a PromiseLike — wrap our lazy factory in a thenable.
const clientPromise: Promise<Awaited<ReturnType<typeof getMongoClient>>> =
  { then: (...args: any[]) => lazyClient().then(...args) } as any;


export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig, // spread the edge-compatible base config

  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  // Override callbacks with the full server-side logic
  callbacks: {
    async jwt({ token, user, profile }) {
      // `user` is only present on the very first sign-in
      if (user) {
        await connectDB();

        const email = user.email!;
        const baseUsername = email.split("@")[0];
        const displayName =
          (profile as { name?: string } | undefined)?.name ||
          user.name ||
          baseUsername;

        // Upsert: set username only on first insert, always update displayName
        const dbUser = await User.findOneAndUpdate(
          { email },
          {
            $setOnInsert: { username: baseUsername },
            $set: { displayName },
          },
          { new: true, upsert: true }
        );

        token.sub = (dbUser._id as { toString(): string }).toString();
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { _id: string })._id = token.sub;
      }
      return session;
    },
  },
});
