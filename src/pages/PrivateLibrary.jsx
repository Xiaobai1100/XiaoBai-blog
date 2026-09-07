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
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data;
}

export default function PrivateLibrary() {
  const [auth, setAuth] = useState('checking');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
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

  const categories = useMemo(() => ['全部', ...new Set((catalog?.items || []).map(item => item.category))], [catalog]);
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (catalog?.items || []).filter(item => {
      if (category !== '全部' && item.category !== category) return false;
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
      <Link className="library-back" to="/"><ArrowLeft size={15} /> 返回 Blog</Link>
      <form className="library-gate" onSubmit={login}>
        <span className="gate-icon"><LockKeyhole size={24} /></span>
        <p className="library-kicker">PRIVATE ARCHIVE</p>
        <h1>私人资料库</h1>
        <p>这里存放工作文献与个人批注。访问密码只用于建立本设备的安全会话。</p>
        {auth === 'checking' ? <div className="library-loading">正在确认访问状态…</div> : auth === 'setup' ?
          <div className="library-error">私人存储尚未完成一次性配置。站点所有者可按 Blog 仓库中的 LIBRARY-SETUP.md 启用。</div> : <>
          <label><span>访问密码</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} autoFocus /></label>
          <button type="submit" disabled={!password}>进入资料库</button>
        </>}
        {error && <div className="library-error">{error}</div>}
      </form>
    </main>
  );

  return (
    <main className="private-library">
      <header className="library-header">
        <div><p className="library-kicker">XIAOBAI · PRIVATE ARCHIVE</p><h1>随身资料库</h1><p>{catalog ? `${catalog.items.length} 份资料 · 更新于 ${new Date(catalog.publishedAt).toLocaleString('zh-CN')}` : '正在读取馆藏…'}</p></div>
        <div className="library-header-actions"><Link to="/"><ArrowLeft size={15} /> Blog</Link><button onClick={logout}><LogOut size={15} /> 退出</button></div>
      </header>
      <div className="library-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题、作者、摘要或标签…" />{query && <button onClick={() => setQuery('')} aria-label="清空"><X size={16} /></button>}</div>
      <div className="library-layout">
        <aside><p>馆藏目录</p>{categories.map(name => <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}><span>{name}</span><b>{name === '全部' ? catalog?.items.length : catalog?.items.filter(item => item.category === name).length}</b></button>)}</aside>
        <section className="remote-catalog">
          {error && <div className="library-error">{error} <button onClick={loadCatalog}>重试</button></div>}
          {!catalog && !error && <div className="library-loading">正在从私有存储载入目录…</div>}
          <div className="remote-catalog-heading"><h2>{category}</h2><span>{visible.length} 项</span></div>
          <div className="remote-grid">{visible.map(item => {
            const fileUrl = `/api/library-file?pathname=${encodeURIComponent(item.relativePath)}&filename=${encodeURIComponent(item.title + item.extension)}`;
            const isPdf = item.kind.toLowerCase() === 'pdf';
            return <article key={item.id}>
              <div className="remote-card-top"><span>{item.kind}</span>{item.favorite && <Star size={15} fill="currentColor" />}</div>
              <h3>{item.title}</h3>
              <p className="remote-byline">{(item.authors || []).join(' · ') || item.category}</p>
              <p className="remote-summary">{item.summary || item.personalNote || '暂无摘要，打开文件继续阅读。'}</p>
              {item.personalNote && <blockquote>{item.personalNote}</blockquote>}
              <footer><span>{formatBytes(item.sizeBytes)} · {item.modified}</span><div>{isPdf && <button onClick={() => setReader({ ...item, fileUrl })}><BookOpen size={14} /> 阅读</button>}<a href={`${fileUrl}&download=1`}><Download size={14} /> 下载</a></div></footer>
            </article>;
          })}</div>
        </section>
      </div>
      {reader && <div className="pdf-reader" role="dialog" aria-modal="true" aria-label={`阅读 ${reader.title}`}>
        <div className="reader-toolbar"><button onClick={() => setReader(null)}><ArrowLeft size={17} /> 返回馆藏</button><strong>{reader.title}</strong><a href={`${reader.fileUrl}&download=1`}><Download size={16} /> 下载</a></div>
        <iframe title={reader.title} src={reader.fileUrl} />
      </div>}
    </main>
  );
}
