/**
 * Add sample data to make the app usable
 */

import pool from '../config/database';

async function addSampleData() {
  try {
    console.log('Adding sample data...\n');

    // Add a sample public holiday
    console.log('Adding sample holiday...');
    await pool.query(
      `INSERT INTO public_holidays (name, date, is_recurring) 
       VALUES ('New Year''s Day', '2026-01-01', true)
       ON CONFLICT DO NOTHING`
    );
    console.log('✅ Sample holiday added\n');

    console.log('✅ Sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();
