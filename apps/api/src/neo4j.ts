import neo4j, { Driver } from 'neo4j-driver';

// 1. Define connection credentials (match your docker-compose environment settings)
const URI = process.env.NEO4J_URI || 'bolt://localhost:7687'; // Bolt is the binary protocol Neo4j uses
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'password123'; // The password from your docker file

let driver: Driver;

try {
  // 2. Creating a driver (Singleton pattern: initialized once for the whole application)
  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  console.log('✅ Neo4j Driver initialized successfully.');
} catch (error) {
  console.error('❌ Failed to create Neo4j Driver:', error);
  process.exit(1);
}

// Export the shared driver instance
export { driver };

import { driver } from './neo4j'; // Import your shared driver instance

async function getUserById(userId: string) {
  // 1. Creating a session
  // Always specify the default access mode ('read' or 'write') to help Neo4j optimize performance
  const session = driver.session({ database: 'neo4j', defaultAccessMode: neo4j.session.READ });

  try {
    // 2. Running a query
    // Use parameterized queries ($id) instead of string interpolation to prevent Cypher injection attacks
    const query = `
      MATCH (u:USER {id: $id}) 
      RETURN u.username AS username
    `;
    
    const result = await session.run(query, { id: userId });

    // Format and read the data rows returned
    if (result.records.length === 0) {
      return null;
    }
    
    const singleRecord = result.records[0];
    const username = singleRecord.get('username');
    
    return { id: userId, username };

  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    // 3. Closing a session
    // This 'finally' block ensures the connection closes even if the query crashes mid-way
    await session.close();
  }
}
