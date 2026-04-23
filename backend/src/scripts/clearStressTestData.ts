import pool from '../config/database';

async function clearStressTestData() {
  console.log('🧹 Clearing stress test data...\n');
  
  try {
    // Delete debt transactions
    const debtResult = await pool.query('DELETE FROM debt_transactions_v2');
    console.log(`✓ Deleted ${debtResult.rowCount} debt transactions`);
    
    // Delete sales transactions
    const salesResult = await pool.query('DELETE FROM sales_transactions');
    console.log(`✓ Deleted ${salesResult.rowCount} sales transactions`);
    
    // Delete leave records
    const leaveResult = await pool.query('DELETE FROM leave_records');
    console.log(`✓ Deleted ${leaveResult.rowCount} leave records`);
    
    // Delete birthdays (optional - you might want to keep these)
    const birthdaysResult = await pool.query('DELETE FROM birthdays');
    console.log(`✓ Deleted ${birthdaysResult.rowCount} birthdays`);
    
    console.log('\n✅ All stress test data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

clearStressTestData();
