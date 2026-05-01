import React, { useEffect } from 'react';
import { Clock, FileText, Target } from 'lucide-react';

/**
 * LogMode: 高空间利用率科研风格模板
 * 90% 不透明度背板，移除冗余导航，保留核心秩序感装饰
 */
const LogMode = ({ title, category, date, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-transparent text-[#c9d1d9] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. 环境装饰层 (极淡的背景纹理) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 微型测量网格 */}
        <div className="absolute inset-0 opacity-[0.12]" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
        />
        {/* 屏幕四角的对准刻度：保留作为科学观测窗口的视觉暗示 */}
        <div className="absolute top-10 left-10 w-20 h-20 border-l border-t border-white/10" />
        <div className="absolute top-10 right-10 w-20 h-20 border-r border-t border-white/10" />
        <div className="absolute bottom-10 left-10 w-20 h-20 border-l border-b border-white/10" />
        <div className="absolute bottom-10 right-10 w-20 h-20 border-r border-b border-white/10" />
      </div>

      {/* 2. 核心阅读区 */}
      <div className="relative z-10 max-w-5xl mx-auto pt-12 pb-32 px-4 md:px-6">
        
        {/* 💡 核心改变：90% 不透明度的稳重背板，兼顾底层模型透视与长文阅读 */}
        <article className="bg-[#050b14]/70 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl relative">
          
          {/* 四角几何锚点 */}
          <div className="absolute top-4 left-4 text-cyan-500/30"><Target size={12} /></div>
          <div className="absolute top-4 right-4 text-cyan-500/30"><Target size={12} /></div>
          <div className="absolute -bottom-10 right-0 text-[8px] text-white/10 font-bold tracking-[0.8em]">OBSERVATION_UNIT_07</div>

          {/* 顶部激光装饰线 */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* 文章头部 */}
          <header className="px-6 md:px-16 pt-12 md:pt-16 pb-8 border-b border-white/5 bg-white/[0.01]">
            <div className="space-y-8">
              <div className="flex items-center gap-4 text-[10px] tracking-[0.4em] font-bold uppercase">
                <span className="text-cyan-400/80 flex items-center gap-2">
                  <FileText size={12}/> {category}
                </span>
                <span className="text-white/30 flex items-center gap-2">
                  <Clock size={12}/> {date}
                </span>
                <div className="flex-grow h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
                <span className="text-cyan-500/40 animate-pulse hidden sm:block">DATA_DECRYPTED</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1] uppercase italic">
                {title}
              </h1>
            </div>
          </header>

          {/* 正文内容 */}
          <div className="px-6 md:px-16 py-12 md:py-16">
            <div className="prose prose-invert max-w-none 
                 text-white/90 leading-relaxed text-base md:text-lg
                 prose-headings:text-white prose-headings:tracking-widest prose-headings:uppercase
                 prose-strong:text-cyan-400 prose-code:text-cyan-300">
              {children}
            </div>
          </div>

          {/* Footer */}
          <footer className="px-6 md:px-16 py-8 bg-black/20 border-t border-white/5 flex justify-between items-center text-[9px] text-white/20 tracking-[0.5em] uppercase font-bold">
            <span>Observation_Record_Complete</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-cyan-500/40 rounded-full animate-ping" />
              <span>End_Of_Trans</span>
            </div>
          </footer>

        </article>

        {/* 底部装饰性坐标 (模仿科学仪器刻度) */}
        <div className="mt-12 flex justify-between items-center text-[7px] text-white/10 tracking-[1em] uppercase font-black px-4">
          <span>EVENT_HORIZON_MAPPING_SYSTEM</span>
          <span>COORDS: 0.000.000.1 / INF</span>
        </div>
      </div>

      {/* 极细微的全局模拟扫描线 */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.01] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px]" />
    </div>
  );
};

export default LogMode;