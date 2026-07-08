import { getDriver } from '../neo4j';


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
