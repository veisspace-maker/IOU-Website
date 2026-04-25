import pool from '../config/database';

async function testSalesItems() {
  const client = await pool.connect();
  
  try {
    console.log('Testing sales_items table...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sales_items'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    // Check table structure
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_items'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nTable structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\nSales items table is ready!');
  } catch (error) {
    console.error('Error testing sales_items table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testSalesItems();
