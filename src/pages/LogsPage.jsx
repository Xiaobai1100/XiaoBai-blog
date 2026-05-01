import React, { useEffect } from 'react';
import { ArrowLeft, Share2, Printer, ChevronUp } from 'lucide-react';

const LogLayout = ({ title, category, date, children }) => {
  // 进入文章时自动回到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // 背景彻底改为纯实心深色，不再透明！极大地提高阅读对比度。
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-mono selection:bg-cyan-500/30">
      
      {/* 顶部导航栏 (Fixed Navbar) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3 flex justify-between items-center">
        {/* 修复：将 Link 换成普通的 a 标签，防止 Router 报错 */}
        <a 
          href="/" 
          className="flex items-center gap-2 text-xs md:text-sm text-white/50 hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold"
        >
          <ArrowLeft size={16} /> Return_to_Archive
        </a>
        <div className="flex gap-4">
          <button className="text-white/40 hover:text-white transition-colors" title="Share Log"><Share2 size={16} /></button>
          <button className="text-white/40 hover:text-white transition-colors" title="Print Log"><Printer size={16} /></button>
        </div>
      </nav>

      {/* 容器加宽 (max-w-5xl)，充分利用电脑屏幕宽度 */}
      <div className="max-w-5xl mx-auto pt-24 md:pt-32 pb-32 px-4 md:px-8">
        
        {/* 文章头部 (Article Header) */}
        <header className="mb-16 border-b border-white/10 pb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] font-bold uppercase">
              <span className="bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-sm border border-cyan-500/20">{category}</span>
              <span className="text-white/30">{date}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight uppercase">
              {title}
            </h1>
          </div>
        </header>

        {/* 文章主体 (Article Content) */}
        <main className="prose prose-invert prose-cyan max-w-none">
          {children}
        </main>
        
        {/* 文章底部控制台 */}
        <div className="mt-20 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-white/40 tracking-widest uppercase">
          <span>End_Of_Log</span>
          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
          >
            Top <ChevronUp size={14} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogLayout;