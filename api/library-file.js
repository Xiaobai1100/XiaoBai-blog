import { Readable } from 'node:stream';
import { requireLibrarySession } from '../server/libraryAuth.js';
import { contentTypeForPath, getLfsDownload, GitHubLibraryError, isSafeLibraryPath } from '../server/githubLibrary.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  if (!requireLibrarySession(request, response)) return;
  const pathname = String(request.query?.pathname || '');
  if (!isSafeLibraryPath(pathname) || !/\.(pdf|epub|mobi|azw3?|djvu|chm|cb[rz]|docx?|xlsx?|pptx?|jpe?g|png|webp)$/i.test(pathname)) {
    return response.status(400).json({ error: 'Invalid library file path.' });
  }
  try {
    const { action } = await getLfsDownload(pathname);
    const upstreamHeaders = {
      ...(action.header || {}),
      ...(request.headers.range ? { Range: request.headers.range } : {})
    };
    const result = await fetch(action.href, {
      headers: upstreamHeaders,
      redirect: 'follow'
    });
    if (!result.ok || !result.body) throw new GitHubLibraryError(`Git LFS download failed (${result.status}).`, result.status === 404 ? 404 : 502);
    const headers = result.headers;
    response.status(result.status);
    response.setHeader('Content-Type', contentTypeForPath(pathname));
    response.setHeader('Accept-Ranges', headers.get('accept-ranges') || 'bytes');
    for (const name of ['content-range', 'content-length', 'etag', 'last-modified']) {
      const value = headers.get(name);
      if (value) response.setHeader(name, value);
    }
    const filename = String(request.query?.filename || 'document').replace(/[\r\n"\\]/g, '_');
    const disposition = request.query?.download === '1' ? 'attachment' : 'inline';
    response.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`);
    response.setHeader('Cache-Control', 'private, no-store');
    Readable.fromWeb(result.stream).pipe(response);
  } catch (error) {
    console.error(error);
    const status = error instanceof GitHubLibraryError ? error.status : 503;
    if (!response.headersSent) response.status(status).json({ error: status === 404 ? 'File not found.' : 'Unable to read the file.' });
    else response.end();
  }
}
