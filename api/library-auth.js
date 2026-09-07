import { clearSessionCookie, createSessionCookie, hasValidSession, verifyPassword } from '../server/libraryAuth.js';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET') {
    const configured = Boolean(process.env.LIBRARY_PASSWORD_HASH && process.env.LIBRARY_SESSION_SECRET && process.env.GITHUB_LIBRARY_TOKEN);
    return response.status(200).json({ authenticated: hasValidSession(request), configured });
  }
  if (request.method === 'DELETE') {
    response.setHeader('Set-Cookie', clearSessionCookie());
    return response.status(200).json({ ok: true });
  }
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  if (!verifyPassword(request.body?.password)) {
    await new Promise(resolve => setTimeout(resolve, 350));
    return response.status(401).json({ error: 'Incorrect access password.' });
  }
  response.setHeader('Set-Cookie', createSessionCookie());
  return response.status(200).json({ authenticated: true });
}
