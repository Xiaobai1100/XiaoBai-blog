import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Database, ShieldCheck, Cpu, Clock, ChevronRight } from 'lucide-react';

// =========================================================
// 临时 Mock 数据 (在没有父级 App.jsx 时保证预览环境运行)
// =========================================================

const LogsPage = () => {
  const [time, setTime] = useState('');

  // 每次进入页面强制置顶，并启动系统时钟
  useEffect(() => {
    window.scrollTo(0, 0);
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-white font-mono selection:bg-cyan-500/30">
      
      {/* 1. 军工级背景：暗色扫描网格 */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      {/* 2. 核心内容区：占满最大宽度的宽屏终端 */}
      <div className="relative z-10 max-w-6xl mx-auto pt-16 md:pt-24 pb-32 px-4 md:px-8">
        
        {/* =========================================
            系统信息头 (System Header)
           ========================================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-2 border-white/20 pb-4 gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white/90">
              Observation<span className="text-cyan-500">_Terminal</span>
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs text-cyan-400/70 tracking-widest font-bold">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> CLEARANCE: LEVEL_5</span>
              <span className="hidden md:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5"><Cpu size={14}/> CORE: STABLE</span>
              <span className="hidden md:inline text-white/20">|</span>
              <span className="flex items-center gap-1.5"><Database size={14}/> DB_RECORDS: {POSTS.length}</span>
            </div>
          </div>

          <div className="text-[10px] md:text-xs text-white/40 tracking-widest space-y-1 text-left md:text-right">
            <div className="flex items-center md:justify-end gap-2"><Clock size={12}/> {time || 'SYS_BOOTING...'}</div>
            <div>UPTIME: 94.2% / NODE: OMEGA-7</div>
          </div>
        </div>

        {/* =========================================
            高密度数据表 (Dense Data Table)
           ========================================= */}
        <div className="w-full bg-[#050b14] border border-white/10 rounded-sm shadow-2xl">
          
          {/* 表头 (Table Header) */}
          <div className="hidden md:flex items-center px-6 py-3 bg-white/5 border-b border-white/10 text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">
            <div className="w-24 shrink-0">File_ID</div>
            <div className="w-32 shrink-0">Timestamp</div>
            <div className="w-32 shrink-0">Class</div>
            <div className="flex-1">Subject_Designation</div>
            <div className="w-24 shrink-0 text-right">Status</div>
            <div className="w-8 shrink-0"></div>
          </div>

          {/* 表格内容 (Table Body) */}
          <div className="flex flex-col">
            {POSTS.map((post, index) => (
              <Link 
                key={post.id} 
                to={`/logs/${post.id}`}
                className="group flex flex-col md:flex-row md:items-center px-4 md:px-6 py-4 md:py-3 border-b border-white/5 hover:bg-cyan-900/20 transition-colors relative"
              >
                {/* 悬停时的左侧高亮指示条 */}
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />

                {/* 移动端排版 */}
                <div className="flex justify-between items-center w-full md:hidden mb-2">
                  <div className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest">{post.id}</div>
                  <div className="text-[10px] text-white/40 font-bold">{post.date}</div>
                </div>

                {/* 桌面端排版 & 共有数据 */}
                <div className="hidden md:block w-24 shrink-0 text-[11px] text-cyan-500/70 group-hover:text-cyan-400 font-bold uppercase tracking-widest transition-colors">
                  {post.id.split('-').join('_')}
                </div>
                
                <div className="hidden md:block w-32 shrink-0 text-[11px] text-white/40 group-hover:text-white/70 font-mono transition-colors">
                  {post.date}
                </div>

                <div className="w-32 shrink-0 text-[10px] md:text-[11px] text-white/30 group-hover:text-white/60 uppercase tracking-widest transition-colors mb-1 md:mb-0">
                  [{post.category}]
                </div>

                <div className="flex-1 text-sm md:text-[13px] text-white/80 group-hover:text-white font-bold uppercase tracking-wide transition-colors truncate pr-4">
                  {post.title}
                </div>

                {/* 状态与交互指示器 */}
                <div className="hidden md:block w-24 shrink-0 text-[10px] text-right tracking-widest uppercase font-bold text-white/20 group-hover:text-cyan-400/80 transition-colors">
                  {post.status}
                </div>

                <div className="hidden md:flex w-8 shrink-0 justify-end text-white/20 group-hover:text-cyan-400 transition-colors transform group-hover:translate-x-1">
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
          
          {/* 表底 (Table Footer) */}
          <div className="px-6 py-3 bg-black/40 border-t border-white/10 text-[9px] text-white/30 tracking-[0.3em] uppercase flex items-center gap-2">
            <span className="w-2 h-4 bg-cyan-500/50 animate-pulse inline-block" />
            Awaiting Command Input...
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogsPage;