import * as crypto from 'crypto';

/**
 * Hashes a password using PBKDF2 sync.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Compares a plain password against a stored hashed password.
 */
export function comparePassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, hash] = storedHash.split(':');
  const checkHash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  return hash === checkHash;
}

/**
 * Hashes a verification/setup token using SHA-256 for secure DB storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Hashes an OTP using SHA-256 for secure DB storage.
 */
export function hashOtp(otp: number | string): string {
  return crypto.createHash('sha256').update(otp.toString()).digest('hex');
}
