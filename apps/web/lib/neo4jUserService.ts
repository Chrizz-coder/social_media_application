import { getDriver } from '@social/neo4j';

/**
 * Upserts a User node in Neo4j from the web application context.
 *
 * Uses MERGE so repeated logins never create duplicate nodes.
 * Stores only `id` and `username` — MongoDB remains the source of truth
 * for all user profile data.
 *
 * This function is called fire-and-forget from auth.ts after a successful
 * MongoDB upsert. It must never throw into the authentication flow.
 */
export async function upsertUserNode(id: string, username: string): Promise<void> {
  const session = getDriver().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (u:User {id: $id})
        SET u.username  = $username,
            u.updatedAt = timestamp()
        `,
        { id, username }
      )
    );
  } finally {
    await session.close();
  }
}
