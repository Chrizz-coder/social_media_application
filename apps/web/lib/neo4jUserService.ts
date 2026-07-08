import neo4j from 'neo4j-driver';

/**
 * Upserts a User node in Neo4j from the web application context.
 *
 * Uses MERGE so repeated logins never create duplicate nodes.
 * Stores only `id` and `username` — MongoDB remains the source of truth
 * for all user profile data.
 *
 * This function is called fire-and-forget from auth.ts after a successful
 * MongoDB upsert. It must never throw into the authentication flow.
 *
 * A new driver is created per call because Next.js server components do
 * not share a long-lived module singleton across requests the same way
 * a standalone Express process does. The driver is closed after each use.
 */
export async function upsertUserNode(id: string, username: string): Promise<void> {
  const URI      = process.env.NEO4J_URI;
  const USER     = process.env.NEO4J_USERNAME;
  const PASSWORD = process.env.NEO4J_PASSWORD;

  if (!URI || !USER || !PASSWORD) {
    console.warn('[neo4j/web] Missing env vars — skipping Neo4j sync');
    return;
  }

  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  const session = driver.session();
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
    await driver.close();
  }
}

