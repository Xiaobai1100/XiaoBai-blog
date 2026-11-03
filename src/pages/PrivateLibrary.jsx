import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Folder,
  Layers,
  LockKeyhole,
  LogOut,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  Unlock,
  X
} from 'lucide-react';
import LibraryPdfReader from '../components/LibraryPdfReader';
import './PrivateLibrary.css';

const TYPE_META = {
  pdf: { label: 'PDF', icon: BookOpen, tone: 'amber' },
  epub: { label: 'EPUB', icon: BookOpen, tone: 'cyan' },
  word: { label: 'WORD', icon: FileText, tone: 'blue' },
  ppt: { label: 'SLIDES', icon: Presentation, tone: 'orange' },
  excel: { label: 'SHEET', icon: FileSpreadsheet, tone: 'emerald' },
  note: { label: 'NOTE', icon: FileText, tone: 'violet' },
  document: { label: 'FILE', icon: FileText, tone: 'slate' }
};

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return 'TIMELESS';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TIMELESS';
  return date.toISOString().slice(0, 10);
}

function parentFolder(path = '') {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return parts.join('/');
}

function spineThickness(bytes = 0) {
  if (!bytes) return 54;
  const mb = bytes / (1024 * 1024);
  return Math.max(48, Math.min(92, Math.round(48 + Math.log1p(mb) * 12)));
}

/**
 * 🌌 五维超立方体背景引擎 (5D Tesseract Gravitational Strings Canvas)
 * 模拟《星际穿越》中库珀在书架后方看到的无限延伸金色光束与重力尘埃
 */
