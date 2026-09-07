import path from 'node:path';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { put } from '@vercel/blob';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceArgIndex = process.argv.indexOf('--source');
const sourceRoot = path.resolve(sourceArgIndex >= 0 ? process.argv[sourceArgIndex + 1] : process.env.EBOOK_LIBRARY_ROOT || 'D:\\E-Book & Resource');

async function readJson(file, fallback) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function loadLocalEnvironment() {
  try {
    const text = await readFile(path.join(projectRoot, '.env.local'), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

await loadLocalEnvironment();
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) throw new Error('缺少 BLOB_READ_WRITE_TOKEN。请先把 Vercel Private Blob 令牌写入 Blog 的 .env.local。');

const libraryDir = path.join(sourceRoot, 'library');
const catalog = await readJson(path.join(libraryDir, 'catalog.json'), null);
if (!catalog?.items) throw new Error(`没有找到目录：${path.join(libraryDir, 'catalog.json')}`);
const userData = await readJson(path.join(libraryDir, 'user-data.json'), {});
const manifestPath = path.join(libraryDir, 'publish-manifest.json');
const previous = await readJson(manifestPath, { files: {} });
const next = { schemaVersion: 1, publishedAt: new Date().toISOString(), complete: false, files: {} };
const activeItems = catalog.items.filter(item => !item.archived);
let uploaded = 0;
let skipped = 0;
let publishError = null;
await mkdir(libraryDir, { recursive: true });

for (const [index, item] of activeItems.entries()) {
  const absolute = path.resolve(sourceRoot, ...item.relativePath.split('/'));
  if (!absolute.startsWith(sourceRoot + path.sep)) throw new Error(`文件路径离开资料库：${item.relativePath}`);
  const fileStat = await stat(absolute);
  const extension = path.extname(absolute).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const remotePath = `library/files/${item.id}${extension}`;
  const fingerprint = `${fileStat.size}:${Math.trunc(fileStat.mtimeMs)}`;
  const manifestEntry = { fingerprint, remotePath, relativePath: item.relativePath };
  if (previous.files?.[item.id]?.fingerprint === fingerprint && previous.files[item.id]?.remotePath === remotePath) {
    next.files[item.id] = manifestEntry;
    skipped += 1;
    console.log(`[${index + 1}/${activeItems.length}] unchanged  ${item.title}`);
    await writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
    continue;
  }
  console.log(`[${index + 1}/${activeItems.length}] uploading  ${item.title}`);
  try {
    await put(remotePath, createReadStream(absolute), {
      access: 'private', addRandomSuffix: false, allowOverwrite: true, multipart: true,
      contentType: item.mimeType || undefined, token
    });
  } catch (error) {
    publishError = error;
    console.error(`上传在 ${item.title} 处停止：${error.message}`);
    break;
  }
  next.files[item.id] = manifestEntry;
  uploaded += 1;
  await writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
}

const favorites = new Set(userData.favorites || []);
const publishedItems = activeItems.filter(item => next.files[item.id]);
const remoteCatalog = {
  schemaVersion: 1,
  generatedAt: catalog.generatedAt,
  publishedAt: next.publishedAt,
  stats: {
    totalItems: publishedItems.length,
    sourceItems: activeItems.length,
    unavailableItems: activeItems.length - publishedItems.length
  },
  items: publishedItems.map(item => ({
    id: item.id,
    title: item.title,
    authors: item.authors || [],
    year: item.year || null,
    venue: item.venue || '',
    summary: item.summary || '',
    tags: item.tags || [],
    category: item.category,
    subcategory: item.subcategory || '',
    kind: item.kind,
    sizeBytes: item.sizeBytes,
    modified: item.modified,
    remotePath: next.files[item.id].remotePath,
    personalNote: userData.notes?.[item.relativePath] || '',
    favorite: favorites.has(item.relativePath)
  }))
};

await put('library/catalog.json', Buffer.from(JSON.stringify(remoteCatalog)), {
  access: 'private', addRandomSuffix: false, allowOverwrite: true,
  contentType: 'application/json; charset=utf-8', token
});
next.complete = !publishError && publishedItems.length === activeItems.length;
await writeFile(manifestPath, JSON.stringify(next, null, 2) + '\n', 'utf8');
if (next.complete) {
  console.log(`发布完成：上传 ${uploaded}，跳过 ${skipped}，共 ${activeItems.length} 项。`);
} else {
  console.warn(`部分发布完成：远程可用 ${publishedItems.length}/${activeItems.length} 项；上传 ${uploaded}，跳过 ${skipped}。`);
  process.exitCode = 2;
}
