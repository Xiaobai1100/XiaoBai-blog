import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run library:secrets -- "your password"');
  process.exit(1);
}
const iterations = 210000;
const salt = crypto.randomBytes(18);
const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
console.log(`LIBRARY_PASSWORD_HASH=pbkdf2-sha256$${iterations}$${salt.toString('base64url')}$${hash.toString('base64url')}`);
console.log(`LIBRARY_SESSION_SECRET=${crypto.randomBytes(36).toString('base64url')}`);
