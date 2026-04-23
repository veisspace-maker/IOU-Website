/**
 * Disable 2FA for Leva to allow simple password login
 */

import pool from '../config/database';

async function disableTwoFactor() {
  try {
    const username = 'Leva';
    
    console.log(`Checking 2FA status for user: ${username}`);
    
    // Check current status
    const checkResult = await pool.query(
      'SELECT username, two_factor_enabled FROM users WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      process.exit(1);
    }
    
    const user = checkResult.rows[0];
    console.log(`Current 2FA status: ${user.two_factor_enabled ? 'ENABLED' : 'DISABLED'}`);
    
    // Disable 2FA
    const result = await pool.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE username = $1 RETURNING username',
      [username]
    );
    
    console.log(`✅ 2FA disabled for ${username}`);
    console.log(`\nYou can now login with just username and password:`);
    console.log(`   Username: Leva`);
    console.log(`   Password: IOUP@ss321!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error disabling 2FA:', error);
    process.exit(1);
  }
}

disableTwoFactor();
