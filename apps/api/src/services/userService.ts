import { driver } from "../neo4j";

/**
 * Creates or updates a User node in Neo4j.
 * Using MERGE ensures the node is only created if it doesn't exist.
 */
export async function createUserNode(id: string, username: string) {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      return await tx.run(
        `
        MERGE (u:USER {id: $id})
        SET u.username = $username, u.updatedAt = timestamp()
        `,
        { id, username }
      );
    });
  } finally {
    await session.close(); // Mandatory cleanup to free resources
  }
}

/**
 * Updates an existing User's properties.
 */
export async function updateUser(id: string, username: string) {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      return await tx.run(
        `
        MATCH (u:USER {id: $id})
        SET u.username = $username, u.updatedAt = timestamp()
        `,
        { id, username }
      );
    });
  } finally {
    await session.close();
  }
}

/**
 * Deletes a User node and all its connected relationships.
 */
export async function deleteUser(id: string) {
  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      return await tx.run(
        `
        MATCH (u:USER {id: $id})
        DETACH DELETE u
        `,
        { id }
      );
    });
  } finally {
    await session.close();
  }
}
