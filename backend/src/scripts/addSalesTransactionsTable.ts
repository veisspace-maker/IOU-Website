import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function addSalesTransactionsTable() {
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
    console.log('Starting migration: Adding sales_transactions table...');
    
    await client.query('BEGIN');
    
    // Create sales_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
        date DATE NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✓ Created sales_transactions table');
    
    // Create indexes for common queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_transactions_id ON sales_transactions(id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_by ON sales_transactions(created_by);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_transactions_date ON sales_transactions(date);
    `);
    
    console.log('✓ Created indexes on sales_transactions table');
    
    // Create trigger for updated_at
    await client.query(`
      CREATE TRIGGER update_sales_transactions_updated_at 
      BEFORE UPDATE ON sales_transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✓ Created trigger for updated_at column');
    
    // Add comment
    await client.query(`
      COMMENT ON TABLE sales_transactions IS 'Records sales transactions with item, price, date, and optional description';
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('\nSales transactions table structure:');
    console.log('- id: UUID (primary key, auto-generated)');
    console.log('- item: VARCHAR(255) (product/service name)');
    console.log('- price: DECIMAL(10, 2) (must be > 0)');
    console.log('- date: DATE (sale date)');
    console.log('- description: TEXT (optional)');
    console.log('- created_by: UUID (references users)');
    console.log('- created_at: TIMESTAMPTZ (auto-generated)');
    console.log('- updated_at: TIMESTAMPTZ (auto-updated)');
    console.log('\nIndexes:');
    console.log('- idx_sales_transactions_id (on id)');
    console.log('- idx_sales_transactions_created_by (on created_by)');
    console.log('- idx_sales_transactions_date (on date)');
    
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
addSalesTransactionsTable()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
