import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addDebtTransactionsV2Table() {
  // Create pool directly instead of importing
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Adding debt_transactions_v2 table...');
    
    await client.query('BEGIN');
    
    // Create debt_transactions_v2 table
    await client.query(`
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
      );
    `);
    
    console.log('✓ Created debt_transactions_v2 table');
    
    // Create index on timestamp for efficient chronological queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_debt_transactions_v2_timestamp 
      ON debt_transactions_v2(timestamp DESC);
    `);
    
    console.log('✓ Created index on timestamp column');
    
    // Add comment
    await client.query(`
      COMMENT ON TABLE debt_transactions_v2 IS 
      'Transaction-based debt tracking system for Lev, Danik, and 2Masters. Stores raw transactions with lowercase entity names.';
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('\nDebt transactions v2 table structure:');
    console.log('- id: UUID (primary key, auto-generated)');
    console.log('- from_entity: TEXT (must be lev, danik, or 2masters)');
    console.log('- to_entity: TEXT (must be lev, danik, or 2masters)');
    console.log('- amount: DECIMAL(10, 2) (must be > 0)');
    console.log('- timestamp: BIGINT (Unix epoch milliseconds)');
    console.log('- description: TEXT (optional)');
    console.log('\nConstraints:');
    console.log('- from_entity must be different from to_entity');
    console.log('- Both entities must be one of: lev, danik, 2masters (lowercase)');
    console.log('- Amount must be positive');
    console.log('\nIndexes:');
    console.log('- idx_debt_transactions_v2_timestamp (on timestamp DESC for chronological queries)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
addDebtTransactionsV2Table()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
