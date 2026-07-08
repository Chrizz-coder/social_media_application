import neo4j, { Driver } from 'neo4j-driver';

/**
 * Lazy Neo4j driver singleton.
 *
 * - Created on the first call to getDriver() — never at module load time.
 * - Reused on every subsequent call — never one driver per request.
 * - Sessions must be created per-operation and closed inside finally blocks.
 * - Call getDriver().close() only during application shutdown or seed scripts.
 *
 * The application will NOT crash if NEO4J_* env vars are missing.
 * Callers (neo4jUserService, neo4jFollowService) already wrap calls in
 * try/catch and treat Neo4j failures as non-fatal.
 */
let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (_driver) return _driver;

  const URI      = process.env.NEO4J_URI;
  const USER     = process.env.NEO4J_USERNAME;
  const PASSWORD = process.env.NEO4J_PASSWORD;

  if (!URI || !USER || !PASSWORD) {
    throw new Error(
      '[neo4j] Missing NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD. ' +
      'Neo4j features will be unavailable.',
    );
  }

  _driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

  _driver
    .verifyConnectivity()
    .then(() => console.log('✅ [neo4j] Connection established'))
    .catch((err) => console.error('❌ [neo4j] Connectivity check failed:', err));

  return _driver;
}

