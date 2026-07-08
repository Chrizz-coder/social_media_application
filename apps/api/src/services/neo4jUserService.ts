import { getDriver } from '../neo4j';

/**
 * Upserts a User node in Neo4j.
 *
 * Uses MERGE so repeated calls on the same `id` never create duplicate nodes.
 * Stores only `id` and `username` — MongoDB remains the source of truth for
 * all user profile data.
 *
 * This is the single canonical function for writing User nodes to Neo4j.
 * Use it for:
 *  - OAuth first login (auth.ts)
 *  - Seed scripts
 *  - Future username/display-name updates (profile mutation resolvers)
 */
export async function upsertUserNode(id: string, username: string): Promise<void> {
  const session = getDriver().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (u:User {id: $id})
        SET u.username   = $username,
            u.updatedAt  = timestamp()
        `,
        { id, username }
      )
    );
  } finally {
    await session.close();
  }
}

/**
 * Deletes a User node and ALL of its relationships from Neo4j.
 * Only call this when the user is permanently deleted from MongoDB.
 */
export async function deleteUserNode(id: string): Promise<void> {
  const session = getDriver().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (u:User {id: $id})
        DETACH DELETE u
        `,
        { id }
      )
    );
  } finally {
    await session.close();
  }
}
