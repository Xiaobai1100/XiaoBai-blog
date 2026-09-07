import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, LockKeyhole, LogOut, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PrivateLibrary.css';

const RECENTS_KEY = 'xiaobai-library:remote-recents:v1';
const VIEW_KEY = 'xiaobai-library:remote-view:v1';
const ORDER_KEY = 'xiaobai-library:remote-category-order:v1';

const formatBytes = bytes => {
  const value = Number(bytes) || 0;
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(value > 100 * 1024 ** 2 ? 0 : 1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
};

const hueFor = text => [...String(text)].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 260 + 45;
const readStorage = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};

async function api(endpoint, options) {
  const response = await fetch(endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function fileUrl(item, download = false) {
  const base = `/api/library-file?pathname=${encodeURIComponent(item.relativePath)}&filename=${encodeURIComponent(item.title + item.extension)}`;
  return download ? `${base}&download=1` : base;
}

function coverUrl(item) {
  return item.coverPath ? `/api/library-file?pathname=${encodeURIComponent(item.coverPath)}&filename=cover.jpg` : '';
}

export default function PrivateLibrary() {
  const [auth, setAuth] = useState('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('all');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('title');
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'grid');
  const [recents, setRecents] = useState(() => readStorage(RECENTS_KEY, []));
  const [categoryOrder, setCategoryOrder] = useState(() => readStorage(ORDER_KEY, []));
  const [reader, setReader] = useState(null);
  const [detail, setDetail] = useState(null);
  const categoryListRef = useRef(null);
  const categoryDragEndedAtRef = useRef(0);

  useEffect(() => {
    document.body.classList.add('private-library-active');
    return () => document.body.classList.remove('private-library-active');
  }, []);

  const loadCatalog = async () => {
    setError('');
    try {
      const nextCatalog = await api('/api/library-catalog');
      setCatalog(nextCatalog);
      setCategoryOrder(current => current.length ? current : (nextCatalog.layout?.categoryOrder || []));
    }
    catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => {
    api('/api/library-auth').then(result => {
      setAuth(result.authenticated ? 'ready' : result.configured ? 'locked' : 'setup');
      if (result.authenticated) loadCatalog();
    }).catch(() => setAuth('locked'));
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        event.preventDefault();
        document.querySelector('#remoteLibrarySearch')?.focus();
      }
      if (event.key === 'Escape') {
        if (reader) setReader(null);
        else if (detail) setDetail(null);
        else if (query) setQuery('');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [detail, query, reader]);

  const items = useMemo(() => catalog?.items || [], [catalog?.items]);
  const categories = useMemo(() => {
    const names = [...new Set(items.map(item => item.category))];
    return names.sort((a, b) => {
      const left = categoryOrder.indexOf(a);
      const right = categoryOrder.indexOf(b);
      if (left >= 0 || right >= 0) return (left < 0 ? 9999 : left) - (right < 0 ? 9999 : right);
      return a.localeCompare(b, 'en', { numeric: true });
    });
  }, [categoryOrder, items]);

  const kinds = useMemo(() => [...new Set(items.map(item => item.kind))].sort(), [items]);
  const latestDate = useMemo(() => items.reduce((latest, item) => item.modified > latest ? item.modified : latest, ''), [items]);
  const newThreshold = useMemo(() => {
    const date = latestDate ? new Date(`${latestDate}T00:00:00`) : new Date(0);
    date.setDate(date.getDate() - 30);
    return date;
  }, [latestDate]);

  const visible = useMemo(() => {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return items.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (kind !== 'all' && item.kind !== kind) return false;
      if (mode === 'favorites' && !item.favorite) return false;
      if (mode === 'recent' && !recents.includes(item.relativePath)) return false;
      if (mode === 'new' && new Date(`${item.modified}T00:00:00`) < newThreshold) return false;
      const text = [item.title, item.relativePath, item.category, item.summary, item.personalNote, ...(item.authors || []), ...(item.tags || [])].join(' ').toLocaleLowerCase();
      return terms.every(term => text.includes(term));
    }).sort((left, right) => {
      if (sort === 'modified') return right.modified.localeCompare(left.modified) || left.title.localeCompare(right.title);
      if (sort === 'size') return right.sizeBytes - left.sizeBytes || left.title.localeCompare(right.title);
      if (sort === 'year') return Number(right.year || 0) - Number(left.year || 0) || left.title.localeCompare(right.title);
      if (sort === 'opened') {
        const leftIndex = recents.indexOf(left.relativePath);
        const rightIndex = recents.indexOf(right.relativePath);
        return (leftIndex < 0 ? 9999 : leftIndex) - (rightIndex < 0 ? 9999 : rightIndex);
      }
      return left.title.localeCompare(right.title, 'en', { numeric: true });
    });
  }, [category, items, kind, mode, newThreshold, query, recents, sort]);

  const context = {
    all: ['YOUR COLLECTION', category === 'all' ? 'All Items' : category, category === 'all' ? 'The complete collection, organized by subject.' : `Browsing the ${category} collection.`],
    favorites: ['SAVED FOR LATER', 'Favorites', 'Essential and frequently used material within immediate reach.'],
    recent: ['READING TRAIL', 'Recently Opened', 'Continue along your recent reading trail.'],
    new: ['NEW & UPDATED', 'Recently Updated', 'Items updated within 30 days of the newest file in the collection.']
  }[mode];

  const recordOpen = item => {
    const next = [item.relativePath, ...recents.filter(path => path !== item.relativePath)].slice(0, 40);
    setRecents(next);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  };

  const openReader = item => {
    recordOpen(item);
    setReader({ ...item, fileUrl: fileUrl(item) });
  };

  const chooseMode = nextMode => {
    setMode(nextMode);
    setCategory('all');
  };

  const chooseView = nextView => {
    setView(nextView);
    localStorage.setItem(VIEW_KEY, nextView);
  };

  const beginCategoryDrag = event => {
    if (event.button !== 0) return;
    const button = event.currentTarget;
    const container = categoryListRef.current;
    const start = { x: event.clientX, y: event.clientY };
    let session = null;
    let frame = null;
    let lastMove = { x: event.clientX, y: event.clientY, at: performance.now() };
    button.classList.add('is-pressing');

    const animateFollower = () => {
      if (!session) return;
      session.x += (session.targetX - session.x) * 0.34;
      session.y += (session.targetY - session.y) * 0.34;
      session.clone.style.transform = `translate3d(${session.x - session.origin.left}px, ${session.y - session.origin.top}px, 0) scale(1.035) rotate(${Math.max(-1.2, Math.min(1.2, session.velocityX * 0.18))}deg)`;
      frame = requestAnimationFrame(animateFollower);
    };

    const shiftIntoPlace = (clientX, clientY) => {
      const horizontal = matchMedia('(max-width: 800px)').matches;
      const nodes = [...container.querySelectorAll('.nav-item[data-category]')];
      const before = new Map(nodes.map(node => [node, node.getBoundingClientRect()]));
      const siblings = nodes.filter(node => node !== button);
      const pointer = horizontal ? clientX : clientY;
      const target = siblings.find(node => {
        const rect = node.getBoundingClientRect();
        return pointer < (horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2);
      });
      if (target) container.insertBefore(button, target);
      else container.appendChild(button);
      for (const node of siblings) {
        const previous = before.get(node);
        const next = node.getBoundingClientRect();
        const dx = previous.left - next.left;
        const dy = previous.top - next.top;
        if (!dx && !dy) continue;
        node.getAnimations().forEach(animation => animation.cancel());
        node.animate([{ transform: `translate3d(${dx}px, ${dy}px, 0)` }, { transform: 'translate3d(0, 0, 0)' }], { duration: 330, easing: 'cubic-bezier(.16,.84,.24,1)' });
      }
    };

    const activate = () => {
      const origin = button.getBoundingClientRect();
      const clone = button.cloneNode(true);
      clone.classList.remove('is-pressing', 'is-placeholder');
      clone.classList.add('category-floater');
      Object.assign(clone.style, { left: `${origin.left}px`, top: `${origin.top}px`, width: `${origin.width}px`, height: `${origin.height}px` });
      document.body.appendChild(clone);
      button.classList.remove('is-pressing');
      button.classList.add('is-placeholder');
      document.body.classList.add('is-sorting-categories');
      session = { clone, origin, x: origin.left, y: origin.top, targetX: origin.left, targetY: origin.top, velocityX: 0, velocityY: 0, offsetX: start.x - origin.left, offsetY: start.y - origin.top };
      animateFollower();
    };

    const pressTimer = setTimeout(activate, 500);
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onRelease);
      window.removeEventListener('pointercancel', onRelease);
    };
    const onMove = moveEvent => {
      if (!session) {
        if (Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) > 8) {
          clearTimeout(pressTimer);
          button.classList.remove('is-pressing');
        }
        return;
      }
      moveEvent.preventDefault();
      const now = performance.now();
      const elapsed = Math.max(8, now - lastMove.at);
      session.velocityX = (moveEvent.clientX - lastMove.x) / elapsed;
      session.velocityY = (moveEvent.clientY - lastMove.y) / elapsed;
      lastMove = { x: moveEvent.clientX, y: moveEvent.clientY, at: now };
      session.targetX = moveEvent.clientX - session.offsetX;
      session.targetY = moveEvent.clientY - session.offsetY;
      shiftIntoPlace(moveEvent.clientX, moveEvent.clientY);
    };
    const onRelease = releaseEvent => {
      clearTimeout(pressTimer);
      button.classList.remove('is-pressing');
      cleanup();
      if (!session) return;
      releaseEvent.preventDefault();
      categoryDragEndedAtRef.current = performance.now();
      cancelAnimationFrame(frame);
      const destination = button.getBoundingClientRect();
      const speed = Math.hypot(session.velocityX, session.velocityY);
      const duration = Math.max(230, Math.min(430, 260 + speed * 55));
      session.clone.style.left = `${session.x}px`;
      session.clone.style.top = `${session.y}px`;
      session.clone.style.transform = 'none';
      const settle = session.clone.animate([
        { left: `${session.x}px`, top: `${session.y}px`, transform: 'scale(1.035)' },
        { left: `${session.x + session.velocityX * 42}px`, top: `${session.y + session.velocityY * 42}px`, transform: 'scale(1.025)', offset: .32 },
        { left: `${destination.left}px`, top: `${destination.top}px`, transform: 'scale(1)' }
      ], { duration, easing: 'cubic-bezier(.18,.86,.22,1)', fill: 'forwards' });
      settle.finished.finally(() => {
        session.clone.remove();
        button.classList.remove('is-placeholder');
        document.body.classList.remove('is-sorting-categories');
      });
      const nextOrder = [...container.querySelectorAll('.nav-item[data-category]')].map(node => node.dataset.category);
      setCategoryOrder(nextOrder);
      localStorage.setItem(ORDER_KEY, JSON.stringify(nextOrder));
    };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onRelease, { once: true });
    window.addEventListener('pointercancel', onRelease, { once: true });
  };

  const login = async event => {
    event.preventDefault();
    setError('');
    try {
      await api('/api/library-auth', { method: 'POST', body: JSON.stringify({ password }) });
      setPassword('');
      setAuth('ready');
      await loadCatalog();
    } catch (loginError) { setError(loginError.message); }
  };

  const logout = async () => {
    await api('/api/library-auth', { method: 'DELETE' }).catch(() => {});
    setCatalog(null);
    setReader(null);
    setDetail(null);
    setAuth('locked');
  };

  if (auth !== 'ready') return (
    <main className="private-library private-library--gate">
      <Link className="library-back" to="/"><ArrowLeft size={15} /> Back to Blog</Link>
      <form className="library-gate" onSubmit={login}>
        <span className="gate-icon"><LockKeyhole size={24} /></span>
        <p className="library-kicker">PRIVATE ARCHIVE</p>
        <h1>Private Library</h1>
        <p>A personal archive for research literature and reading notes. Your password only establishes a secure session on this device.</p>
        {auth === 'checking' ? <div className="library-loading">Checking access…</div> : auth === 'setup' ?
          <div className="library-error">The private archive has not completed its one-time configuration. See LIBRARY-SETUP.md in the Blog repository.</div> : <>
          <label><span>Access Password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} autoFocus /></label>
          <button type="submit" disabled={!password}>Enter Library</button>
        </>}
        {error && <div className="library-error">{error}</div>}
      </form>
    </main>
  );

  const totalBytes = items.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0);
  const modeCount = name => name === 'favorites' ? items.filter(item => item.favorite).length : name === 'recent' ? items.filter(item => recents.includes(item.relativePath)).length : name === 'new' ? items.filter(item => new Date(`${item.modified}T00:00:00`) >= newThreshold).length : items.length;

  return (
    <main className="private-library private-library--workbench">
      <div className="paper-noise" aria-hidden="true" />
      <header className="topbar">
        <button className="brand" onClick={() => chooseMode('all')} aria-label="Return to the library home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span><strong>E·LIBRARY</strong><small>A private research collection</small></span></button>
        <div className="header-actions"><span className="connection-status is-live"><i /><span>Private · Git LFS</span></span><Link className="quiet-button" to="/"><ArrowLeft size={14} /> Blog</Link><button className="quiet-button" onClick={logout}><LogOut size={14} /> Sign Out</button></div>
      </header>

      <div className="library-shell">
        <section className="hero" aria-labelledby="heroTitle">
          <div className="hero-copy"><span className="eyebrow">PERSONAL KNOWLEDGE LIBRARY</span><h1 id="heroTitle">From one text to the next question.</h1><p>Books, papers, and working material—indexed, searchable, and annotated in one place.</p></div>
          <div className="hero-orbit" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="hero-glyph">∫</span></div>
          <div className={`search-wrap ${query ? 'has-query' : ''}`}><span className="search-icon" aria-hidden="true" /><input id="remoteLibrarySearch" type="search" autoComplete="off" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, author, path, tag, or note…" aria-label="Search the library" /><kbd>/</kbd><button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button></div>
          <div className="hero-stats" aria-label="Library statistics"><div className="stat"><strong>{items.length}</strong><span>Items</span></div><div className="stat"><strong>{categories.length}</strong><span>Collections</span></div><div className="stat"><strong>{formatBytes(totalBytes)}</strong><span>Private Archive</span></div></div>
        </section>

        <section className="workspace">
          <aside className="sidebar" aria-label="Library filters">
            <div className="sidebar-section"><div className="section-label">My Library</div>{[['all', '⌂', 'All Items'], ['favorites', '☆', 'Favorites'], ['recent', '↺', 'Recently Opened'], ['new', '✦', 'Recently Updated']].map(([name, icon, label]) => <button key={name} className={`nav-item ${mode === name ? 'is-active' : ''}`} onClick={() => chooseMode(name)}><span className="nav-icon">{icon}</span><span>{label}</span><b>{modeCount(name)}</b></button>)}</div>
            <div className="sidebar-section"><div className="section-label"><span>Collections</span><small>Hold 0.5s to reorder</small></div><div className="category-list" ref={categoryListRef}>{categories.map(name => <button key={name} data-category={name} className={`nav-item ${mode === 'all' && category === name ? 'is-active' : ''}`} onPointerDown={beginCategoryDrag} onClick={() => { if (performance.now() - categoryDragEndedAtRef.current < 250) return; setMode('all'); setCategory(name); }} style={{ '--hue': hueFor(name) }}><span className="category-dot" /><span>{name}</span><b>{items.filter(item => item.category === name).length}</b></button>)}</div></div>
            <div className="sidebar-tip"><span>⌘</span><p><strong>Quick start</strong><br />Press <kbd>/</kbd> to search. Open Details for metadata and notes.</p></div>
          </aside>

          <div className="library-content">
            <div className="content-heading"><div><span className="eyebrow">{context[0]}</span><h2>{query ? `Search: “${query}”` : context[1]}</h2><p>{context[2]}</p></div><div className="view-switch" role="group" aria-label="Change view"><button className={view === 'grid' ? 'is-active' : ''} onClick={() => chooseView('grid')} aria-label="Card view">▦</button><button className={view === 'list' ? 'is-active' : ''} onClick={() => chooseView('list')} aria-label="List view">☷</button></div></div>
            <div className="filter-row"><div className="filter-scroll"><button className={`filter-chip ${kind === 'all' ? 'is-active' : ''}`} onClick={() => setKind('all')}>All Types</button>{kinds.map(name => <button key={name} className={`filter-chip ${kind === name ? 'is-active' : ''}`} onClick={() => setKind(name)}>{name} · {items.filter(item => item.kind === name).length}</button>)}</div><label className="sort-control"><span>Sort</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="title">Title A–Z</option><option value="modified">Last Updated</option><option value="size">File Size</option><option value="year">Publication Year</option><option value="opened">Last Opened</option></select></label></div>
            {error && <div className="library-error">{error} <button onClick={loadCatalog}>Retry</button></div>}
            <div className="results-meta"><span>{visible.length} {visible.length === 1 ? 'item' : 'items'}</span><span>{catalog?.publishedAt ? `Indexed ${new Date(catalog.publishedAt).toLocaleString('en-GB')}` : ''}</span></div>
            <div className={`catalog-grid ${view === 'list' ? 'is-list' : ''}`}>{visible.map(item => {
              const preview = coverUrl(item);
              const isPdf = item.kind.toLowerCase() === 'pdf';
              return <article className="catalog-card" key={item.id} style={{ '--hue': hueFor(item.category) }}>
                {preview ? <div className="cover-preview"><img src={preview} alt={`Cover of ${item.title}`} loading="lazy" /></div> : <div className="cover-preview cover-preview--empty" aria-hidden="true"><span>{item.kind}</span><i>NO PREVIEW</i></div>}
                <div className="card-top"><span className="kind-badge">{item.kind}</span>{item.favorite && <Star className="favorite-mark" size={17} fill="currentColor" />}</div>
                <div className="card-main"><h3 title={item.title}>{item.title}</h3><p className="byline">{(item.authors || []).join(' · ') || item.category}</p></div>
                <p className="summary">{item.summary || item.personalNote || `Filed under ${item.category}. Open Details for metadata and reading notes.`}</p>
                <div className="tag-row">{(item.tags || []).slice(0, 4).map(tag => <button className="tag" key={tag} onClick={() => setQuery(tag)}>{tag}</button>)}</div>
                <div className="card-footer"><div className="file-meta"><span>{item.category}{item.year ? ` · ${item.year}` : ''}</span><span>{formatBytes(item.sizeBytes)} · {item.modified}</span></div><div className="card-actions"><button className="detail-button" onClick={() => setDetail(item)}>Details</button>{isPdf ? <button className="open-button" onClick={() => openReader(item)}>Read</button> : <a className="open-button" href={fileUrl(item)} onClick={() => recordOpen(item)}>Open</a>}</div></div>
              </article>;
            })}</div>
            {!visible.length && <div className="empty-state"><div className="empty-symbol">∅</div><h3>No results found</h3><p>Try a shorter query or clear the current filters.</p><button className="primary-button" onClick={() => { setQuery(''); setMode('all'); setCategory('all'); setKind('all'); }}>View All Items</button></div>}
          </div>
        </section>
      </div>

      <footer className="library-footer"><span>E-Book & Resource · Remote private library</span><span>Catalog and source files synchronized through private Git LFS</span></footer>

      {detail && <><button className="drawer-backdrop" onClick={() => setDetail(null)} aria-label="Close details" /><aside className="detail-drawer is-open" aria-label="Item details"><button className="drawer-close" onClick={() => setDetail(null)} aria-label="Close details">×</button><span className="drawer-category">{detail.category}{detail.subcategory ? ` / ${detail.subcategory}` : ''}</span><h2>{detail.title}</h2><p className="drawer-authors">{(detail.authors || []).join(' · ') || 'Author information not yet available'}</p>{coverUrl(detail) && <div className="drawer-cover"><img src={coverUrl(detail)} alt={`Cover of ${detail.title}`} /></div>}<div className="tag-row">{(detail.tags || []).map(tag => <span className="tag" key={tag}>{tag}</span>)}</div><p className="drawer-summary">{detail.summary || 'No abstract is available yet.'}</p><dl className="detail-list"><dt>Year</dt><dd>{detail.year || '—'}</dd><dt>Source</dt><dd>{detail.venue || '—'}</dd><dt>DOI</dt><dd>{detail.doi || '—'}</dd><dt>File</dt><dd>{detail.relativePath}</dd><dt>Size</dt><dd>{formatBytes(detail.sizeBytes)} · {detail.kind}</dd><dt>Last Updated</dt><dd>{detail.modified}</dd></dl>{detail.personalNote && <><label className="note-label">Reading Note</label><p className="saved-note">{detail.personalNote}</p></>}<div className="drawer-actions">{detail.kind.toLowerCase() === 'pdf' && <button className="open-button" onClick={() => { setDetail(null); openReader(detail); }}>Read PDF</button>}<a className="detail-button" href={fileUrl(detail, true)}><Download size={14} /> Download</a></div></aside></>}

      {reader && <div className="pdf-reader" role="dialog" aria-modal="true" aria-label={`Read ${reader.title}`}><div className="reader-toolbar"><button onClick={() => setReader(null)}><ArrowLeft size={17} /> Back to Library</button><strong>{reader.title}</strong><a href={`${reader.fileUrl}&download=1`}><Download size={16} /> Download</a></div><iframe title={reader.title} src={reader.fileUrl} /></div>}
    </main>
  );
}
