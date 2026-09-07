import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Download, LockKeyhole, LogOut, Search, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './PrivateLibrary.css';

const formatBytes = bytes => {
  const value = Number(bytes) || 0;
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
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

export default function PrivateLibrary() {
  const [auth, setAuth] = useState('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [reader, setReader] = useState(null);

  useEffect(() => {
    document.body.classList.add('private-library-active');
    return () => document.body.classList.remove('private-library-active');
  }, []);

  const loadCatalog = async () => {
    setError('');
    try { setCatalog(await api('/api/library-catalog')); }
    catch (loadError) { setError(loadError.message); }
  };

  useEffect(() => {
    api('/api/library-auth').then(result => {
      setAuth(result.authenticated ? 'ready' : result.configured ? 'locked' : 'setup');
      if (result.authenticated) loadCatalog();
    }).catch(() => setAuth('locked'));
  }, []);

  const categories = useMemo(() => ['All', ...new Set((catalog?.items || []).map(item => item.category))], [catalog]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (catalog?.items || []).filter(item => {
      if (category !== 'All' && item.category !== category) return false;
      return !needle || [item.title, item.category, item.summary, ...(item.authors || []), ...(item.tags || [])]
        .join(' ').toLocaleLowerCase().includes(needle);
    });
  }, [catalog, category, query]);

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

  return (
    <main className="private-library">
      <header className="library-header">
        <div><p className="library-kicker">XIAOBAI · PRIVATE ARCHIVE</p><h1>Research Library</h1><p>{catalog ? `${catalog.items.length} items · Updated ${new Date(catalog.publishedAt).toLocaleString('en-GB')}` : 'Loading collection…'}</p></div>
        <div className="library-header-actions"><Link to="/"><ArrowLeft size={15} /> Blog</Link><button onClick={logout}><LogOut size={15} /> Sign Out</button></div>
      </header>
      <div className="library-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title, author, summary, or tag…" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</div>
      <div className="library-layout">
        <aside><p>Collections</p>{categories.map(name => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}><span>{name}</span><b>{name === 'All' ? catalog?.items.length : catalog?.items.filter(item => item.category === name).length}</b></button>)}</aside>
        <section className="remote-catalog">
          {error && <div className="library-error">{error} <button onClick={loadCatalog}>Retry</button></div>}
          {!catalog && !error && <div className="library-loading">Loading the private catalog…</div>}
          <div className="remote-catalog-heading"><h2>{category}</h2><span>{visible.length} {visible.length === 1 ? 'item' : 'items'}</span></div>
          <div className="remote-grid">{visible.map(item => {
            const fileUrl = `/api/library-file?pathname=${encodeURIComponent(item.relativePath)}&filename=${encodeURIComponent(item.title + item.extension)}`;
            const coverUrl = item.coverPath ? `/api/library-file?pathname=${encodeURIComponent(item.coverPath)}&filename=cover.jpg` : '';
            const isPdf = item.kind.toLowerCase() === 'pdf';
            return <article key={item.id}>
              {coverUrl ? <div className="remote-cover"><img src={coverUrl} alt={`Cover of ${item.title}`} loading="lazy" /></div> : <div className="remote-cover remote-cover--empty"><span>{item.kind}</span><small>NO PREVIEW</small></div>}
              <div className="remote-card-top"><span>{item.kind}</span>{item.favorite && <Star size={15} fill="currentColor" />}</div>
              <h3>{item.title}</h3>
              <p className="remote-byline">{(item.authors || []).join(' · ') || item.category}</p>
              <p className="remote-summary">{item.summary || item.personalNote || 'No summary is available. Open the file to continue reading.'}</p>
              {item.personalNote && <blockquote>{item.personalNote}</blockquote>}
              <footer><span>{formatBytes(item.sizeBytes)} · {item.modified}</span><div>{isPdf && <button onClick={() => setReader({ ...item, fileUrl })}><BookOpen size={14} /> Read</button>}<a href={`${fileUrl}&download=1`}><Download size={14} /> Download</a></div></footer>
            </article>;
          })}</div>
        </section>
      </div>
      {reader && <div className="pdf-reader" role="dialog" aria-modal="true" aria-label={`Read ${reader.title}`}>
        <div className="reader-toolbar"><button onClick={() => setReader(null)}><ArrowLeft size={17} /> Back to Library</button><strong>{reader.title}</strong><a href={`${reader.fileUrl}&download=1`}><Download size={16} /> Download</a></div>
        <iframe title={reader.title} src={reader.fileUrl} />
      </div>}
    </main>
  );
}
