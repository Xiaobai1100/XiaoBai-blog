import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, AlertTriangle } from 'lucide-react';
import { BlackHoleBackground } from '../App'; 
import GiscusComments from './GiscusComments';

const LogLayout = ({ title, category, date, children, isError = false }) => {
  const isVoid = isError || !children;

  return (
    /* 核心布局方案：
       1. 去掉 h-screen 和 overflow-y-auto，将滚动权交给全局 window。
       2. 确保 NavBar 的滚动监听逻辑能被触发。
    */
    <div className="relative w-full min-h-screen bg-black text-white font-mono selection:bg-cyan-500/30">
      
      {/* 1. 全局背景层：使用 fixed 固定黑洞位置 */}
      <div className={`fixed inset-0 z-0 pointer-events-none flex items-center justify-center transition-all duration-1000 
        ${isVoid ? 'grayscale-[100%] contrast-[150%] brightness-[60%] blur-[4px]' : 'opacity-40'}`}>
        
        {/* 针对移动端视觉重心优化的 transform：
            -translate-y-[20%]: 手机端黑洞中心上提，防止落在屏幕底部。
            scale-[1.8]: 手机端横向完全覆盖。
        */}
        <div className="w-full h-full transform -translate-y-[20%] md:-translate-y-[10%] scale-[1.8] md:scale-125">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 环境纹理层：固定噪点 */}
      <div className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-1000 
        ${isVoid ? 'opacity-20' : 'opacity-[0.03]'} bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`}>
      </div>

      {/* 3. 滚动内容区 */}
      <div className="relative z-20 w-full pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* 内容毛玻璃背板 */}
          <div className={`backdrop-blur-md border transition-all duration-700 
            p-6 sm:p-10 md:p-16 rounded-2xl md:rounded-[2rem] shadow-2xl
            ${isVoid ? 'bg-black/40 border-white/5' : 'bg-white/[0.02] border-white/10'}`}>
            
            {!isVoid ? (
              <>
                {/* 文章头部 */}
                <header className="mb-8 md:mb-12 border-b border-white/5 pb-6 md:pb-10">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="px-2 md:px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 text-[9px] md:text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                      <Terminal size={12} /> {category}
                    </div>
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                  </div>
                  
                  <h1 className="text-2xl sm:text-4xl md:text-6xl font-black mb-6 md:mb-8 leading-tight tracking-tighter uppercase italic break-words">
                    {title}
                  </h1>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[9px] md:text-[10px] tracking-[0.3em] uppercase mt-4">
                    <span className="text-white/60 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      Timestamp: {date}
                    </span>
                    <span className="text-cyan-400/80 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      Status: Access_Granted
                    </span>
                  </div>
                </header>

                {/* 文章主体 */}
                <article className="prose prose-invert max-w-none text-white/80 leading-relaxed text-sm sm:text-base md:text-lg space-y-6 md:space-y-8">
                  {children}
                </article>

                {/* --- 新增：Giscus 互动区 --- */}
                <GiscusComments />
              </>
            ) : (
              /* 404 错误状态视图 */
              <div className="text-left py-6 md:py-10">
                <div className="inline-block border border-white/10 bg-white/5 px-3 py-1 mb-8 rounded-sm">
                  <span className="text-white/30 text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] uppercase flex items-center gap-2">
                    <AlertTriangle size={12} /> Signal_Interrupted // 404
                  </span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-light mb-6 md:mb-8 tracking-[0.1em] md:tracking-[0.15em] uppercase text-white/90">
                  Void <span className="opacity-20 block sm:inline mt-2 sm:mt-0">Space</span>
                </h1>
                
                <div className="space-y-3 md:space-y-4 text-[9px] md:text-xs tracking-widest uppercase text-white/30 leading-relaxed border-l border-white/10 pl-4 md:pl-6">
                  <p>Target: Beyond_Observation</p>
                  <p>Status: Disconnected</p>
                </div>
              </div>
            )}

            {/* 页脚返回按钮 */}
            <footer className="mt-16 pt-10 border-t border-white/5">
              <Link 
                to="/logs" 
                className={`group flex items-center gap-3 text-[9px] md:text-[10px] tracking-[0.3em] transition-all uppercase font-bold
                ${isVoid ? 'text-white/40 hover:text-white' : 'text-cyan-500 hover:text-white'}`}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all duration-300 
                  ${isVoid ? 'border-white/10 group-hover:border-white' : 'border-cyan-500/30 group-hover:border-white group-hover:bg-white/10'}`}>
                  <ArrowRight className="rotate-180" size={14} />
                </div>
                <span>{isVoid ? 'Reset_Connection' : 'Return'}</span>
              </Link>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LogLayout;