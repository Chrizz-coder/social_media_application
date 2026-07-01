import neo4j, { Driver } from 'neo4j-driver';

/**
 * Lazy Neo4j driver singleton.
 *
 * - Created on the first call to getDriver().
 * - Reused on every subsequent call — never one driver per request.
 * - Sessions must be created per-operation and closed inside finally blocks.
 * - Call getDriver().close() only during application shutdown or seed scripts.
 */
let _driver: Driver | null = null;

export function getDriver(): Driver {
  if (_driver) return _driver;

  const URI      = process.env.NEO4J_URI;
  const USER     = process.env.NEO4J_USERNAME;
  const PASSWORD = process.env.NEO4J_PASSWORD;

  if (!URI || !USER || !PASSWORD) {
    const msg =
      '[neo4j] Missing NEO4J_URI, NEO4J_USERNAME, or NEO4J_PASSWORD. ' +
      'Neo4j features will be unavailable.';
    console.warn(msg);
    // Return a stub that immediately rejects on any I/O — callers must
    // handle this gracefully (they already wrap in try/catch).
    throw new Error(msg);
  }

  _driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

  // Verify once asynchronously — never blocks application startup.
  _driver
    .verifyConnectivity()
    .then(() => console.log('✅ [neo4j] Connection established'))
    .catch((err) => console.error('❌ [neo4j] Connectivity check failed:', err));

  return _driver;
}
