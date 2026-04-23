/**
 * Quick script to reset a user's password
 */

import pool from '../config/database';
import bcrypt from 'bcrypt';

async function resetPassword() {
  try {
    const username = 'Leva';
    const newPassword = 'IOUP@ss321!';
    
    console.log(`Resetting password for user: ${username}`);
    
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
    
    console.log(`✅ Password reset successful for user: ${username}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
