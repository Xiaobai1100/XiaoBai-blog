import { Readable } from 'node:stream';
import { get } from '@vercel/blob';
import { requireLibrarySession } from '../server/libraryAuth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  if (!requireLibrarySession(request, response)) return;
  const pathname = String(request.query?.pathname || '');
  if (!/^library\/files\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(pathname)) {
    return response.status(400).json({ error: '无效的馆藏文件路径。' });
  }
  try {
    const result = await get(pathname, {
      access: 'private',
      headers: request.headers.range ? { Range: request.headers.range } : undefined
    });
    if (!result?.stream) return response.status(404).json({ error: '文件不存在。' });
    const headers = result.headers;
    response.status(headers.get('content-range') ? 206 : 200);
    response.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
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
    if (!response.headersSent) response.status(503).json({ error: '文件读取失败。' });
    else response.end();
  }
}