const TesseractCanvas = ({ mousePos }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 生成漂浮的五维时空重力光尘
    const dust = Array.from({ length: 75 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 2 + 0.5,
      vy: -(Math.random() * 0.35 + 0.1),
      size: Math.random() * 1.8 + 0.5,
      alpha: Math.random() * 0.55 + 0.15
    }));

    let time = 0;
    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, w, h);

      const mx = (mousePos.current?.x ?? 0.5) * w;
      const my = (mousePos.current?.y ?? 0.5) * h;

      // 1. 绘制纵横交错的五维超立方体金色时间弦 (Tesseract Time-Strings)
      const vLines = 22;
      for (let i = 0; i <= vLines; i++) {
        const baseX = (i / vLines) * w;
        const distToMouse = Math.abs(baseX - mx);
        // 鼠标靠近时产生引力拨动弯曲效果
        const pull = Math.max(0, 1 - distToMouse / 260);
        const offsetX = Math.sin(time * 2 + i) * 4 + (baseX > mx ? 1 : -1) * pull * 18;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        const alpha = 0.04 + pull * 0.16;
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.25, `rgba(245, 158, 11, ${alpha})`);
        grad.addColorStop(0.5, `rgba(56, 189, 248, ${alpha * 0.8})`);
        grad.addColorStop(0.75, `rgba(245, 158, 11, ${alpha})`);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = pull > 0.3 ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(baseX, 0);
        ctx.quadraticCurveTo(baseX + offsetX, my, baseX, h);
        ctx.stroke();
      }

      // 2. 绘制横向空间切片网格线
      const hLines = 12;
      for (let j = 1; j < hLines; j++) {
        const baseY = (j / hLines) * h;
        const distY = Math.abs(baseY - my);
        const pullY = Math.max(0, 1 - distY / 220);
        ctx.strokeStyle = `rgba(251, 191, 36, ${0.025 + pullY * 0.08})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(w, baseY);
        ctx.stroke();
      }

      // 3. 绘制重力波光尘 (Morse Code Dust)
      dust.forEach((p) => {
        p.y += p.vy * p.z;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const dx = p.x - mx;
        const dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        const glow = d < 180 ? (1 - d / 180) * 0.5 : 0;

        ctx.fillStyle = `rgba(253, 224, 71, ${Math.min(1, p.alpha + glow)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.z, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  return <canvas ref={canvasRef} className="tesseract-canvas" />;
};

export default function PrivateLibrary() {
  const [authState, setAuthState] = useState('checking');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [catalog, setCatalog] = useState({ items: [], folders: [], stats: null, generatedAt: null });
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [activeFolder, setActiveFolder] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [readingItem, setReadingItem] = useState(null);
  const [noteState, setNoteState] = useState({ status: 'idle', content: '' });

  // 5D 视角倾斜度控制 (允许轻微改变超立方体透视感，同时保证文字绝对清晰)
  const [dimensionTilt, setDimensionTilt] = useState(true);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  const handleMouseMove = (e) => {
    mousePos.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight
    };
  };

  async function loadCatalog() {
    setLoadingCatalog(true);
    setCatalogError('');
    try {
      const response = await fetch('/api/library-index', { credentials: 'include' });
      if (response.status === 401) {
        setAuthState('locked');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load catalog');
      setCatalog(data);
      setAuthState('unlocked');
    } catch (error) {
      setCatalogError(error.message || 'Could not load catalog');
      setAuthState('unlocked');
    } finally {
      setLoadingCatalog(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/library-auth', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.authenticated) loadCatalog();
        else setAuthState('locked');
      })
      .catch(() => {
        if (!cancelled) setAuthState('locked');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedItem || !selectedItem.isTextNote) {
      setNoteState({ status: 'idle', content: '' });
      return undefined;
    }
    let cancelled = false;
    setNoteState({ status: 'loading', content: '' });
    fetch(selectedItem.fileUrl, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Note content is not uploaded yet.');
        return response.text();
      })
      .then((content) => {
        if (!cancelled) setNoteState({ status: 'ready', content });
      })
      .catch((error) => {
        if (!cancelled) setNoteState({ status: 'error', content: error.message });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  async function handleUnlock(event) {
    event.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/library-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'unlock', password })
      });
      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || 'Gravitational Resonance Mismatch // Invalid Key');
        return;
      }
      setPassword('');
      await loadCatalog();
    } catch {
      setAuthError('Could not reach the 5D authentication bulkhead.');
    }
  }

  async function handleLock() {
    await fetch('/api/library-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'lock' })
    }).catch(() => {});
    setCatalog({ items: [], folders: [], stats: null, generatedAt: null });
    setSelectedItem(null);
    setReadingItem(null);
    setAuthState('locked');
  }

  const normalizedQuery = search.trim().toLowerCase();

  const topCategories = useMemo(
    () => (catalog.folders || []).filter((folder) => folder.depth === 1),
    [catalog.folders]
  );

  const childFolders = useMemo(() => {
    if (normalizedQuery) return [];
    const parentDepth = activeFolder ? activeFolder.split('/').length : 0;
    return (catalog.folders || []).filter((folder) => {
      if (folder.depth !== parentDepth + 1) return false;
      return activeFolder ? folder.path.startsWith(`${activeFolder}/`) : true;
    });
  }, [activeFolder, catalog.folders, normalizedQuery]);

  const visibleItems = useMemo(() => {
    const items = catalog.items || [];
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (normalizedQuery) {
        const haystack = `${item.title} ${item.relativePath} ${item.ext}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      }
      return item.folder === activeFolder;
    });
  }, [activeFolder, catalog.items, normalizedQuery, typeFilter]);

  const breadcrumbs = useMemo(() => {
    if (!activeFolder) return [];
    const parts = activeFolder.split('/').filter(Boolean);
    return parts.map((name, index) => ({
      name,
      path: parts.slice(0, index + 1).join('/')
    }));
  }, [activeFolder]);

  return (
    <div className="tesseract-library" onMouseMove={handleMouseMove}>
      {/* 1. 星际穿越五维超立方体背景引擎 */}
      <TesseractCanvas mousePos={mousePos} />
      <div className="tesseract-vignette" />

      {/* 2. 顶部深空终端状态栏 */}
      <header className="tesseract-topbar">
        <Link to="/" className="tesseract-nav-btn">
          <ArrowLeft size={15} />
          <span>EXIT_TESSERACT</span>
        </Link>

        <div className="tesseract-brand">
          <Compass size={15} className="text-amber-400 animate-spin-slow" />
          <span>COOPER_STATION // 5D_ARCHIVE_BULKHEAD</span>
        </div>

        <div className="tesseract-actions">
          {authState === 'unlocked' && (
            <>
              <button
                type="button"
                className={`tesseract-icon-btn ${dimensionTilt ? 'is-active' : ''}`}
                onClick={() => setDimensionTilt(!dimensionTilt)}
                title="Toggle 5D Perspective Depth"
              >
                <Layers size={15} />
                <span className="hidden md:inline">5D_DEPTH</span>
              </button>
              <button
                type="button"
                className="tesseract-icon-btn"
                onClick={loadCatalog}
                title="Resynchronize Timeline"
              >
                <RefreshCw size={15} className={loadingCatalog ? 'spin' : ''} />
              </button>
              <button
                type="button"
                className="tesseract-icon-btn danger"
                onClick={handleLock}
                title="Collapse Bulkhead (Lock)"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">SEAL</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* 3. 验证中状态 */}
      {authState === 'checking' && (
        <main className="tesseract-gate">
          <div className="tesseract-gate-panel">
            <div className="gate-scanner" />
            <p className="gate-kicker">CALIBRATING GRAVITATIONAL ANOMALY</p>
            <h1>Aligning 5D Coordinates…</h1>
          </div>
        </main>
      )}

      {/* 4. 锁屏密码验证舱 (墨菲怀表引力摩斯密码主题) */}
      {authState === 'locked' && (
        <main className="tesseract-gate">
          <form className="tesseract-gate-panel" onSubmit={handleUnlock}>
            <div className="gate-scanner" />
            <div className="gate-badge">
              <LockKeyhole size={20} />
              <span>QUANTUM_ENCRYPTED_BULKHEAD</span>
            </div>

            <h1>
              THE INFINITE <span>BOOKSHELF</span>
            </h1>
            <p className="gate-desc">
              Time is represented here as a physical dimension. Transmit the gravitational passphrase across the horizon to unlock your private study.
            </p>

            <label className="gate-input-wrap">
              <span className="gate-input-label">GRAVITATIONAL_KEY // MORSE_SEQUENCE</span>
              <div className="gate-input-box">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER_PASSCODE..."
                  autoFocus
                  autoComplete="current-password"
                />
                <Sparkles size={16} className="gate-sparkle" />
              </div>
            </label>

            {authError && <div className="gate-error">{authError}</div>}

            <button type="submit" className="gate-submit">
              <Unlock size={16} />
              <span>OPEN_THE_TESSERACT</span>
            </button>
          </form>
        </main>
      )}

      {/* 5. 解锁后：星际穿越五维书架主界面 */}
      {authState === 'unlocked' && (
        <main className="tesseract-workspace">
          {/* 顶部维度与坐标抬头 */}
          <section className="tesseract-hero">
            <div className="hero-left">
              <div className="hero-kicker">
                <span className="pulse-dot" />
                <span>DIMENSION_05 // GRAVITY_LINK_ESTABLISHED</span>
              </div>
              <h1>TESSERACT ARCHIVE</h1>
              <p>
                Every spine on this shelf is a world-line in your private research repository. Click a volume to inspect its timeline or stream the document directly.
              </p>
            </div>

            <div className="hero-telemetry">
              <div className="telemetry-box">
                <span>VOLUMES</span>
                <strong>{catalog.stats?.totalItems ?? catalog.items?.length ?? 0}</strong>
              </div>
              <div className="telemetry-box">
                <span>SECTORS</span>
                <strong>{catalog.stats?.totalFolders ?? catalog.folders?.length ?? 0}</strong>
              </div>
              <div className="telemetry-box">
                <span>MASS</span>
                <strong>{formatBytes(catalog.stats?.totalBytes || 0)}</strong>
              </div>
              <div className="telemetry-box">
                <span>EPOCH</span>
                <strong>{formatDate(catalog.generatedAt)}</strong>
              </div>
            </div>
          </section>

          {/* 搜索与多维切片过滤控制台 */}
          <section className="tesseract-controls">
            <label className="tesseract-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Query world-lines by title, path, or extension..."
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>

            <div className="tesseract-filters" role="tablist">
              {[
                ['all', 'ALL_DIMENSIONS'],
                ['pdf', 'PDF'],
                ['epub', 'EPUB'],
                ['word', 'WORD'],
                ['ppt', 'SLIDES'],
                ['note', 'NOTES']
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={typeFilter === key ? 'is-active' : ''}
                  onClick={() => setTypeFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* 顶层时空象限切换条 (Top Categories) */}
          <nav className="tesseract-sectors" aria-label="Primary library sectors">
            <button
              type="button"
              className={!activeFolder ? 'is-active' : ''}
              onClick={() => setActiveFolder('')}
            >
              ORIGIN_CORE
            </button>
            {topCategories.map((folder) => (
              <button
                key={folder.path}
                type="button"
                className={
                  activeFolder === folder.path || activeFolder.startsWith(`${folder.path}/`)
                    ? 'is-active'
                    : ''
                }
                onClick={() => setActiveFolder(folder.path)}
              >
                <span>{folder.name}</span>
                <small>{folder.totalCount}</small>
              </button>
            ))}
          </nav>

          {/* 路径面包屑导航 */}
          <div className="tesseract-breadcrumbs">
            <button type="button" onClick={() => setActiveFolder('')}>
              TESSERACT_ROOT
            </button>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.path}>
                <i>/</i>
                <button type="button" onClick={() => setActiveFolder(crumb.path)}>
                  {crumb.name}
                </button>
              </span>
            ))}
            {activeFolder && (
              <button
                type="button"
                className="crumb-up"
                onClick={() => setActiveFolder(parentFolder(activeFolder))}
              >
                ↑ ASCEND_DIMENSION
              </button>
            )}
          </div>

          {catalogError && <div className="tesseract-alert">{catalogError}</div>}

          {/* 核心主体：五维空间书架矩阵 + 右侧虫洞检视抽屉 */}
          <div className="tesseract-stage-grid">
            <section className={`tesseract-alcove ${dimensionTilt ? 'has-tilt' : ''}`}>
              {/* 顶部与底部的五维光栅装饰梁 */}
              <div className="alcove-beam top" />

              {/* 子象限文件夹舱门 (Sub-Sectors) */}
              {childFolders.length > 0 && (
                <div className="sector-bay">
                  <div className="bay-header">
                    <span>PARALLEL_TIME_CHAMBERS ({childFolders.length})</span>
                    <div className="bay-line" />
                  </div>
                  <div className="sector-cards">
                    {childFolders.map((folder) => (
                      <button
                        key={folder.path}
                        type="button"
                        className="sector-card"
                        onClick={() => setActiveFolder(folder.path)}
                      >
                        <div className="sector-card-glow" />
                        <Folder size={18} className="text-amber-400 shrink-0" />
                        <div className="sector-card-info">
                          <strong>{folder.name}</strong>
                          <span>
                            {folder.totalCount} files · {formatBytes(folder.totalBytes)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 📚 五维空间竖立书脊阵列 (3D Book Spines Shelf) */}
              <div className="bookshelf-chamber">
                <div className="bay-header">
                  <span>
                    {normalizedQuery
                      ? `SEARCH_RESONANCE (${visibleItems.length})`
                      : `PHYSICAL_SPINES_IN_SECTOR (${visibleItems.length})`}
                  </span>
                  <div className="bay-line" />
                </div>

                {visibleItems.length > 0 ? (
                  <div className="tesseract-shelf-rows">
                    {visibleItems.map((item, idx) => {
                      const meta = TYPE_META[item.type] || TYPE_META.document;
                      const Icon = meta.icon;
                      const isSelected = selectedItem?.id === item.id;
                      const widthPx = spineThickness(item.size);
                      const maxSize = catalog.stats?.maxItemBytes || 50 * 1024 * 1024;
                      const massRatio = Math.max(
                        0.12,
                        Math.min(1, Math.log1p(item.size || 1) / Math.log1p(maxSize))
                      );

                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          style={{ '--spine-w': `${widthPx}px`, '--mass': `${Math.round(massRatio * 100)}%` }}
                          className={`tesseract-spine tone-${meta.tone} ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setSelectedItem(item)}
                          onDoubleClick={() => {
                            if (item.type === 'pdf') setReadingItem(item);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedItem(item);
                            }
                          }}
                        >
                          {/* 书脊顶部摩斯光刻编号 */}
                          <div className="spine-head">
                            <span className="spine-index">#{String(idx + 1).padStart(2, '0')}</span>
                            <Icon size={13} />
                          </div>

                          {/* 竖排书名主干 */}
                          <div className="spine-body">
                            <span className="spine-title">{item.title}</span>
                          </div>

                          {/* 书脊底部质量刻度与格式烙印 */}
                          <div className="spine-foot">
                            <div className="spine-mass-bar">
                              <i />
                            </div>
                            <span className="spine-ext">{meta.label}</span>
                            <small className="spine-size">{formatBytes(item.size)}</small>
                          </div>

                          {/* 悬浮抽出时的侧面书页光效 */}
                          <div className="spine-pages-edge" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !loadingCatalog &&
                  childFolders.length === 0 && (
                    <div className="tesseract-empty">
                      <Compass size={28} className="text-amber-400/50 mb-2" />
                      <p>// NO GRAVITATIONAL WORLD-LINES DETECTED IN THIS COORDINATE.</p>
                    </div>
                  )
                )}
              </div>

              <div className="alcove-beam bottom" />
            </section>

            {/* 右侧：五维文献检视与量子传输面板 (Inspector Drawer) */}
            <aside className={`tesseract-inspector ${selectedItem ? 'is-open' : ''}`}>
              {selectedItem ? (
                <div className="inspector-content">
                  <div className="inspector-header">
                    <span className="inspector-badge">
                      {(TYPE_META[selectedItem.type] || TYPE_META.document).label} // TELEMETRY
                    </span>
                    <button
                      type="button"
                      className="inspector-close"
                      onClick={() => setSelectedItem(null)}
                      aria-label="Close inspector"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <h2 className="inspector-title">{selectedItem.title}</h2>
                  <p className="inspector-path">{selectedItem.relativePath}</p>

                  <dl className="inspector-metrics">
                    <div>
                      <dt>MASS</dt>
                      <dd>{formatBytes(selectedItem.size)}</dd>
                    </div>
                    <div>
                      <dt>TIMESTAMP</dt>
                      <dd>{formatDate(selectedItem.mtime)}</dd>
                    </div>
                    <div>
                      <dt>FORMAT</dt>
                      <dd>{selectedItem.ext?.toUpperCase() || 'FILE'}</dd>
                    </div>
                  </dl>

                  {selectedItem.isTextNote ? (
                    <div className="inspector-note">
                      {noteState.status === 'loading' && <p>Decoding Morse transmission…</p>}
                      {noteState.status === 'error' && <p>{noteState.content}</p>}
                      {noteState.status === 'ready' && <pre>{noteState.content}</pre>}
                    </div>
                  ) : (
                    <div className="inspector-actions">
                      {selectedItem.type === 'pdf' && (
                        <button
                          type="button"
                          className="inspector-btn primary"
                          onClick={() => setReadingItem(selectedItem)}
                        >
                          <BookOpen size={16} />
                          <span>ENGAGE_READER</span>
                        </button>
                      )}
                      {selectedItem.canInlinePreview && selectedItem.type !== 'pdf' && (
                        <a
                          className="inspector-btn primary"
                          href={selectedItem.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} />
                          <span>OPEN_STREAM</span>
                        </a>
                      )}
                      <a className="inspector-btn" href={selectedItem.downloadUrl}>
                        <Download size={16} />
                        <span>DOWNLOAD_ORIGINAL</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="inspector-placeholder">
                  <Layers size={28} className="text-amber-400/40" />
                  <h3>TESSERACT_TRANSCEIVER</h3>
                  <p>
                    Select any physical book spine from the 5D shelf to inspect its spacetime metadata, read embedded notes, or stream the PDF across the horizon.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </main>
      )}

      {/* 6. 内嵌全屏 PDF 阅读器模态框 */}
      {readingItem && (
        <LibraryPdfReader item={readingItem} onClose={() => setReadingItem(null)} />
      )}
    </div>
  );
}