import crypto from 'node:crypto';

const COOKIE_NAME = 'xb_library_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  const secret = process.env.LIBRARY_SESSION_SECRET;
  if (!secret) throw new Error('LIBRARY_SESSION_SECRET is not configured.');
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function verifyPassword(password) {
  const encoded = process.env.LIBRARY_PASSWORD_HASH || '';
  const [algorithm, iterationsText, saltText, expectedText] = encoded.split('$');
  if (algorithm !== 'pbkdf2-sha256' || !iterationsText || !saltText || !expectedText) return false;
  const iterations = Number(iterationsText);
  const salt = Buffer.from(saltText, 'base64url');
  const expected = Buffer.from(expectedText, 'base64url');
  const actual = crypto.pbkdf2Sync(String(password || ''), salt, iterations, expected.length, 'sha256');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createSessionCookie() {
  const payload = base64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS }));
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function hasValidSession(request) {
  try {
    const token = parseCookies(request.headers.cookie)[COOKIE_NAME];
    if (!token) return false;
    const [payload, signature] = token.split('.');
    const expected = sign(payload);
    const left = Buffer.from(signature || '');
    const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number(session.exp) > Date.now() / 1000;
  } catch {
    return false;
  }
}

export function requireLibrarySession(request, response) {
  if (hasValidSession(request)) return true;
  response.status(401).json({ error: 'Enter the private library first.' });
  return false;
}
