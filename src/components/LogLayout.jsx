import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Crosshair, Target, ArrowRight } from 'lucide-react';
import { BlackHoleBackground } from '../App'; 
import GiscusComments from './GiscusComments';

/**
 * LogLayout: 精密观测窗口模板 (融合了底层 WebGL 黑洞背景 + 四角准星 + Giscus 评论系统)
 */
const LogLayout = ({ title, category, date, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black text-[#c9d1d9] font-mono selection:bg-cyan-500/30 overflow-x-hidden">
      
      {/* 1. 底层 WebGL 连续流体黑洞背景 (阅读模式微光) */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-45">
        <BlackHoleBackground mode="article" />
      </div>

      {/* 2. 环境层 (环境纹理与聚焦渐变) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* A. 基础微网格 */}
        <div className="absolute inset-0 opacity-[0.08]" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />
        
        {/* B. 径向渐变聚焦 - 确保中心阅读区域最沉稳干净 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,4,8,0.88)_100%)]" />

        {/* C. 屏幕左右边缘的纯粹装饰刻度线 */}
        <div className="hidden sm:flex absolute top-0 bottom-0 left-4 w-1 flex-col justify-between py-24 opacity-25">
          {[...Array(12)].map((_, i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
        <div className="hidden sm:flex absolute top-0 bottom-0 right-4 w-1 flex-col justify-between py-24 opacity-25">
          {[...Array(12)].map((_, i) => <div key={i} className="w-full h-[1.5px] bg-white/40" />)}
        </div>
      </div>

      {/* 3. 核心阅读区 (pt-24 确保避开顶部固定导航栏) */}
      <div className="relative z-10 max-w-5xl mx-auto pt-24 md:pt-28 pb-32 px-4 md:px-6">
        
        {/* 正文背板 */}
        <article className="bg-[#050b14]/90 backdrop-blur-xl border border-white/10 rounded-sm shadow-[0_0_60px_rgba(0,0,0,0.8)] relative">
          
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
              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-[10px] tracking-[0.3em] md:tracking-[0.4em] font-bold uppercase">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded border border-white/5 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" style={{ animationDelay: '0.4s' }} />
                </div>

                <span className="text-cyan-400/90 flex items-center gap-2">
                  <FileText size={12}/> {category}
                </span>
                <span className="text-white/40 flex items-center gap-2">
                  <Clock size={12}/> {date}
                </span>
                <div className="flex-grow h-[1px] bg-white/5 hidden sm:block" />
                <span className="text-white/20 hidden sm:block tracking-widest text-[9px]">SYSTEM_STABLE</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.12] uppercase italic">
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

            {/* 直接渲染 GiscusComments (它自身已带有顶部分割线和状态抬头，不再重复包裹) */}
            <GiscusComments />
          </div>

          {/* 底部页脚 (补回了返回 /logs 的交互按钮) */}
          <footer className="px-6 md:px-16 py-8 bg-black/40 border-t border-white/5 flex justify-between items-center text-[9px] text-white/30 tracking-[0.4em] uppercase font-bold">
            <Link 
              to="/logs" 
              className="group flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase font-black text-cyan-400 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all">
                <ArrowRight className="rotate-180" size={14} />
              </div>
              <span>Return_To_Logs</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Stream_Active // Rec_End</span>
              <div className="w-2 h-4 bg-cyan-500/40 animate-pulse" />
            </div>
          </footer>

        </article>
      </div>
    </div>
  );
};

export default LogLayout;