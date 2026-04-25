import pool from '../config/database';

async function addSalesItemsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Creating sales_items table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating index on sales_items name...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sales_items_name ON sales_items(name);
    `);
    
    console.log('Creating trigger for sales_items updated_at...');
    await client.query(`
      CREATE TRIGGER update_sales_items_updated_at 
      BEFORE UPDATE ON sales_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('Sales items table created successfully!');
  } catch (error) {
    console.error('Error creating sales_items table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addSalesItemsTable();
