/**
 * Set a simple password for Leva for mobile login
 */

import pool from '../config/database';
import bcrypt from 'bcrypt';

async function setSimplePassword() {
  try {
    const username = 'Leva';
    const newPassword = '1234';  // Super simple password
    
    console.log(`Setting simple password for user: ${username}`);
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the user
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [passwordHash, username]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      process.exit(1);
    }
    
    console.log(`✅ Password updated successfully!`);
    console.log(`   Username: ${username}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`\nYou can now login on your phone with these credentials.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting password:', error);
    process.exit(1);
  }
}

setSimplePassword();
