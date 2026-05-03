import pool from '../config/database';
import { setupDatabase } from './setupDatabase';

async function ensureRuntimeSchema() {
  try {
    console.log('Ensuring runtime schema...');

    const { rows } = await pool.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
      ) AS exists
    `);
    const usersTableExists = rows[0]?.exists === true;

    if (!usersTableExists) {
      console.log(
        'No public.users table found; running full schema setup and default users...'
      );
      await setupDatabase();
    } else {
      // Auth queries this column; make sure it exists for older DB volumes.
      await pool.query(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255)'
      );
    }

    // Debt tracker v2 relies on this table.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS debt_transactions_v2 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_entity TEXT NOT NULL CHECK (
          from_entity IN ('lev', 'danik', '2masters')
        ),
        to_entity TEXT NOT NULL CHECK (
          to_entity IN ('lev', 'danik', '2masters')
        ),
        amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
        timestamp BIGINT NOT NULL,
        description TEXT,
        CONSTRAINT different_entities CHECK (from_entity != to_entity)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_debt_transactions_v2_timestamp
      ON debt_transactions_v2(timestamp DESC)
    `);

    console.log('Runtime schema is up to date');
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure runtime schema:', error);
    process.exit(1);
  }
}

ensureRuntimeSchema();
