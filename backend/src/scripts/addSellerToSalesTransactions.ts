import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addSellerToSalesTransactions() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Starting migration: Adding seller column to sales_transactions...');
    
    await client.query('BEGIN');
    
    // Add seller column
    await client.query(`
      ALTER TABLE sales_transactions 
      ADD COLUMN IF NOT EXISTS seller VARCHAR(50) CHECK (seller IN ('leva', 'danik'));
    `);
    
    console.log('✓ Added seller column to sales_transactions table');
    
    // Create index for seller column
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_transactions_seller ON sales_transactions(seller);
    `);
    
    console.log('✓ Created index on seller column');
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('\nUpdated sales_transactions table:');
    console.log('- seller: VARCHAR(50) (leva or danik)');
    
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
addSellerToSalesTransactions()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
