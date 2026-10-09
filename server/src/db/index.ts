import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Connection Pool Configuration
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30s
  connectionTimeoutMillis: 5000, // Return an error after 5s if connection cannot be established
});

// Pool Error Handling (idle clients)
pool.on('error', (err: Error) => {
  console.error('[Database Pool Error] Unexpected idle client error:', err.message);
});

/**
 * Standard Query Helper
 * Executes parameterized queries against the connection pool.
 */
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  if (env.NODE_ENV === 'development' && duration > 50) {
    console.log(`[DB Slow Query] ${duration}ms: ${text.slice(0, 80)}...`);
  }
  
  return res;
}

/**
 * Transaction Helper
 * Safely executes operations inside a database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK upon error.
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Verifies live database connectivity
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 AS connected');
    return res.rows[0]?.connected === 1;
  } catch (error) {
    console.error('[DB Connection Check Failed]:', error);
    return false;
  }
}

/**
 * Gracefully shuts down connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
