const DEFAULT_REPOSITORY = 'Xiaobai1100/ebook-library';
const DEFAULT_REF = 'main';
const API_VERSION = '2022-11-28';

export class GitHubLibraryError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'GitHubLibraryError';
    this.status = status;
  }
}

function configuration() {
  const token = process.env.GITHUB_LIBRARY_TOKEN;
  const repository = process.env.GITHUB_LIBRARY_REPOSITORY || DEFAULT_REPOSITORY;
  const ref = process.env.GITHUB_LIBRARY_REF || DEFAULT_REF;
  if (!token) throw new GitHubLibraryError('GITHUB_LIBRARY_TOKEN is not configured.', 503);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new GitHubLibraryError('GITHUB_LIBRARY_REPOSITORY is invalid.', 503);
  }
  return { token, repository, ref };
}

function encodeRepoPath(relativePath) {
  return relativePath.split('/').map(encodeURIComponent).join('/');
}

function githubHeaders(token, accept = 'application/vnd.github.raw+json') {
  return {
    Accept: accept,
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': 'xiaobai-private-library'
  };
}

export function isSafeLibraryPath(relativePath) {
  if (!relativePath || relativePath.includes('\\') || relativePath.includes('\0')) return false;
  const parts = relativePath.split('/');
  return parts.every(part => part && part !== '.' && part !== '..');
}

export async function readRepositoryText(relativePath, { optional = false } = {}) {
  if (!isSafeLibraryPath(relativePath)) throw new GitHubLibraryError('Invalid repository path.', 400);
  const { token, repository, ref } = configuration();
  const url = `https://api.github.com/repos/${repository}/contents/${encodeRepoPath(relativePath)}?ref=${encodeURIComponent(ref)}`;
  const result = await fetch(url, { headers: githubHeaders(token), cache: 'no-store' });
  if (optional && result.status === 404) return null;
  if (!result.ok) {
    throw new GitHubLibraryError(`GitHub contents request failed (${result.status}).`, result.status === 404 ? 404 : 502);
  }
  return result.text();
}

export async function readLibraryCatalog() {
  const [catalogText, userDataText] = await Promise.all([
    readRepositoryText('library/catalog.json'),
    readRepositoryText('library/user-data.json', { optional: true })
  ]);
  const catalog = JSON.parse(catalogText);
  const userData = userDataText ? JSON.parse(userDataText) : {};
  const favorites = new Set(userData.favorites || []);
  const activeItems = (catalog.items || []).filter(item => !item.archived && isSafeLibraryPath(item.relativePath));
  return {
    schemaVersion: 2,
    generatedAt: catalog.generatedAt,
    publishedAt: catalog.generatedAt,
    storage: 'github-lfs',
    layout: userData.layout || { categoryOrder: [], density: 'comfortable' },
    stats: { ...catalog.stats, totalItems: activeItems.length },
    items: activeItems.map(item => ({
      ...item,
      personalNote: userData.notes?.[item.relativePath] || '',
      favorite: favorites.has(item.relativePath)
    }))
  };
}

function parseLfsPointer(text) {
  if (!text.startsWith('version https://git-lfs.github.com/spec/v1\n')) {
    throw new GitHubLibraryError('The requested file is not tracked by Git LFS.', 409);
  }
  const oid = /^oid sha256:([a-f0-9]{64})$/m.exec(text)?.[1];
  const size = Number(/^size (\d+)$/m.exec(text)?.[1]);
  if (!oid || !Number.isSafeInteger(size) || size < 0) {
    throw new GitHubLibraryError('The Git LFS pointer is invalid.', 502);
  }
  return { oid, size };
}

export async function getLfsDownload(relativePath) {
  const pointer = parseLfsPointer(await readRepositoryText(relativePath));
  const { token, repository, ref } = configuration();
  const owner = repository.split('/')[0];
  const authorization = Buffer.from(`${owner}:${token}`).toString('base64');
  const result = await fetch(`https://github.com/${repository}.git/info/lfs/objects/batch`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.git-lfs+json',
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/vnd.git-lfs+json',
      'User-Agent': 'xiaobai-private-library'
    },
    body: JSON.stringify({
      operation: 'download',
      transfers: ['basic'],
      ref: { name: `refs/heads/${ref}` },
      objects: [pointer]
    })
  });
  const payload = await result.json().catch(() => ({}));
  const object = payload.objects?.[0];
  if (!result.ok || object?.error) {
    const status = object?.error?.code === 404 ? 404 : 502;
    throw new GitHubLibraryError(object?.error?.message || `Git LFS request failed (${result.status}).`, status);
  }
  if (!object?.actions?.download?.href) throw new GitHubLibraryError('Git LFS did not return a download action.', 502);
  return { ...pointer, action: object.actions.download };
}

export function contentTypeForPath(relativePath) {
  const extension = relativePath.toLowerCase().split('.').pop();
  return {
    pdf: 'application/pdf',
    epub: 'application/epub+zip',
    mobi: 'application/x-mobipocket-ebook',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  }[extension] || 'application/octet-stream';
}
