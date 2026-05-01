import React, { useEffect } from 'react';
import { Clock, FileText, Crosshair, Target } from 'lucide-react';

/**
 * LogMode: 精密观测窗口模板 (已修复透明度与遮挡问题)
 * 特点：径向渐变聚焦、四角对准零件、动态状态指示灯、90%不透明背板
 */
const LogMode = ({ title, category, date, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    // 💡 核心修复：根容器改为透明，避免遮挡底层 App.jsx 的背景模型
    <div className="relative w-full min-h-screen bg-transparent text-[#c9d1d9] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. 环境层 (环境纹理与聚焦渐变) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* A. 基础微网格 - 提高可见度 */}
        <div className="absolute inset-0 opacity-[0.1]" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
        
        {/* B. 核心：径向渐变聚焦 - 确保中心区域最黑最干净，边缘有环境深度感 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,8,0.8)_100%)]" />

        {/* C. 屏幕边缘的装饰刻度线 */}
        <div className="absolute top-0 bottom-0 left-4 w-1 flex flex-col justify-between py-24 opacity-30">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
        <div className="absolute top-0 bottom-0 right-4 w-1 flex flex-col justify-between py-24 opacity-30">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
      </div>

      {/* 2. 核心阅读区 */}
      <div className="relative z-10 max-w-5xl mx-auto pt-12 pb-32 px-4 md:px-6">
        
        {/* 💡 正文背板 (90% 不透明度，深色稳重) */}
        <article className="bg-[#050b14]/90 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl relative">
          
          {/* --- UI 零件区 (Ornaments) --- */}
          {/* 四角对准十字 */}
          <div className="absolute top-3 left-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute top-3 right-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute bottom-3 left-3 text-cyan-500/40"><Crosshair size={14} strokeWidth={2.5} /></div>
          <div className="absolute bottom-3 right-3 text-cyan-500/40"><Target size={14} strokeWidth={2.5} /></div>
          
          {/* 装饰性坐标文本 (仅在超宽屏显示) */}
          <div className="absolute -left-10 top-0 h-full hidden xl:flex flex-col justify-center gap-20 text-[8px] text-white/10 font-bold uppercase tracking-[0.5em] rotate-180" style={{ writingMode: 'vertical-rl' }}>
            <span>Sector_Grid_Calibration</span>
            <span>Ref_Alpha_Observation</span>
          </div>

          {/* 顶部彩色激光装饰线 */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          {/* 文章头部 */}
          <header className="px-6 md:px-16 pt-12 md:pt-16 pb-8 border-b border-white/5 bg-white/[0.01]">
            <div className="space-y-8">
              {/* 状态行与指示灯 */}
              <div className="flex items-center gap-6 text-[10px] tracking-[0.4em] font-bold uppercase">
                {/* 💡 硬件风格指示灯 */}
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
                <span className="text-white/20 hidden sm:block tracking-widest text-[9px]">OBS_SYS_ONLINE</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-white leading-[1.1] uppercase italic">
                {title}
              </h1>
            </div>
          </header>

          {/* 文章正文 */}
          <div className="px-6 md:px-16 py-12 md:py-16">
            <div className="prose prose-invert max-w-none 
                 text-white/90 leading-relaxed text-base md:text-lg
                 prose-headings:text-white prose-headings:tracking-widest prose-headings:uppercase
                 prose-strong:text-cyan-400 prose-code:text-cyan-300">
              {children}
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
               <span>Stream_Telemetry_Stable</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Rec_End</span>
              <div className="w-2 h-4 bg-cyan-500/40 animate-pulse" />
            </div>
          </footer>

        </article>

        {/* 底部装饰刻度 (模拟科学仪器) */}
        <div className="mt-12 flex justify-between items-center text-[7px] text-white/10 tracking-[1em] uppercase font-black px-4">
          <span>EVENT_HORIZON_MAPPING_SYSTEM v4.0.1</span>
          <span>LAT: 35.6895 / LONG: 139.6917 / ALT: 0.0</span>
        </div>
      </div>

      {/* 极细微的全局模拟扫描线 (增强屏幕真实感) */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.01] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_2px]" />
    </div>
  );
};

export default LogMode;