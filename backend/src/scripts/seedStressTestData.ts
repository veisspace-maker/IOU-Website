import pool from '../config/database';

// Helper to generate random date within last 2 months
function randomDate(): string {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const randomTime = twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
}

// Helper to generate random amount with cents
function randomAmount(min: number = 0, max: number = 10000): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper to randomly include description
function randomDescription(): string | null {
  const descriptions = [
    'Payment for services',
    'Lunch money',
    'Borrowed for supplies',
    'Shared expense',
    'Emergency loan',
    'Weekly settlement',
    'Project materials',
    'Transportation costs',
    null, null, null // 30% chance of no description
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Helper for random item names
function randomItem(): string {
  const items = [
    'Widget A',
    'Product B',
    'Service C',
    'Item D',
    'Package E',
    'Bundle F',
    'Special G',
    'Premium H',
    'Standard I',
    'Deluxe J'
  ];
  return items[Math.floor(Math.random() * items.length)];
}

async function seedDebtTransactions() {
  console.log('Seeding 1000 debt transactions...');
  const entities = ['lev', 'danik', '2masters']; // lowercase as per schema
  
  for (let i = 0; i < 1000; i++) {
    const fromEntity = entities[Math.floor(Math.random() * entities.length)];
    let toEntity = entities[Math.floor(Math.random() * entities.length)];
    
    // Ensure from and to are different
    while (toEntity === fromEntity) {
      toEntity = entities[Math.floor(Math.random() * entities.length)];
    }
    
    const amount = randomAmount();
    const timestamp = Date.now() - Math.floor(Math.random() * 60 * 24 * 60 * 60 * 1000); // last 2 months in ms
    const description = randomDescription();
    
    await pool.query(
      `INSERT INTO debt_transactions_v2 (from_entity, to_entity, amount, timestamp, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [fromEntity, toEntity, amount, timestamp, description]
    );
    
    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/1000 debt transactions created`);
    }
  }
  console.log('✓ Debt transactions seeded');
}

async function seedSalesTransactions() {
  console.log('Seeding 500 sales transactions...');
  
  // Get user IDs for Lev and Danik
  const usersResult = await pool.query(
    `SELECT id, username FROM users WHERE LOWER(username) IN ('lev', 'leva', 'danik')`
  );
  
  if (usersResult.rows.length === 0) {
    console.log('⚠ No users found. Skipping sales transactions.');
    return;
  }
  
  const users = usersResult.rows;
  
  for (let i = 0; i < 500; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    // Seller must be 'leva' or 'danik' (lowercase) per check constraint
    const seller = user.username.toLowerCase() === 'leva' ? 'leva' : 'danik';
    const item = randomItem();
    const price = randomAmount();
    const quantity = Math.floor(Math.random() * 20) + 1; // 1-20
    const date = randomDate();
    const description = randomDescription();
    
    await pool.query(
      `INSERT INTO sales_transactions (seller, item, price, quantity, date, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [seller, item, price, quantity, date, description, user.id]
    );
    
    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/500 sales transactions created`);
    }
  }
  console.log('✓ Sales transactions seeded');
}

async function seedLeaveTransactions() {
  console.log('Seeding 100 leave transactions...');
  
  // Get user IDs for Lev and Danik
  const usersResult = await pool.query(
    `SELECT id, username FROM users WHERE LOWER(username) IN ('lev', 'leva', 'danik')`
  );
  
  if (usersResult.rows.length === 0) {
    console.log('⚠ No users found. Skipping leave transactions.');
    return;
  }
  
  const users = usersResult.rows;
  
  for (let i = 0; i < 100; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const startDate = randomDate();
    
    // Random duration 1-5 days
    const duration = Math.floor(Math.random() * 5) + 1;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Business days will be calculated by the system, just use duration as estimate
    const businessDays = duration;
    
    await pool.query(
      `INSERT INTO leave_records (user_id, start_date, end_date, business_days)
       VALUES ($1, $2, $3, $4)`,
      [user.id, startDate, endDateStr, businessDays]
    );
    
    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/100 leave transactions created`);
    }
  }
  console.log('✓ Leave transactions seeded');
}

async function seedBirthdays() {
  console.log('Seeding birthdays...');
  const birthdays = [
    { name: 'Lev', date: '1990-05-15' },
    { name: 'Danik', date: '1992-08-22' },
    { name: 'Master 1', date: '1985-03-10' },
    { name: 'Master 2', date: '1988-11-30' },
    { name: 'Alice', date: '1995-01-07' },
    { name: 'Bob', date: '1993-09-18' }
  ];
  
  for (const birthday of birthdays) {
    await pool.query(
      `INSERT INTO birthdays (name, date_of_birth) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET date_of_birth = $2`,
      [birthday.name, birthday.date]
    );
  }
  console.log('✓ Birthdays seeded');
}

async function main() {
  console.log('🚀 Starting stress test data seeding...\n');
  
  try {
    await seedDebtTransactions();
    await seedSalesTransactions();
    await seedLeaveTransactions();
    await seedBirthdays();
    
    console.log('\n✅ All stress test data seeded successfully!');
    console.log('\nSummary:');
    console.log('  - 1000 debt transactions');
    console.log('  - 500 sales transactions');
    console.log('  - 100 leave entries');
    console.log('  - 6 birthdays');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main();
