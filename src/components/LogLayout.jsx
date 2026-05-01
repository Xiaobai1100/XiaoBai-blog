import React, { useEffect } from 'react';
import { ArrowLeft, Terminal, ShieldCheck, Clock, FileText, Share2, Printer, Crosshair } from 'lucide-react';

const LogMode = ({ title, category, date, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#020408] text-[#c9d1d9] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. 动态背景层 (不再是死黑) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* A. 基础微网格 */}
        <div className="absolute inset-0 opacity-[0.07]" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
        />
        {/* B. 主坐标网格 */}
        <div className="absolute inset-0 opacity-[0.1]" 
             style={{ backgroundImage: 'linear-gradient(rgba(34,211,238,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.1) 1px, transparent 1px)', backgroundSize: '100px 100px' }} 
        />
        {/* C. 模拟时空弯曲的弧线 (左上与右下) */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] border-[1px] border-cyan-500/10 rounded-full" />
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] border-[1px] border-cyan-500/5 rounded-full" />
        <div className="absolute top-[20%] -right-40 w-[600px] h-[600px] border-[1px] border-pink-500/5 rounded-full" />
        
        {/* D. 渐变晕影 (确保阅读区中心最暗/最干净) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020408_80%)]" />
      </div>

      {/* 2. 顶部系统状态栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020408]/80 backdrop-blur-xl border-b border-white/10 px-4 md:px-8 py-3 flex justify-between items-center">
        <a 
          href="/logs" 
          className="flex items-center gap-2 text-[10px] md:text-xs text-white/50 hover:text-cyan-400 transition-all uppercase tracking-[0.2em] font-bold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          SYS_RET::INDEX
        </a>
        
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">
            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-cyan-500/50"/> Security: Level_5</span>
            <span className="flex items-center gap-1.5"><Terminal size={12} className="text-cyan-500/50"/> Encryption: AES_256</span>
          </div>
          <div className="flex gap-3 border-l border-white/10 pl-6">
            <button className="text-white/30 hover:text-cyan-400 transition-colors"><Share2 size={14} /></button>
            <button className="text-white/30 hover:text-cyan-400 transition-colors"><Printer size={14} /></button>
          </div>
        </div>
      </nav>

      {/* 3. 核心阅读区 */}
      <div className="relative z-10 max-w-5xl mx-auto pt-24 md:pt-32 pb-32 px-4 md:px-6">
        
        {/* 档案实体容器 */}
        <article className="bg-[#050b14]/90 backdrop-blur-2xl border border-white/10 rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
          
          {/* 四角 UI 装饰零件 */}
          <div className="absolute top-2 left-2 text-cyan-500/20"><Crosshair size={10} /></div>
          <div className="absolute top-2 right-2 text-cyan-500/20"><Crosshair size={10} /></div>
          <div className="absolute bottom-2 left-2 text-cyan-500/20"><Crosshair size={10} /></div>
          <div className="absolute bottom-2 right-2 text-cyan-500/20 text-[8px] font-bold">RE-v4.0.1</div>

          {/* 顶部彩色激光线 */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* Header */}
          <header className="px-6 md:px-16 pt-12 md:pt-20 pb-10 border-b border-white/5">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 text-[10px] tracking-[0.3em] font-bold uppercase">
                <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 border border-cyan-500/20 rounded-sm flex items-center gap-2">
                  <FileText size={12}/> {category}
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <Clock size={12}/> {date}
                </span>
                <div className="flex-grow h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-cyan-500/40 animate-pulse hidden sm:block">STATUS: DECRYPTED</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.1] uppercase italic">
                {title}
              </h1>
            </div>
          </header>

          {/* 正文：增加合理的内边距与排版密度 */}
          <div className="px-6 md:px-16 py-12 md:py-20 text-white/80 leading-relaxed text-base md:text-lg">
            <div className="prose prose-invert max-w-none 
                 prose-headings:text-white prose-headings:tracking-widest prose-headings:uppercase
                 prose-strong:text-cyan-400 prose-code:text-cyan-300
                 prose-p:mb-8">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="px-6 md:px-16 py-8 bg-black/40 border-t border-white/5 flex justify-between items-center text-[10px] text-white/20 tracking-[0.4em] uppercase font-bold">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-cyan-500/50 rounded-full animate-ping" />
              <span>Stream_Active</span>
            </div>
            <span>// END_OF_TRANSMISSION</span>
          </footer>

        </article>

        {/* 底部装饰：坐标信息 */}
        <div className="mt-12 flex justify-between items-center text-[8px] text-white/10 tracking-[0.5em] uppercase font-black px-4">
          <span>LAT: 35.6895° N / LONG: 139.6917° E</span>
          <span>Observation_Station_Alpha</span>
        </div>
      </div>

      {/* 全局模拟扫描线 (极淡) */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  );
};

export default LogMode;