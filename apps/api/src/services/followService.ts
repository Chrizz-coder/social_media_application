import { driver } from "../neo4j";

export async function createFollowRelation(
  followerId: string,
  followingId: string,
) {
  const session = driver.session();
  try {
    await session.run(
      `
      MATCH (a:USER {id:$followerId})
      MATCH (b:USER {id:$followingId})
      MERGE (a)-[:FOLLOWS]->(b)
      `,
      { followerId, followingId },
    );
    console.log(
      `Successfully created Neo4j follow: ${followerId} -> ${followingId}`,
    );
  } catch (error) {
    console.log("Error creating neo4j follow relationship", error);
    throw error;
  } finally {
    await session.close();
  }
}

export async function deleteFollowRelation(
  followerId: string,
  followingId: string,
) {
  const session = driver.session();
  try {
    await session.executeWrite(tx=>
      tx.run(
      `
      MATCH (a:USER {id: $followerId})-[r:FOLLOWS]->(b:USER {id: $followingId})
      DELETE r
      `,
      { followerId, followingId },
    )
  );
  } finally {
    await session.close();
  }
}
