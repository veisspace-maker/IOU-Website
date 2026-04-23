/**
 * Set a PIN for quick login
 */

import pool from '../config/database';
import bcrypt from 'bcrypt';

async function setPin() {
  try {
    const username = 'Leva';
    const pin = '1234';  // Simple 4-digit PIN
    
    console.log(`Setting PIN for user: ${username}`);
    
    // Hash the PIN
    const saltRounds = 10;
    const pinHash = await bcrypt.hash(pin, saltRounds);
    
    // Update the user
    const result = await pool.query(
      'UPDATE users SET pin_hash = $1 WHERE username = $2 RETURNING id, username',
      [pinHash, username]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      process.exit(1);
    }
    
    console.log(`✅ PIN set successfully!`);
    console.log(`   Username: ${username}`);
    console.log(`   PIN: ${pin}`);
    console.log(`\nYou can now use either:`);
    console.log(`   1. Password: IOUP@ss321!`);
    console.log(`   2. PIN: ${pin}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting PIN:', error);
    process.exit(1);
  }
}

setPin();
