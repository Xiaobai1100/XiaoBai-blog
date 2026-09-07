import { get } from '@vercel/blob';
import { requireLibrarySession } from '../server/libraryAuth.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  if (!requireLibrarySession(request, response)) return;
  try {
    const result = await get('library/catalog.json', { access: 'private', useCache: false });
    if (!result?.stream) return response.status(404).json({ error: '远程馆藏尚未发布。' });
    const text = await new Response(result.stream).text();
    response.setHeader('Cache-Control', 'private, no-store');
    return response.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error(error);
    return response.status(503).json({ error: '暂时无法读取私人馆藏。' });
  }
}
