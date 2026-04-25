import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function clearAllTransactions() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'company_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  
  try {
    console.log('Starting to clear all transactions...\n');
    
    await client.query('BEGIN');
    
    // Get counts before deletion
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) FROM transactions'),
      client.query('SELECT COUNT(*) FROM debt_transactions_v2'),
      client.query('SELECT COUNT(*) FROM sales_transactions'),
      client.query('SELECT COUNT(*) FROM leave_records'),
      client.query('SELECT COUNT(*) FROM birthdays'),
    ]);
    
    console.log('Current record counts:');
    console.log(`- Transactions (old debt): ${counts[0].rows[0].count}`);
    console.log(`- Debt Transactions V2: ${counts[1].rows[0].count}`);
    console.log(`- Sales Transactions: ${counts[2].rows[0].count}`);
    console.log(`- Leave Records: ${counts[3].rows[0].count}`);
    console.log(`- Birthdays: ${counts[4].rows[0].count}\n`);
    
    // Delete all records from each table
    await client.query('DELETE FROM transactions');
    console.log('✓ Cleared transactions table');
    
    await client.query('DELETE FROM debt_transactions_v2');
    console.log('✓ Cleared debt_transactions_v2 table');
    
    await client.query('DELETE FROM sales_transactions');
    console.log('✓ Cleared sales_transactions table');
    
    await client.query('DELETE FROM leave_records');
    console.log('✓ Cleared leave_records table');
    
    await client.query('DELETE FROM birthdays');
    console.log('✓ Cleared birthdays table');
    
    await client.query('COMMIT');
    
    console.log('\n✅ All transactions cleared successfully!');
    console.log('\nNote: User accounts remain intact.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to clear transactions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
clearAllTransactions()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
