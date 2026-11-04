import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Unlock,
  Folder,
  BookOpen,
  FileText,
  Search,
  ArrowLeft,
  Download,
  Eye,
  Compass,
  Layers,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import LibraryPdfReader from '../components/LibraryPdfReader';
import './PrivateLibrary.css';

// 未解锁时的五维书架占位藏书（让书架在登录前就充满真实的书籍陈列感）
const PLACEHOLDER_VOLUMES = [
  { id: 'p1', title: 'GRAVITATION // MTW', folder: 'RELATIVITY', ext: 'PDF', size: 48200000 },
  { id: 'p2', title: ' TURBULENT FLOWS // POPE', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 32100000 },
  { id: 'p3', title: 'THE ROAD TO REALITY // PENROSE', folder: 'COSMOLOGY', ext: 'PDF', size: 54000000 },
  { id: 'p4', title: 'NONLINEAR DYNAMICS & CHAOS', folder: 'DYNAMICS', ext: 'PDF', size: 21500000 },
  { id: 'p5', title: 'FINITE ELEMENT METHOD // HUGHES', folder: 'NUMERICAL', ext: 'PDF', size: 39800000 },
  { id: 'p6', title: 'STATISTICAL MECHANICS // SETHNA', folder: 'STAT_PHYS', ext: 'PDF', size: 19400000 },
  { id: 'p7', title: 'TURBULENCE: THE LEGACY OF KOLMOGOROV', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 16800000 },
  { id: 'p8', title: 'BLACK HOLES & TIME WARPS // THORNE', folder: 'RELATIVITY', ext: 'PDF', size: 28900000 },
  { id: 'p9', title: 'DIFFERENTIAL GEOMETRY OF CURVES', folder: 'MATHEMATICS', ext: 'PDF', size: 24300000 },
  { id: 'p10', title: 'PARTIAL DIFFERENTIAL EQUATIONS // EVANS', folder: 'MATHEMATICS', ext: 'PDF', size: 31200000 },
  { id: 'p11', title: 'CLASSICAL MECHANICS // ARNOLD', folder: 'MECHANICS', ext: 'PDF', size: 22700000 },
  { id: 'p12', title: 'FLUID MECHANICS // LANDAU & LIFSHITZ', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 36500000 },
  { id: 'p13', title: 'REAL & COMPLEX ANALYSIS // RUDIN', folder: 'MATHEMATICS', ext: 'PDF', size: 18200000 },
  { id: 'p14', title: 'THE LARGE SCALE STRUCTURE OF SPACE-TIME', folder: 'RELATIVITY', ext: 'PDF', size: 27400000 },
  { id: 'p15', title: 'SPECTRAL METHODS IN MATLAB // TREFETHEN', folder: 'NUMERICAL', ext: 'PDF', size: 14100000 },
  { id: 'p16', title: 'GEOMETRICAL METHODS OF MATH PHYSICS', folder: 'PHYSICS', ext: 'PDF', size: 25600000 }
];

/**
 * 1. 五维超立方体背光书架环境层 (Tesseract Backlit Bookshelf Atrium)
 * 严格使用 source-over 清屏，绘制柔和的远景书架剪影、书缝透光与微尘，绝无刺眼亮块堆叠
 */
