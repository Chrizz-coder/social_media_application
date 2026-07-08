import { getDriver } from '../neo4j';

/**
 * Creates a FOLLOWS relationship between two User nodes in Neo4j.
 *
 * Uses MERGE so re-following never creates duplicate edges.
 * Errors are caught and logged — MongoDB is the source of truth.
 * A Neo4j failure must never roll back the MongoDB Follow document.
 *
 * Call this ONLY after the MongoDB Follow document has been successfully written.
 */
export async function createFollowRelation(
  followerId: string,
  followingId: string,
): Promise<void> {
  const session = getDriver().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (a:User {id: $followerId})
        MATCH (b:User {id: $followingId})
        MERGE (a)-[:FOLLOWS]->(b)
        `,
        { followerId, followingId }
      )
    );
    console.log(`[neo4j] FOLLOWS created: ${followerId} → ${followingId}`);
  } catch (error) {
    // Non-fatal — log and continue. The social graph is eventually consistent.
    console.error('[neo4j] createFollowRelation failed (non-fatal):', error);
  } finally {
    await session.close();
  }
}

/**
 * Deletes the FOLLOWS relationship between two User nodes.
 *
 * Uses MATCH + DELETE on the relationship only — nodes are never deleted.
 * MongoDB Follow document deletion is handled separately by the resolver.
 */
export async function deleteFollowRelation(
  followerId: string,
  followingId: string,
): Promise<void> {
  const session = getDriver().session();
  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followingId})
        DELETE r
        `,
        { followerId, followingId }
      )
    );
  } catch (error) {
    // Non-fatal — log and continue. MongoDB unfollow already succeeded.
    console.error('[neo4j] deleteFollowRelation failed (non-fatal):', error);
  } finally {
    await session.close();
  }
}
