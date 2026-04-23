/**
 * Script to initialize default users with hashed passwords
 * Run this script once to set up the three default users
 */

import pool from '../config/database';
import { hashPassword } from '../utils/passwordValidation';

async function initializeUsers() {
  try {
    console.log('Initializing default users...');

    // Default passwords (should be changed after first login)
    const defaultPassword = 'CompanyTracker2024!';

    // Hash the password
    const passwordHash = await hashPassword(defaultPassword);

    // Check if users already exist
    const existingUsers = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(existingUsers.rows[0].count);

    if (userCount > 0) {
      console.log(`Found ${userCount} existing users. Skipping initialization.`);
      console.log('To reset users, manually delete them from the database first.');
      return;
    }

    // Insert default users
    const users = [
      { username: 'Leva', passwordHash },
      { username: 'Danik', passwordHash },
      { username: '2 Masters', passwordHash },
    ];

    for (const user of users) {
      await pool.query(
        'INSERT INTO users (username, password_hash, two_factor_enabled) VALUES ($1, $2, $3)',
        [user.username, user.passwordHash, false]
      );
      console.log(`✓ Created user: ${user.username}`);
    }

    console.log('\n✅ User initialization complete!');
    console.log(`\nDefault password for all users: ${defaultPassword}`);
    console.log('⚠️  Please change passwords after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing users:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeUsers();
