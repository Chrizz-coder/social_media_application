/**
 * Re-exports the shared Neo4j driver from @social/neo4j.
 *
 * The driver is a lazy singleton — created on first call to getDriver(),
 * reused on every subsequent call. Sessions must be created per-operation
 * and always closed in finally blocks.
 */
export { getDriver } from '@social/neo4j';
