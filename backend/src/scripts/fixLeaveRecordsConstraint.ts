import pool from '../config/database.js';

/**
 * Fix the leave_records business_days constraint to allow 0 business days
 * This is needed when leave periods fall entirely on weekends/holidays
 */
async function fixLeaveRecordsConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing leave_records business_days constraint...');
    
    // Drop the old constraint
    await client.query(`
      ALTER TABLE leave_records 
      DROP CONSTRAINT IF EXISTS leave_records_business_days_check;
    `);
    
    // Add the new constraint that allows >= 0
    await client.query(`
      ALTER TABLE leave_records 
      ADD CONSTRAINT leave_records_business_days_check 
      CHECK (business_days >= 0);
    `);
    
    console.log('✓ Successfully updated leave_records constraint to allow business_days >= 0');
    
  } catch (error) {
    console.error('Error fixing constraint:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixLeaveRecordsConstraint();
