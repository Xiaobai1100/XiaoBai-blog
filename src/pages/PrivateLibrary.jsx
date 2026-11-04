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

/**
 * 1. 五维超立方体 (Tesseract) 正交光弦与引力波引擎
 */
const TesseractCanvas = ({ activeIndex }) => {
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

    // 引力尘埃粒子
    const dust = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 2 + 0.5,
      size: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.35 + 0.1),
      alpha: Math.random() * 0.65 + 0.15
    }));

    let time = 0;

    const render = () => {
      time += 0.012;
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      ctx.fillStyle = '#030201';
      ctx.fillRect(0, 0, width, height);

      // 计算五维透视灭点 (随鼠标轻微偏移)
      const vx = width * 0.5 + (mouse.x - width * 0.5) * 0.18;
      const vy = height * 0.48 + (mouse.y - height * 0.5) * 0.18;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // A. 绘制正交径向深空走廊 (Tesseract Time Corridors)
      const ringCount = 8;
      for (let i = 1; i <= ringCount; i++) {
        const depth = ((i / ringCount + (time * 0.08) % (1 / ringCount)));
        const scale = Math.pow(depth, 2.1);
        const rw = width * 1.35 * scale;
        const rh = height * 1.35 * scale;
        const rx = vx - rw / 2;
        const ry = vy - rh / 2;

        const alpha = Math.sin(depth * Math.PI) * 0.16;
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, rw, rh);
      }

      // B. 绘制贯穿五维空间的垂直引力光弦 (Vertical Worldlines)
      const vLines = 28;
      for (let i = 0; i <= vLines; i++) {
        const baseX = (width / vLines) * i;
        const distFromMouse = Math.abs(mouse.x - baseX);
        // 鼠标靠近时产生类似库珀拨动光弦的引力波弯曲
        const wave =
          distFromMouse < 160
            ? Math.sin(time * 8 + i) * ((160 - distFromMouse) / 160) * 18
            : 0;

        const grad = ctx.createLinearGradient(baseX, 0, baseX, height);
        const highlight = distFromMouse < 120 ? 0.32 : 0.08;
        grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        grad.addColorStop(0.25, `rgba(251, 191, 36, ${highlight * 0.6})`);
        grad.addColorStop(0.5, `rgba(254, 243, 199, ${highlight})`);
        grad.addColorStop(0.75, `rgba(217, 119, 6, ${highlight * 0.6})`);
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = distFromMouse < 90 ? 1.6 : 0.7;
        ctx.moveTo(baseX, 0);
        ctx.quadraticCurveTo(baseX + wave, mouse.y, baseX, height);
        ctx.stroke();
      }

      // C. 绘制水平书架层叠光束 (Horizontal Shelf Beams)
      const hLines = 12;
      for (let j = 1; j < hLines; j++) {
        const y = (height / hLines) * j;
        const distY = Math.abs(mouse.y - y);
        const alpha = distY < 100 ? 0.18 : 0.04;
        ctx.strokeStyle = `rgba(217, 119, 6, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // D. 渲染从灭点发散的对角四维轴线
      const corners = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
        [width * 0.25, 0],
        [width * 0.75, 0],
        [width * 0.25, height],
        [width * 0.75, height]
      ];
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.11)';
      ctx.lineWidth = 0.9;
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      });

      // E. 漂浮的金色引力尘埃
      dust.forEach((p) => {
        p.y += p.vy * p.z;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(253, 224, 71, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
  }, [activeIndex]);

  return <canvas ref={canvasRef} className="tesseract-canvas" />;
};

/**
 * 2. 万能数据归一化解析器：兼容后端返回的任何目录结构
 */
function normalizeLibraryData(payload) {
  if (!payload) return { items: [], folders: [], notes: [] };

  // 自动寻找可能存放书籍列表的数组字段
  const rawList =
    (Array.isArray(payload) && payload) ||
    payload.items ||
    payload.books ||
    payload.files ||
    payload.entries ||
    payload.catalog?.items ||
    payload.catalog?.books ||
    payload.catalog?.files ||
    (Array.isArray(payload.catalog) && payload.catalog) ||
    (Array.isArray(payload.data) && payload.data) ||
    [];

  const items = [];
  const folderSet = new Set();

  // 如果存在递归树结构，也一并展平提取
  const walkTree = (nodes, parentFolder = '') => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (!node) return;
      if (node.type === 'directory' || node.type === 'folder' || Array.isArray(node.children)) {
        const nextFolder = node.path || node.name || parentFolder;
        if (nextFolder) folderSet.add(nextFolder);
        walkTree(node.children || node.items, nextFolder);
      } else {
        rawList.push({ ...node, folder: node.folder || parentFolder });
      }
    });
  };

  if (Array.isArray(payload.tree)) walkTree(payload.tree);

  rawList.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const rawPath = raw.path || raw.relativePath || raw.filePath || raw.key || raw.name || '';
    const parts = String(rawPath).split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] || raw.title || `Volume_${idx + 1}`;
    const inferredFolder =
      raw.folder ||
      raw.category ||
      raw.collection ||
      (parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'GENERAL_ARCHIVE');

    folderSet.add(inferredFolder);

    const ext = (raw.extension || raw.format || fileName.split('.').pop() || 'pdf')
      .replace(/^\./, '')
      .toUpperCase();

    // 自动构建文件流与下载 URL
    const encodedPath = encodeURIComponent(rawPath || raw.id || fileName);
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

  // 合并后端显式返回的 folders
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
  if (!bytes || Number.isNaN(Number(bytes))) return 'LFS_STREAM';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
  const [tiltAngle, setTiltAngle] = useState(0);

  // 1. 初始化检查会话状态并拉取书库目录
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
      if (normalized.items.length > 0 && !selectedBook) {
        setSelectedBook(normalized.items[0]);
      }
    } catch (err) {
      console.error('Library index fetch error:', err);
      setCatalogError('无法连接至五维书库索引接口 (/api/library-index)，请确认本地已使用 vercel dev 启动或云端环境变量已配置。');
    } finally {
      setCheckingAuth(false);
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchLibraryCatalog();
  }, []);

  // 2. 解锁认证逻辑 (兼容 action: 'unlock' 与常规密码提交)
  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/library-auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock', password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'ACCESS_DENIED: 密钥引力频段不匹配');
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

  // 3. 过滤当前分区的书籍，并按五维书架层数分组
  const filteredBooks = useMemo(() => {
    return catalog.items.filter((item) => {
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
  }, [catalog.items, selectedFolder, searchQuery]);

  // 将书籍分配到多层立体五维书架上 (每层最多 14 本竖立书脊)
  const shelfRows = useMemo(() => {
    const perRow = 14;
    const rows = [];
    for (let i = 0; i < filteredBooks.length; i += perRow) {
      rows.push(filteredBooks.slice(i, i + perRow));
    }
    return rows;
  }, [filteredBooks]);

  // 如果正在在线阅读 PDF，直接全屏挂载阅读器
  if (readingBook) {
    return (
      <div className="tesseract-root">
        <TesseractCanvas activeIndex="{0}"/>
        <LibraryPdfReader item="{readingBook}" onClose="{()"> setReadingBook(null)} />
      </div>
    );
  }

  return (
    <div className="tesseract-root">
      {/* 五维超立方体背景引擎 */}
      <TesseractCanvas activeIndex="{filteredBooks.length}"/>

      {/* 顶部五维空间导航仪 */}
      <header className="tesseract-header">
        <div className="flex items-center gap-4">
          <Link className="tesseract-back-btn" to="/">
            <ArrowLeft size="{15}"/>
            <span>EXIT_TESSERACT</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-amber-400/80 text-xs font-mono tracking-[0.3em] uppercase">
            <Compass '12s' animationDuration: className="animate-spin" size="{14}" style="{{" }}/>
            <span>5D_GRAVITATIONAL_ARCHIVE // COOPER_STATION</span>
          </div>
        </div>

        {authenticated && (
          <div className="flex items-center gap-4">
            {/* 空间视角倾角调节 */}
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-amber-200/60 bg-black/50 border border-amber-500/20 px-3 py-1.5">
              <Layers className="text-amber-400" size="{12}"/>
              <span>PARALLAX</span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={tiltAngle}
                onChange={(e) => setTiltAngle(Number(e.target.value))}
                className="w-20 accent-amber-400 cursor-pointer"
              />
            </div>

            <button onClick={handleLock} className="tesseract-lock-btn" title="Lock Tesseract">
              <Unlock size="{13}"/>
              <span>SEAL_HORIZON</span>
            </button>
          </div>
        )}
      </header>

      {/* 未解锁状态：五维引力密钥舱 */}
      {!authenticated ? (
        <main className="tesseract-auth-stage">
          <form onSubmit={handleUnlock} className="tesseract-auth-box">
            <div className="tesseract-auth-corner tl" />
            <div className="tesseract-auth-corner tr" />
            <div className="tesseract-auth-corner bl" />
            <div className="tesseract-auth-corner br" />

            <div className="flex items-center gap-3 text-amber-400 text-xs tracking-[0.4em] uppercase mb-3">
              <Lock size="{15}"/>
              <span>QUANTUM_KEY_REQUIRED</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase mb-2">
              THE TESSERACT
            </h1>
            <p className="text-xs text-amber-100/50 font-mono leading-relaxed mb-8">
              Time is represented here as a physical dimension. Enter the gravitational morse key to synchronize with the private bookshelf.
            </p>

            <div className="relative mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER_GRAVITY_CIPHER..."
                autoFocus
                className="tesseract-input"
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/50" size="{15}"/>
            </div>

            {authError && (
              <div className="mb-6 p-3 border border-red-500/40 bg-red-950/40 text-red-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={checkingAuth}
              className="tesseract-submit-btn"
            >
              {checkingAuth ? 'SYNCHRONIZING_DIMENSION...' : 'TRANSMIT_COORDINATES'}
            </button>
          </form>
        </main>
      ) : (
        /* 已解锁状态：星际穿越五维立体书架 */
        <div className="tesseract-workspace">
          {/* 左侧：时空象限（文件夹分类）与检索 */}
          <aside className="tesseract-sidebar">
            <div className="tesseract-search-box">
              <Search className="text-amber-400/60" size="{14}"/>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH_WORLDLINE..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                  <X size="{13}"/>
                </button>
              )}
            </div>

            <div className="tesseract-section-label">
              <span>SPACETIME_SECTORS</span>
              <span>{catalog.items.length} VOLS</span>
            </div>

            <nav className="tesseract-folder-list">
              <button
                onClick={() => setSelectedFolder('ALL')}
                className={`tesseract-folder-item ${selectedFolder === 'ALL' ? 'active' : ''}`}
              >
                <Folder size="{14}"/>
                <span className="truncate flex-1 text-left">ALL_TIMELINES</span>
                <span className="count">{catalog.items.length}</span>
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
                    <Folder size="{14}"/>
                    <span className="truncate flex-1 text-left">{folder}</span>
                    <span className="count">{count}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* 中央核心：五维超立方体立体书架走廊 */}
          <main className="tesseract-chamber">
            {loadingCatalog ? (
              <div className="tesseract-empty-state">
                <div className="tesseract-spinner" />
                <p>CONSTRUCTING 5D BOOKSHELF MATRIX...</p>
              </div>
            ) : catalogError ? (
              <div className="tesseract-empty-state">
                <p className="text-amber-300 max-w-md text-center">{catalogError}</p>
                <button onClick={fetchLibraryCatalog} className="tesseract-action-btn mt-4">
                  RETRY_SYNC
                </button>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="tesseract-empty-state">
                <p>NO VOLUMES DETECTED IN THIS TIMELINE SECTOR.</p>
                {selectedFolder !== 'ALL' && (
                  <button
                    onClick={() => setSelectedFolder('ALL')}
                    className="tesseract-action-btn mt-4"
                  >
                    RESET_TO_ALL_TIMELINES
                  </button>
                )}
              </div>
            ) : (
              <div
                className="tesseract-shelves-viewport"
                style={{
                  transform: `perspective(1600px) rotateY(${tiltAngle}deg)`
                }}
              >
                {shelfRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="tesseract-shelf-bay">
                    {/* 书架背后的五维水平引力光束 */}
                    <div className="shelf-back-beam" />

                    {/* 竖立的 3D 书脊阵列 */}
                    <div className="shelf-spines-row">
                      {row.map((book, idx) => {
                        const isSelected = selectedBook?.id === book.id;
                        // 根据标题长度和文件大小生成富有节奏感的真实书脊高度与厚度
                        const hash = book.title
                          .split('')
                          .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
                        const spineHeight = 225 + (hash % 42);
                        const spineWidth = 44 + (hash % 18);
                        const hueShift = idx % 3 === 0 ? 'amber' : idx % 3 === 1 ? 'gold' : 'cyan';

                        return (
                          <div
                            key={book.id}
                            onClick={() => setSelectedBook(book)}
                            onDoubleClick={() => book.isPdf && setReadingBook(book)}
                            style={{
                              height: `${spineHeight}px`,
                              width: `${spineWidth}px`
                            }}
                            className={`tesseract-book-spine tone-${hueShift} ${
                              isSelected ? 'is-selected' : ''
                            }`}
                            title={`${book.title} (Double-click to open)`}
                          >
                            {/* 书脊顶部与底部金属箍线 */}
                            <div className="spine-band top" />
                            <div className="spine-cord" />

                            {/* 竖排书名 */}
                            <div className="spine-title-wrap">
                              <span className="spine-title">{book.title}</span>
                            </div>

                            {/* 底部格式烙印 */}
                            <span className="spine-ext">{book.ext}</span>
                            <div className="spine-band bottom" />

                            {/* 3D 书页侧面厚度层 */}
                            <div className="spine-side-wall" />
                          </div>
                        );
                      })}
                    </div>

                    {/* 书架底部发光超立方体横梁 */}
                    <div className="shelf-plank">
                      <div className="shelf-plank-top" />
                      <div className="shelf-plank-front">
                        <span>TESSERACT_BAY // 0{rowIndex + 1}</span>
                        <span>GRAVITY_LOCK: STABLE</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* 右侧：五维观测台详情与阅读器入口 */}
          {selectedBook && (
            <aside className="tesseract-inspector">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-5">
                <span className="text-[10px] font-mono tracking-[0.3em] text-amber-400 uppercase">
                  VOLUME_TELEMETRY
                </span>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-white/40 hover:text-white md:hidden"
                >
                  <X size="{15}"/>
                </button>
              </div>

              {/* 3D 悬浮书封预览模型 */}
              <div className="inspector-3d-book">
                <div className="inspector-book-cover">
                  <div className="text-[9px] font-mono tracking-[0.25em] text-amber-300/70 uppercase">
                    {selectedBook.folder}
                  </div>
                  <div className="font-bold text-sm text-white leading-snug line-clamp-4 my-auto">
                    {selectedBook.title}
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono text-amber-400/80 border-t border-amber-500/20 pt-2">
                    <span>{selectedBook.ext}</span>
                    <span>{formatBytes(selectedBook.size)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs font-mono mb-6">
                <div className="inspector-meta-row">
                  <span className="label">DESIGNATION</span>
                  <span className="value text-white">{selectedBook.rawName}</span>
                </div>
                <div className="inspector-meta-row">
                  <span className="label">SECTOR</span>
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
                    <FileText size="{12}"/>
                    <span>FIELD_NOTES</span>
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
                    <Eye size="{15}"/>
                    <span>ENGAGE_READER</span>
                    <ChevronRight className="ml-auto" size="{14}"/>
                  </button>
                )}

                <a
                  href={selectedBook.downloadUrl}
                  className="tesseract-secondary-btn w-full"
                >
                  <Download size="{14}"/>
                  <span>EXTRACT_VOLUME ({selectedBook.ext})</span>
                </a>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}