import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Database, ShieldCheck, Cpu, Clock, ChevronRight } from 'lucide-react';
import { POSTS } from '../config/posts';

/**
 * 智能溢出悬停滚动单元格 (HoverScrollCell)
 * 静止时严格裁剪显示前段，绝不出格重叠；当鼠标挪到所在行时，自动平滑向左滚动显示全部内容
 */
const HoverScrollCell = ({ text, className = "" }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current && textRef.current) {
        const overflow = textRef.current.scrollWidth - containerRef.current.clientWidth;
        setScrollOffset(overflow > 2 ? overflow + 8 : 0);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  return (
    <div
      ref={containerRef}
      style={{
        '--marquee-offset': `-${scrollOffset}px`,
        '--marquee-duration': `${Math.max(1.2, scrollOffset * 0.022)}s`
      }}
      className={`overflow-hidden whitespace-nowrap ${className}`}
    >
      <span
        ref={textRef}
        className={`inline-block transition-transform ease-in-out ${
          scrollOffset > 0 ? 'group-hover:translate-x-[var(--marquee-offset)]' : ''
        }`}
        style={{ transitionDuration: scrollOffset > 0 ? 'var(--marquee-duration)' : '0.2s' }}
      >
        {text}
      </span>
    </div>
  );
};

const LogsPage = ({ backgroundComponent: BackgroundComponent }) => {
  const [time, setTime] = useState('');

  // 每次进入页面强制置顶，并启动系统时钟
  useEffect(() => {
    window.scrollTo(0, 0);
    const updateClock = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-white font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 0. 连续流体黑洞背景 (Archive 观测站远景模式，不再是无意义的散点噪点) */}
      {BackgroundComponent && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-85">
          <BackgroundComponent mode="archive" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,transparent_15%,rgba(2,4,8,0.88)_75%)]" />
        </div>
      )}

      {/* 1. 精密观测台微网格 */}
      <div className="fixed inset-0 pointer-events-none opacity-15 z-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      {/* 2. 核心内容区 */}
      <div className="relative z-10 max-w-6xl mx-auto pt-24 md:pt-32 pb-32 px-4 md:px-8">
        
        {/* =========================================
            系统信息头 (System Header)
           ========================================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-amber-500/30 pb-5 gap-4 backdrop-blur-sm">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white/95">
              Observation<span className="text-amber-400">_Terminal</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs text-cyan-400/80 tracking-widest font-bold">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> CLEARANCE: LEVEL_5</span>
              <span className="hidden md:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5"><Cpu size={14}/> CORE: CONTINUOUS_FLUID</span>
              <span className="hidden md:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5"><Database size={14}/> DB_RECORDS: {POSTS.length}</span>
            </div>
          </div>

          <div className="text-[10px] md:text-xs text-white/50 tracking-widest space-y-1 text-left md:text-right">
            <div className="flex items-center md:justify-end gap-2 text-amber-300/80"><Clock size={12}/> {time || 'SYS_BOOTING...'}</div>
            <div>ORBITAL_TELEMETRY: LOCKED / NODE: GARGANTUA</div>
          </div>
        </div>

        {/* =========================================
            高密度毛玻璃数据表 (绝不越界重叠 + 悬停自动滚动显示全名)
           ========================================= */}
        <div className="w-full bg-[#050914]/75 backdrop-blur-xl border border-white/15 rounded-sm shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden">
          
          {/* 表头 (严格使用 CSS Grid 锁定列宽与间距) */}
          <div className="hidden md:grid md:grid-cols-[150px_115px_170px_minmax(0,1fr)_105px_28px] gap-4 items-center px-6 py-3.5 bg-white/[0.04] border-b border-white/10 text-[10px] font-bold text-amber-300/70 tracking-[0.2em] uppercase">
            <div>File_ID</div>
            <div>Timestamp</div>
            <div>Class</div>
            <div>Subject_Designation</div>
            <div className="text-right">Status</div>
            <div></div>
          </div>

          {/* 表格内容 (Table Body) */}
          <div className="flex flex-col divide-y divide-white/5">
            {POSTS.map((post) => {
              const formattedId = post.id.split('-').join('_').toUpperCase();
              const formattedClass = `[${post.category}]`;

              return (
                <Link 
                  key={post.id} 
                  to={`/logs/${post.id}`}
                  className="group flex flex-col md:grid md:grid-cols-[150px_115px_170px_minmax(0,1fr)_105px_28px] md:gap-4 md:items-center px-4 md:px-6 py-4 md:py-3.5 hover:bg-gradient-to-r hover:from-amber-500/15 hover:via-cyan-500/10 hover:to-transparent transition-all duration-300 relative"
                >
                  {/* 悬停时的左侧吸积盘高亮指示条 */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 to-amber-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />

                  {/* 移动端顶部行 */}
                  <div className="flex justify-between items-center w-full md:hidden mb-1.5 gap-3">
                    <HoverScrollCell 
                      text={formattedId} 
                      className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest max-w-[60%]" 
                    />
                    <div className="text-[10px] text-white/40 font-bold shrink-0">{post.date}</div>
                  </div>

                  {/* 1. FILE_ID 列 (超出自动隐藏，鼠标悬停平滑滚动显示后面内容) */}
                  <HoverScrollCell 
                    text={formattedId}
                    className="hidden md:block text-[11px] text-cyan-400/80 group-hover:text-cyan-300 font-bold uppercase tracking-wider transition-colors"
                  />
                  
                  {/* 2. TIMESTAMP 列 */}
                  <div className="hidden md:block text-[11px] text-white/45 group-hover:text-white/80 font-mono transition-colors">
                    {post.date}
                  </div>

                  {/* 3. CLASS 列 (解决 [EXTERNAL_TRANSMISSION] 与右侧标题重叠的问题) */}
                  <HoverScrollCell 
                    text={formattedClass}
                    className="text-[10px] md:text-[11px] text-amber-300/50 group-hover:text-amber-300 uppercase tracking-wider transition-colors mb-1 md:mb-0"
                  />

                  {/* 4. SUBJECT_DESIGNATION 标题列 */}
                  <HoverScrollCell 
                    text={post.title}
                    className="text-sm md:text-[13px] text-white/85 group-hover:text-white font-bold uppercase tracking-wide transition-colors"
                  />

                  {/* 5. STATUS 状态列 */}
                  <div className="hidden md:block text-[10px] text-right tracking-widest uppercase font-bold text-white/30 group-hover:text-cyan-400 transition-colors">
                    {post.status || 'DECRYPTED'}
                  </div>

                  {/* 6. 箭头指示器 */}
                  <div className="hidden md:flex justify-end text-white/20 group-hover:text-amber-400 transition-all transform group-hover:translate-x-1">
                    <ChevronRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* 表底 (Table Footer) */}
          <div className="px-6 py-3.5 bg-black/50 border-t border-white/10 text-[9px] text-white/40 tracking-[0.3em] uppercase flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-3.5 bg-amber-400/70 animate-pulse inline-block" />
              <span>Awaiting Command Input // Hover Row To Scroll Full Designation</span>
            </div>
            <span className="hidden sm:inline text-cyan-400/50">RELATIVISTIC_INDEX_V6</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogsPage;