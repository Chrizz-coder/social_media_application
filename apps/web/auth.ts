import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { authConfig } from "./auth.config";
import { upsertUserNode } from "@/lib/neo4jUserService";

/**
 * Auth.js v5 configuration — NO MongoDBAdapter.
 *
 * Why no adapter?
 * - Session strategy is JWT (auth.config.ts). No database sessions are needed.
 * - The adapter's only role here was calling createUser() on first OAuth login,
 *   inserting { email, name, image } into the `users` collection without a
 *   `username` field. This violated the Mongoose unique index on `username`
 *   for every second user, causing E11000 before the jwt callback could run.
 * - The jwt callback already performs a correct findOneAndUpdate upsert with
 *   all required fields. No adapter is needed.
 * - OAuth account linking across providers is handled by email as the identity
 *   key in the jwt callback upsert.
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,

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

  callbacks: {
    async jwt({ token, user, profile }) {
      // `user` is present on every sign-in event (OAuth flow).
      // On session reads (no sign-in), `user` is absent — skip DB work.
      if (user?.email) {
        await connectDB();

        const email = user.email;
        const baseUsername = email.split("@")[0];
        const displayName =
          (profile as { name?: string } | undefined)?.name ||
          user.name ||
          baseUsername;

        // 1. Check if user already exists
        let existingUser = await User.findOne({ email }).lean();
        let targetUsername = baseUsername;

        if (!existingUser) {
          // 2. Generate a unique username if this is a new user
          let isUnique = false;
          let counter = 1;
          while (!isUnique) {
            const checkUsername = counter === 1 ? baseUsername : `${baseUsername}${counter}`;
            const exists = await User.exists({ username: checkUsername });
            if (!exists) {
              targetUsername = checkUsername;
              isUnique = true;
            } else {
              counter++;
            }
          }
        }

        // 3. Upsert the application user. 
        // The aggregation pipeline update uses $ifNull so existing fields are never overwritten.
        // We MUST initialize all non-nullable GraphQL fields here because pipeline updates bypass Mongoose defaults.
        const dbUser = await User.findOneAndUpdate(
          { email },
          [
            {
              $set: {
                displayName: { $ifNull: ["$displayName", displayName] },
                username: { $ifNull: ["$username", targetUsername] },
                isVerified: { $ifNull: ["$isVerified", false] },
                role: { $ifNull: ["$role", "user"] },
                followerCount: { $ifNull: ["$followerCount", 0] },
                followingCount: { $ifNull: ["$followingCount", 0] },
                bookmarksCount: { $ifNull: ["$bookmarksCount", 0] },
              },
            },
          ],
          { new: true, upsert: true, updatePipeline: true }
        );

        token.sub   = (dbUser._id as { toString(): string }).toString();
        token.email = email;

        // Fire-and-forget Neo4j sync — must never block or fail authentication.
        upsertUserNode(token.sub, dbUser.username).catch((err) =>
          console.error("[auth] Neo4j sync failed (non-fatal):", err)
        );
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
