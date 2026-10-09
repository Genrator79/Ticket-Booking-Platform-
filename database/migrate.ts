import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/ticket_booking';

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

async function ensureMigrationTable(client: pg.PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client: pg.PoolClient): Promise<Set<string>> {
  const result = await client.query('SELECT name FROM schema_migrations ORDER BY id ASC;');
  return new Set(result.rows.map((row) => row.name));
}

export async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log(`\n========================================`);
    console.log(` Database Migration Runner`);
    console.log(` Target: ${databaseUrl}`);
    console.log(`========================================`);

    await ensureMigrationTable(client);
    const applied = await getAppliedMigrations(client);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(` [SKIP] ${file} (already applied)`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(` [RUN]  Applying migration: ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(` [DONE] Successfully applied ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(` [FAIL] Migration failed on ${file}:`, err);
        throw err;
      }
    }

    console.log(`\nMigration process finished. ${count} new migration(s) applied.`);
  } finally {
    client.release();
  }
}

export async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log(`\n[RESET] Dropping all tables and resetting schema public...`);
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO CURRENT_USER;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log(`[RESET] Schema reset successfully. Re-running migrations...`);
  } finally {
    client.release();
  }

  await runMigrations();
}

// Direct CLI execution
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const isReset = process.argv.includes('--reset');
  const action = isReset ? resetDatabase() : runMigrations();

  action
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Fatal error during migration:', err);
      await pool.end();
      process.exit(1);
    });
}
