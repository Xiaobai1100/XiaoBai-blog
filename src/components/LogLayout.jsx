import React, { useEffect } from 'react';
import { ArrowLeft, Terminal, ShieldCheck, Clock, FileText } from 'lucide-react';

// LogMode 模板组件
// 接收参数: title (标题), category (分类), date (日期), children (你的正文内容)
const LogMode = ({ title, category, date, children }) => {
  // 每次进入文章时自动滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-white font-mono selection:bg-cyan-500/30">
      
      {/* 1. 军工级背景：极暗的扫描网格 (不会干扰阅读) */}
      <div className="fixed inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
      />

      {/* 2. 顶部系统导航栏 (Fixed Navbar) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#020408]/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-3 flex justify-between items-center shadow-lg">
        {/* 返回按钮 (如果在 React Router 里，请把 a 标签换回 Link 标签) */}
        <a 
          href="/logs" 
          className="flex items-center gap-2 text-[10px] md:text-xs text-white/50 hover:text-cyan-400 transition-colors uppercase tracking-[0.2em] font-bold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Return_to_Index
        </a>
        
        <div className="hidden md:flex items-center gap-4 text-[10px] text-cyan-500/60 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> ACCESS: GRANTED</span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5"><Terminal size={14}/> TERMINAL_ACTIVE</span>
        </div>
      </div>

      {/* 3. 核心阅读区容器 (拉宽到 max-w-5xl, 并提供极高的阅读对比度) */}
      <div className="relative z-10 max-w-5xl mx-auto pt-24 md:pt-32 pb-32 px-4 md:px-6">
        
        {/* "加密文档" 实体容器 */}
        <article className="bg-[#050b14] border border-white/10 rounded-sm shadow-2xl relative overflow-hidden">
          
          {/* 顶部青色装饰线 */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500/80 to-transparent" />

          {/* 文章头部 (Header) */}
          <header className="px-6 md:px-12 pt-10 md:pt-14 pb-8 border-b border-white/5 bg-white/[0.01]">
            <div className="flex flex-col gap-6">
              {/* 分类与时间 */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] md:text-xs tracking-[0.2em] font-bold uppercase">
                <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1.5 border border-cyan-500/20 flex items-center gap-2">
                  <FileText size={12}/> {category}
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <Clock size={12}/> {date}
                </span>
                <span className="text-white/20 hidden md:block">|</span>
                <span className="text-cyan-500/40 hidden md:block animate-pulse">STATUS: DECRYPTED</span>
              </div>
              
              {/* 大标题 */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-white leading-tight uppercase italic">
                {title}
              </h1>
            </div>
          </header>

          {/* 文章正文 (Content Body) - 加大了两侧内边距 */}
          <div className="px-6 md:px-12 py-10 md:py-14 text-white/80 leading-relaxed text-sm md:text-base">
            {children}
          </div>

          {/* 文章尾部 */}
          <footer className="px-6 md:px-12 py-6 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 tracking-[0.3em] uppercase">
            <span>End_Of_Document</span>
            <span className="w-2 h-4 bg-cyan-500/50 animate-pulse inline-block" />
          </footer>

        </article>
      </div>

    </div>
  );
};

export default LogMode;