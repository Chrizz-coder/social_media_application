import { getDriver } from '../neo4j';


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
