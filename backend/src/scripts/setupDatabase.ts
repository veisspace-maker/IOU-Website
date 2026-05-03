/**
 * Script to set up the database schema and initial users
 */

import pool from '../config/database';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

export async function setupDatabase(): Promise<void> {
  console.log('Setting up database...\n');

  // Read schema.sql
  const schemaPath = path.join(__dirname, '../config/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  console.log('Creating tables...');
  await pool.query(schema);
  console.log('✅ Tables created successfully\n');

  // Create default users
  console.log('Creating default users...');
  const defaultPassword = 'CompanyTracker2024!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const users = [
    { username: 'Leva', passwordHash },
    { username: 'Danik', passwordHash },
    { username: '2 Masters', passwordHash },
  ];

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (username, password_hash, pin_hash, two_factor_enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING`,
      [user.username, user.passwordHash, null, false]
    );
    console.log(`✅ Created user: ${user.username}`);
  }

  console.log('\n✅ Database setup complete!');
  console.log(`\nDefault password for all users: ${defaultPassword}`);
  console.log('⚠️  Please change passwords after first login!\n');
}

async function main() {
  try {
    await setupDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

const ranAsCli = /setupDatabase\.(ts|js)$/.test(process.argv[1] || '');
if (ranAsCli) {
  void main();
}
