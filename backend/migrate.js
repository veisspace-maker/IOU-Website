const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    
    // Make from_user_id nullable
    console.log('Making from_user_id nullable...');
    await pool.query(`
      ALTER TABLE transactions 
      ALTER COLUMN from_user_id DROP NOT NULL
    `);
    console.log('✓ from_user_id is now nullable');

    // Add transaction_type column
    console.log('Adding transaction_type column...');
    await pool.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20) NOT NULL DEFAULT 'personal'
    `);
    console.log('✓ transaction_type column added');

    // Drop old constraints
    console.log('Dropping old constraints...');
    await pool.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS different_users`);
    await pool.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check`);
    await pool.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS company_transaction_check`);
    
    // Add new constraints
    console.log('Adding new constraints...');
    await pool.query(`
      ALTER TABLE transactions 
      ADD CONSTRAINT different_users 
      CHECK (from_user_id IS NULL OR from_user_id != to_user_id)
    `);
    
    await pool.query(`
      ALTER TABLE transactions 
      ADD CONSTRAINT transactions_transaction_type_check 
      CHECK (transaction_type IN ('personal', 'company'))
    `);
    
    await pool.query(`
      ALTER TABLE transactions 
      ADD CONSTRAINT company_transaction_check 
      CHECK (
        (transaction_type = 'personal' AND from_user_id IS NOT NULL) OR
        (transaction_type = 'company' AND from_user_id IS NULL)
      )
    `);
    console.log('✓ Constraints added');

    console.log('\n✅ Migration completed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