const TesseractBackdrop = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const onMouseMove = (e) => {
      mouse.tx = e.clientX;
      mouse.ty = e.clientY;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 生成远景五维书架层的静态书本剪影序列
    const bgShelves = Array.from({ length: 5 }, (_, rowIdx) => {
      const books = [];
      let cursor = 0;
      while (cursor < 100) {
        const w = 1.4 + ((rowIdx * 17 + cursor * 7) % 18) * 0.12;
        const h = 55 + ((rowIdx * 31 + Math.floor(cursor) * 13) % 35);
        const gap = ((rowIdx + Math.floor(cursor)) % 5 === 0) ? 0.6 : 0.18;
        books.push({ xPct: cursor, wPct: w, hPct: h, gap });
        cursor += w + gap;
      }
      return books;
    });

    // 漂浮在书房光束中的微尘
    const motes = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.22 + 0.05),
      alpha: Math.random() * 0.45 + 0.1
    }));

    let time = 0;

    const render = () => {
      time += 0.008;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // 1. 严格重置混合模式并清空画布（彻底杜绝轨迹残留！）
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#070503';
      ctx.fillRect(0, 0, width, height);

      const shiftX = (mouse.x - width * 0.5) * 0.035;
      const shiftY = (mouse.y - height * 0.5) * 0.025;

      // 2. 中央书架背后的暖琥珀色环境背光
      const glow = ctx.createRadialGradient(
        width * 0.5 + shiftX,
        height * 0.45 + shiftY,
        40,
        width * 0.5 + shiftX,
        height * 0.5,
        Math.max(width, height) * 0.7
      );
      glow.addColorStop(0, 'rgba(217, 119, 6, 0.16)');
      glow.addColorStop(0.45, 'rgba(146, 64, 14, 0.07)');
      glow.addColorStop(1, 'rgba(7, 5, 3, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 3. 绘制远景五维书架层与书缝透光
      const shelfCount = bgShelves.length;
      const rowHeight = height / shelfCount;

      bgShelves.forEach((books, rowIdx) => {
        const shelfBaseY = (rowIdx + 1) * rowHeight + shiftY * (rowIdx - 2) * 0.4;

        // 书架隔板背光光带
        const slotGrad = ctx.createLinearGradient(0, shelfBaseY - rowHeight * 0.8, 0, shelfBaseY);
        slotGrad.addColorStop(0, 'rgba(245, 158, 11, 0.01)');
        slotGrad.addColorStop(0.85, 'rgba(245, 158, 11, 0.06)');
        slotGrad.addColorStop(1, 'rgba(251, 191, 36, 0.12)');
        ctx.fillStyle = slotGrad;
        ctx.fillRect(0, shelfBaseY - rowHeight * 0.8, width, rowHeight * 0.8);

        // 远景书脊剪影（留出透光书缝）
        books.forEach((b) => {
          const bx = (b.xPct / 100) * width + shiftX * 0.5;
          const bw = (b.wPct / 100) * width;
          const bh = (b.hPct / 100) * (rowHeight * 0.78);
          ctx.fillStyle = 'rgba(10, 7, 4, 0.82)';
          ctx.fillRect(bx, shelfBaseY - bh, bw, bh);
        });

        // 远景书架横梁
        ctx.fillStyle = 'rgba(180, 83, 9, 0.18)';
        ctx.fillRect(0, shelfBaseY, width, 2);
      });

      // 4. 柔和的五维垂直引力光弦（仅作微弱空间参照，绝不刺眼）
      const stringCount = 18;
      for (let i = 1; i < stringCount; i++) {
        const sx = (width / stringCount) * i + shiftX * 0.3;
        const dist = Math.abs(mouse.x - sx);
        const pull = dist < 110 ? Math.sin(time * 5 + i) * ((110 - dist) / 110) * 6 : 0;
        const alpha = dist < 110 ? 0.16 : 0.045;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.moveTo(sx, 0);
        ctx.quadraticCurveTo(sx + pull, mouse.y, sx, height);
        ctx.stroke();
      }

      // 5. 书房光束中的微尘
      motes.forEach((m) => {
        m.x += m.vx;
        m.y += m.vy;
        if (m.y < 0) {
          m.y = height;
          m.x = Math.random() * width;
        }
        if (m.x < 0) m.x = width;
        if (m.x > width) m.x = 0;

        ctx.fillStyle = `rgba(253, 224, 71, ${m.alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="tesseract-canvas" />;
};

/**
 * 2. 深度递归数据解析器：兼容 /api/library-index 的各种嵌套结构
 */
function normalizeLibraryData(payload) {
  if (!payload) return { items: [], folders: [], notes: [] };

  const collected = [];
  const folderSet = new Set();

  const inspectList = (arr, parentFolder = '') => {
    if (!Array.isArray(arr)) return;
    arr.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      // 如果是目录/分类节点且内部含有子数组
      const subItems = entry.items || entry.files || entry.books || entry.children || entry.entries;
      if (Array.isArray(subItems)) {
        const folderName = entry.path || entry.name || entry.title || entry.folder || parentFolder;
        if (folderName) folderSet.add(folderName);
        inspectList(subItems, folderName);
        return;
      }
      collected.push({ ...entry, _inferredFolder: parentFolder });
    });
  };

  if (Array.isArray(payload)) inspectList(payload);
  inspectList(payload.items);
  inspectList(payload.books);
  inspectList(payload.files);
  inspectList(payload.entries);
  inspectList(payload.tree);
  inspectList(payload.folders);
  inspectList(payload.categories);

  if (payload.catalog && typeof payload.catalog === 'object') {
    if (Array.isArray(payload.catalog)) inspectList(payload.catalog);
    inspectList(payload.catalog.items);
    inspectList(payload.catalog.books);
    inspectList(payload.catalog.files);
    inspectList(payload.catalog.tree);
    inspectList(payload.catalog.folders);
  }

  const seen = new Set();
  const items = [];

  collected.forEach((raw, idx) => {
    const rawPath = raw.path || raw.relativePath || raw.filePath || raw.key || raw.id || raw.name || '';
    const dedupeKey = rawPath || `${raw.title}-${idx}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const parts = String(rawPath).split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] || raw.title || `Volume_${idx + 1}`;
    const inferredFolder =
      raw.folder ||
      raw.category ||
      raw.collection ||
      raw._inferredFolder ||
      (parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'CORE_COLLECTION');

    folderSet.add(inferredFolder);

    const ext = (raw.extension || raw.format || (fileName.includes('.') ? fileName.split('.').pop() : 'pdf'))
      .replace(/^\./, '')
      .toUpperCase();

    const encodedPath = encodeURIComponent(rawPath || fileName);
    const fileUrl =
      raw.fileUrl ||
      raw.streamUrl ||
      raw.url ||
      `/api/library-file?path=${encodedPath}`;
    const downloadUrl =
      raw.downloadUrl ||
      `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=1`;

    items.push({
      id: raw.id || rawPath || `item-${idx}`,
      title: (raw.title || fileName.replace(/\.[^/.]+$/, '')).replace(/_/g, ' '),
      rawName: fileName,
      path: rawPath,
      folder: inferredFolder,
      ext,
      size: raw.size || raw.sizeBytes || raw.fileSize || 0,
      updatedAt: raw.updatedAt || raw.mtime || raw.date || '',
      note: raw.note || raw.description || raw.summary || '',
      fileUrl,
      downloadUrl,
      isPdf: ext === 'PDF'
    });
  });

  if (Array.isArray(payload.folders)) {
    payload.folders.forEach((f) => {
      const name = typeof f === 'string' ? f : f?.path || f?.name;
      if (name) folderSet.add(name);
    });
  }

  return {
    items,
    folders: Array.from(folderSet),
    notes: Array.isArray(payload.notes) ? payload.notes : []
  };
}

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return 'LFS_VOLUME';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// 根据书名生成稳定的精装书配色与高宽尺寸
function getBookVisuals(book, idx) {
  const str = `${book.title || ''}-${idx}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const tones = ['mahogany', 'obsidian', 'navy', 'emerald', 'ochre', 'slate'];
  const tone = tones[hash % tones.length];
  const height = 212 + (hash % 36); // 212px ~ 248px 错落有致的真实书高
  const width = 42 + ((hash >> 3) % 18); // 42px ~ 59px 随厚度变化
  const callNum = `${String.fromCharCode(65 + (hash % 18))}${100 + (hash % 899)}`;
  return { tone, height, width, callNum };
}

export default function PrivateLibrary() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [catalog, setCatalog] = useState({ items: [], folders: [], notes: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');

  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [chamberTilt, setChamberTilt] = useState({ x: 0, y: 0 });
  const [manualAngle, setManualAngle] = useState(0);

  const fetchLibraryCatalog = async () => {
    setLoadingCatalog(true);
    setCatalogError('');
    try {
      const res = await fetch('/api/library-index', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      if (res.status === 401 || res.status === 403) {
        setAuthenticated(false);
        setCheckingAuth(false);
        setLoadingCatalog(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const normalized = normalizeLibraryData(data);
      setCatalog(normalized);
      setAuthenticated(true);
      if (normalized.items.length > 0) {
        setSelectedBook(normalized.items[0]);
      }
    } catch (err) {
      console.error('Library index fetch error:', err);
      setCatalogError('无法读取馆藏索引 (/api/library-index)，请检查环境变量或网络连接。');
    } finally {
      setCheckingAuth(false);
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchLibraryCatalog();
  }, []);

  // 鼠标移动时赋予 3D 书房自然的五维透视摆动
  const handleChamberMouseMove = (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setChamberTilt({ x: nx * 3.5, y: -ny * 2.2 });
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/library-auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', password, passcode: password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || '密钥校验未通过，请确认引力密码是否正确');
      }

      setPassword('');
      await fetchLibraryCatalog();
    } catch (err) {
      setAuthError(err.message);
      setCheckingAuth(false);
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/library-auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' })
      });
    } catch (e) {
      console.error(e);
    }
    setAuthenticated(false);
    setSelectedBook(null);
    setReadingBook(null);
  };

  // 未解锁时展示 3D 加密占位书架，解锁后展示真实馆藏
  const activeSourceBooks = authenticated ? catalog.items : PLACEHOLDER_VOLUMES;

  const filteredBooks = useMemo(() => {
    return activeSourceBooks.filter((item) => {
      const matchFolder =
        selectedFolder === 'ALL' ||
        item.folder === selectedFolder ||
        item.folder.startsWith(selectedFolder);
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.folder.toLowerCase().includes(q) ||
        item.ext.toLowerCase().includes(q);
      return matchFolder && matchQuery;
    });
  }, [activeSourceBooks, selectedFolder, searchQuery]);

  // 将书籍分配到多层实木/黄铜五维书架上（每层最多 12 本，保证书架饱满真实）
  const shelfRows = useMemo(() => {
    const perShelf = 12;
    const rows = [];
    for (let i = 0; i < filteredBooks.length; i += perShelf) {
      rows.push(filteredBooks.slice(i, i + perShelf));
    }
    // 至少保证有 2 层书架结构以维持宏伟的书房空间感
    while (rows.length < 2 && filteredBooks.length > 0) {
      rows.push([]);
    }
    return rows;
  }, [filteredBooks]);

  if (readingBook) {
    return (
      <div className="tesseract-root">
        <TesseractBackdrop />
        <LibraryPdfReader item={readingBook} onClose={() => setReadingBook(null)} />
      </div>
    );
  }

  const totalRotateY = chamberTilt.x + manualAngle;
  const totalRotateX = chamberTilt.y;

  return (
    <div className="tesseract-root" onMouseMove={handleChamberMouseMove}>
      <TesseractBackdrop />

      {/* 顶部五维书房导航栏 */}
      <header className="tesseract-header">
        <div className="flex items-center gap-4">
          <Link className="tesseract-back-btn" to="/">
            <ArrowLeft size={15} />
            <span>EXIT_LIBRARY</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-amber-300/80 text-xs font-mono tracking-[0.28em] uppercase">
            <Compass className="text-amber-400" size={14} />
            <span>MURPH_BOOKSHELF // 5D_TESSERACT_STUDY</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-amber-200/70 bg-black/50 border border-amber-500/25 px-3 py-1.5">
            <Layers className="text-amber-400" size={12} />
            <span>5D_ANGLE</span>
            <input
              type="range"
              min="-15"
              max="15"
              step="1"
              value={manualAngle}
              onChange={(e) => setManualAngle(Number(e.target.value))}
              className="w-20 accent-amber-400 cursor-pointer"
            />
          </div>

          {authenticated && (
            <button onClick={handleLock} className="tesseract-lock-btn" title="Lock Library">
              <Unlock size={13} />
              <span>LOCK_STUDY</span>
            </button>
          )}
        </div>
      </header>

      {/* 主体空间：无论是否解锁，底层都真实渲染 3D 五维书架 */}
      <div className={`tesseract-workspace ${!authenticated ? 'is-locked-preview' : ''}`}>
        {/* 左侧：分类目录与检索栏 */}
        <aside className="tesseract-sidebar">
          <div className="tesseract-search-box">
            <Search className="text-amber-400/60" size={14} />
            <input
              type="text"
              disabled={!authenticated}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH_BOOKSHELF..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="tesseract-section-label">
            <span>BOOKCASE_SECTIONS</span>
            <span>{activeSourceBooks.length} VOLS</span>
          </div>

          <nav className="tesseract-folder-list">
            <button
              onClick={() => setSelectedFolder('ALL')}
              className={`tesseract-folder-item ${selectedFolder === 'ALL' ? 'active' : ''}`}
            >
              <BookOpen size={14} />
              <span className="truncate flex-1 text-left">ALL_SHELVES</span>
              <span className="count">{activeSourceBooks.length}</span>
            </button>

            {catalog.folders.map((folder) => {
              const count = catalog.items.filter(
                (i) => i.folder === folder || i.folder.startsWith(folder)
              ).length;
              return (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`tesseract-folder-item ${selectedFolder === folder ? 'active' : ''}`}
                >
                  <Folder size={14} />
                  <span className="truncate flex-1 text-left">{folder}</span>
                  <span className="count">{count}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 中央核心：星际穿越 3D 五维立体书柜与四周镜像书墙 */}
        <main className="tesseract-chamber">
          {authenticated && loadingCatalog ? (
            <div className="tesseract-empty-state">
              <div className="tesseract-spinner" />
              <p>ILLUMINATING 5D BOOKSHELF...</p>
            </div>
          ) : authenticated && catalogError ? (
            <div className="tesseract-empty-state">
              <p className="text-amber-300 max-w-md text-center">{catalogError}</p>
              <button onClick={fetchLibraryCatalog} className="tesseract-action-btn mt-4">
                RETRY_SYNC
              </button>
            </div>
          ) : (
            <div
              className="tesseract-3d-room"
              style={{
                transform: `perspective(1500px) rotateX(${totalRotateX}deg) rotateY(${totalRotateY}deg)`
              }}
            >
              {/* 左侧五维镜像书墙 (Left 5D Wing) */}
              <div className="tesseract-wing-wall left-wing" aria-hidden="true">
                <div className="wing-shelf-grid" />
              </div>

              {/* 右侧五维镜像书墙 (Right 5D Wing) */}
              <div className="tesseract-wing-wall right-wing" aria-hidden="true">
                <div className="wing-shelf-grid" />
              </div>

              {/* 正中央：多层实木与黄铜背光主书柜 */}
              <div className="tesseract-bookcase-frame">
                {/* 书柜顶部冠冕檐板与坐标铭牌 */}
                <div className="bookcase-cornice">
                  <span>TESSERACT_BOOKCASE // GRAVITATIONAL_MEMORY_UNIT</span>
                  <span>{authenticated ? 'STATUS: UNLOCKED' : 'STATUS: ENCRYPTED_SILHOUETTE'}</span>
                </div>

                {shelfRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="tesseract-shelf-bay">
                    {/* 书架内壁：垂直书缝透光格栅 */}
                    <div className="shelf-back-slits" />
                    {/* 书架顶部暖金洗墙射灯 */}
                    <div className="shelf-top-downlight" />

                    {/* 成排竖立的 3D 精装实体书 */}
                    <div className="shelf-books-row">
                      {row.map((book, idx) => {
                        const isSelected = selectedBook?.id === book.id;
                        const { tone, height, width, callNum } = getBookVisuals(book, idx);

                        return (
                          <div
                            key={book.id}
                            onClick={() => authenticated && setSelectedBook(book)}
                            onDoubleClick={() => authenticated && book.isPdf && setReadingBook(book)}
                            style={{
                              height: `${height}px`,
                              width: `${width}px`
                            }}
                            className={`book-3d-volume spine-tone-${tone} ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            title={authenticated ? `${book.title} (双击直接打开阅读)` : book.title}
                          >
                            {/* 顶部 3D 书页切口 (可见真实纸张边缘) */}
                            <div className="book-top-pages" />

                            {/* 右侧 3D 书页与封底厚度层 */}
                            <div className="book-right-pages" />

                            {/* 正面精装书脊 */}
                            <div className="book-spine-face">
                              <div className="spine-gold-rib" />
                              <div className="spine-gold-rib thin" />

                              <div className="spine-title-container">
                                <span className="spine-vertical-title">{book.title}</span>
                              </div>

                              <div className="spine-gold-rib thin" />
                              <span className="spine-call-number">{callNum}</span>
                              <span className="spine-format-tag">{book.ext}</span>
                              <div className="spine-gold-rib" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 3D 立体承重书架横隔板 */}
                    <div className="shelf-3d-plank">
                      <div className="plank-top-surface" />
                      <div className="plank-front-edge">
                        <span>SHELF_TIER // 0{rowIndex + 1}</span>
                        <span className="plank-brass-strip" />
                        <span>{row.length} VOLUMES</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 右侧：选中书籍的 3D 立体封皮检视台 */}
        {authenticated && selectedBook && (
          <aside className="tesseract-inspector">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-5">
              <span className="text-[10px] font-mono tracking-[0.3em] text-amber-400 uppercase">
                VOLUME_INSPECTOR
              </span>
              <button
                onClick={() => setSelectedBook(null)}
                className="text-white/40 hover:text-white md:hidden"
              >
                <X size={15} />
              </button>
            </div>

            <div className="inspector-3d-showcase">
              <div className="showcase-hardcover">
                <div className="hardcover-spine-hinge" />
                <div className="text-[9px] font-mono tracking-[0.22em] text-amber-300/75 uppercase">
                  {selectedBook.folder}
                </div>
                <div className="font-bold text-sm text-amber-50 leading-snug line-clamp-4 my-auto">
                  {selectedBook.title}
                </div>
                <div className="flex justify-between items-center text-[9px] font-mono text-amber-400/80 border-t border-amber-500/25 pt-2">
                  <span>{selectedBook.ext} EDITION</span>
                  <span>{formatBytes(selectedBook.size)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono mb-6">
              <div className="inspector-meta-row">
                <span className="label">FILE_NAME</span>
                <span className="value text-white">{selectedBook.rawName}</span>
              </div>
              <div className="inspector-meta-row">
                <span className="label">SHELF_SECTOR</span>
                <span className="value text-amber-300">{selectedBook.folder}</span>
              </div>
              <div className="inspector-meta-row">
                <span className="label">MASS / SIZE</span>
                <span className="value">{formatBytes(selectedBook.size)}</span>
              </div>
            </div>

            {selectedBook.note && (
              <div className="inspector-note-box">
                <div className="text-[10px] text-amber-400/80 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <FileText size={12} />
                  <span>MARGINALIA_NOTES</span>
                </div>
                <p className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap">
                  {selectedBook.note}
                </p>
              </div>
            )}

            <div className="mt-auto pt-6 space-y-3">
              {selectedBook.isPdf && (
                <button
                  onClick={() => setReadingBook(selectedBook)}
                  className="tesseract-primary-btn w-full"
                >
                  <Eye size={15} />
                  <span>OPEN_VOLUME</span>
                  <ChevronRight className="ml-auto" size={14} />
                </button>
              )}

              <a href={selectedBook.downloadUrl} className="tesseract-secondary-btn w-full">
                <Download size={14} />
                <span>DOWNLOAD ({selectedBook.ext})</span>
              </a>
            </div>
          </aside>
        )}
      </div>

      {/* 未解锁时：悬浮在 3D 书架正前方的五维玻璃解锁舱 */}
      {!authenticated && (
        <div className="tesseract-auth-overlay">
          <form onSubmit={handleUnlock} className="tesseract-auth-box">
            <div className="tesseract-auth-corner tl" />
            <div className="tesseract-auth-corner tr" />
            <div className="tesseract-auth-corner bl" />
            <div className="tesseract-auth-corner br" />

            <div className="flex items-center gap-3 text-amber-400 text-xs tracking-[0.35em] uppercase mb-3">
              <Lock size={15} />
              <span>5D_BOOKSHELF_LOCKED</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase mb-2">
              MURPH&apos;S BOOKSHELF
            </h1>
            <p className="text-xs text-amber-100/60 font-mono leading-relaxed mb-6">
              Behind you lies the 5D bookshelf across time. Enter your gravitational key to illuminate and access the full private collection.
            </p>

            <div className="relative mb-5">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER_GRAVITY_KEY..."
                autoFocus
                className="tesseract-input"
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/50" size={15} />
            </div>

            {authError && (
              <div className="mb-5 p-3 border border-red-500/40 bg-red-950/60 text-red-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <button type="submit" disabled={checkingAuth} className="tesseract-submit-btn">
              {checkingAuth ? 'ILLUMINATING_SHELVES...' : 'UNLOCK_BOOKSHELF'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}