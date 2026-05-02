import React, { useEffect } from 'react';
import { Clock, FileText, Crosshair, Target } from 'lucide-react';
// 💡 关键修复：重新引入你本地已经配置好 ID 的评论组件！
import GiscusComments from './GiscusComments';

/**
 * LogMode: 精密观测窗口模板
 */
const LogMode = ({ title, category, date, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // 根容器保持透明，透出底层 WebGL 背景
    <div className="relative w-full min-h-screen bg-transparent text-[#c9d1d9] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. 环境层 (环境纹理与聚焦渐变) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* A. 基础微网格 */}
        <div className="absolute inset-0 opacity-[0.1]" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
        
        {/* B. 核心：径向渐变聚焦 - 确保中心区域最黑最干净 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,8,0.85)_100%)]" />

        {/* C. 屏幕左右边缘的纯粹装饰刻度线 */}
        <div className="absolute top-0 bottom-0 left-4 w-1 flex flex-col justify-between py-24 opacity-30">
          {[...Array(12)].map((_, i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
        <div className="absolute top-0 bottom-0 right-4 w-1 flex flex-col justify-between py-24 opacity-30">
          {[...Array(12)].map((_, i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
      </div>

      {/* 2. 核心阅读区 */}
      <div className="relative z-10 max-w-5xl mx-auto pt-12 pb-32 px-4 md:px-6">
        
        {/* 正文背板 (90% 不透明度) */}
        <article className="bg-[#050b14]/90 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl relative">
          
          {/* 四角对准十字零件 */}
          <div className="absolute top-3 left-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute top-3 right-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute bottom-3 left-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute bottom-3 right-3 text-cyan-500/40"><Target size={14} strokeWidth={2.5} /></div>
          
          {/* 顶部激光装饰线 */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* 文章头部 */}
          <header className="px-6 md:px-16 pt-12 md:pt-16 pb-8 border-b border-white/5 bg-white/[0.01]">
            <div className="space-y-8">
              {/* 状态行与指示灯 */}
              <div className="flex items-center gap-6 text-[10px] tracking-[0.4em] font-bold uppercase">
                {/* 硬件风格指示灯 */}
                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded border border-white/5 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" style={{ animationDelay: '0.4s' }} />
                </div>

                <span className="text-cyan-400/80 flex items-center gap-2">
                  <FileText size={12}/> {category}
                </span>
                <span className="text-white/30 flex items-center gap-2">
                  <Clock size={12}/> {date}
                </span>
                <div className="flex-grow h-[1px] bg-white/5" />
                <span className="text-white/20 hidden sm:block tracking-widest text-[9px]">SYSTEM_STABLE</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1] uppercase italic">
                {title}
              </h1>
            </div>
          </header>

          {/* 文章正文区域 */}
          <div className="px-6 md:px-16 py-12 md:py-16">
            <div className="prose prose-invert max-w-none 
                 text-white/90 leading-relaxed text-base md:text-lg
                 prose-headings:text-white prose-headings:tracking-widest prose-headings:uppercase
                 prose-strong:text-cyan-400 prose-code:text-cyan-300">
              {children}
            </div>

            {/* --- 评论区 --- */}
            <div className="mt-24 pt-12 border-t border-white/10">
              <div className="mb-10 flex items-center gap-4">
                <div className="px-3 py-1 bg-white/5 border border-white/10 text-[10px] text-white/40 tracking-[0.3em] uppercase">
                  Discussion_Thread
                </div>
                <div className="flex-grow h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
              </div>
              
              {/* 💡 直接渲染你本地的评论组件 */}
              <GiscusComments />
              
            </div>
          </div>

          {/* 底部页脚 */}
          <footer className="px-6 md:px-16 py-8 bg-black/30 border-t border-white/5 flex justify-between items-center text-[9px] text-white/20 tracking-[0.5em] uppercase font-bold">
            <div className="flex items-center gap-4">
               <div className="flex gap-1">
                 <div className="w-1 h-3 bg-cyan-500/20" />
                 <div className="w-1 h-3 bg-cyan-500/40" />
                 <div className="w-1 h-3 bg-cyan-500/60 animate-pulse" />
               </div>
               <span>Stream_Active</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Rec_End</span>
              <div className="w-2 h-4 bg-cyan-500/40 animate-pulse" />
            </div>
          </footer>

        </article>
      </div>

      {/* 极细微的全局模拟扫描线 */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.01] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px]" />
    </div>
  );
};

export default LogMode;