import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addQuantityToSalesTransactions() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Adding quantity column to sales_transactions...');
    
    await client.query('BEGIN');
    
    // Add quantity column with default value of 1
    await client.query(`
      ALTER TABLE sales_transactions 
      ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0);
    `);
    
    console.log('✓ Added quantity column to sales_transactions table');
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('\nUpdated sales_transactions table:');
    console.log('- quantity: INTEGER (must be > 0, defaults to 1)');
    
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
addQuantityToSalesTransactions()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
