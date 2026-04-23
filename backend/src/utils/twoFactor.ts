import speakeasy from 'speakeasy';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Generates a new 2FA secret for a user
 */
export function generateTwoFactorSecret(username: string): TwoFactorSecret {
  const secret = speakeasy.generateSecret({
    name: `IOU (${username})`,
    issuer: 'IOU',
    length: 32,
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url || '',
  };
}

/**
 * Verifies a 2FA token against a secret
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Generates a backup code for 2FA recovery
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  
  return codes;
}
