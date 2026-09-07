import { requireLibrarySession } from '../server/libraryAuth.js';
import { GitHubLibraryError, readLibraryCatalog } from '../server/githubLibrary.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  if (!requireLibrarySession(request, response)) return;
  try {
    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).json(await readLibraryCatalog());
  } catch (error) {
    console.error(error);
    const status = error instanceof GitHubLibraryError ? error.status : 503;
    return response.status(status).json({ error: status === 404 ? 'The remote catalog has not been published.' : 'The private catalog is temporarily unavailable.' });
  }
}
