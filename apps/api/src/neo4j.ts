import neo4j, { Driver } from "neo4j-driver";

const URI = process.env.NEO4J_URI;
const USER = process.env.NEO4J_USERNAME;
const PASSWORD = process.env.NEO4J_PASSWORD;

if (!URI || !USER || !PASSWORD) {
  throw new Error(
    "Missing Neo4j environment variables: NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD",
  );
}

export let driver: Driver;

try {
  driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));
  driver
    .verifyConnectivity()
    .then(() => console.log("✅ Connection to Neo4j established"))
    .catch((err) => console.error("❌ Neo4j connection failed:", err));
} catch (error) {
  console.error("❌ Failed to initialize Neo4j driver:", error);
}
