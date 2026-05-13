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

    await pool.query(
      'ALTER TABLE leave_records ADD COLUMN IF NOT EXISTS description TEXT'
    );

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

    // Monthly debt recurrence tables (global templates + idempotent occurrences).
    await pool.query(`
      CREATE TABLE IF NOT EXISTS debt_recurrence_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_entity TEXT NOT NULL CHECK (
          from_entity IN ('lev', 'danik', '2masters')
        ),
        to_entity TEXT NOT NULL CHECK (
          to_entity IN ('lev', 'danik', '2masters')
        ),
        amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
        description TEXT,
        day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
        start_date DATE NOT NULL,
        end_date DATE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT debt_recurrence_different_entities CHECK (from_entity != to_entity),
        CONSTRAINT debt_recurrence_end_after_start CHECK (end_date IS NULL OR end_date >= start_date)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS debt_recurrence_occurrences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES debt_recurrence_templates(id) ON DELETE CASCADE,
        calendar_year INTEGER NOT NULL,
        calendar_month INTEGER NOT NULL CHECK (calendar_month >= 1 AND calendar_month <= 12),
        transaction_id UUID NOT NULL REFERENCES debt_transactions_v2(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (template_id, calendar_year, calendar_month)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_debt_recurrence_templates_active
      ON debt_recurrence_templates(active) WHERE active = TRUE
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_debt_recurrence_occurrences_template
      ON debt_recurrence_occurrences(template_id)
    `);

    console.log('Runtime schema is up to date');
    process.exit(0);
  } catch (error) {
    console.error('Failed to ensure runtime schema:', error);
    process.exit(1);
  }
}

ensureRuntimeSchema();
