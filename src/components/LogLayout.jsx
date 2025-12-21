// src/components/LogLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal, AlertTriangle } from 'lucide-react';
import { BlackHoleBackground } from '../App'; 

const LogLayout = ({ title, category, date, children, isError = false }) => {
  // 逻辑判定：如果没有传入 children 或者显式指定 isError，则进入 Void 模式
  const isVoid = isError || !children;

  return (
    <div className={`relative w-full min-h-screen bg-black text-white overflow-hidden transition-colors duration-1000 font-mono`}>
      
      {/* 1. 全局背景层：自动切换彩色/黑白 */}
      <div className={`fixed inset-0 z-0 pointer-events-none flex items-center justify-center transition-all duration-1000 
        ${isVoid ? 'grayscale-[100%] contrast-[150%] brightness-[60%] blur-[4px]' : 'opacity-50'}`}>
        {/* 向上平移 10% 让黑洞处于视觉中心 */}
        <div className="w-full h-full transform -translate-y-[10%] scale-125">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 电影感噪点层 */}
      <div className={`fixed inset-0 z-10 pointer-events-none transition-opacity duration-1000 
        ${isVoid ? 'opacity-20' : 'opacity-[0.03]'} bg-[url('https://grainy-gradients.vercel.app/noise.svg')]`}>
      </div>

      {/* 3. 内容滚动容器 */}
      <div className="relative z-20 w-full h-screen overflow-y-auto pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* 毛玻璃背板 */}
          <div className={`backdrop-blur-md border p-8 md:p-16 rounded-[2rem] shadow-2xl transition-all duration-700 
            ${isVoid ? 'bg-black/40 border-white/5' : 'bg-white/[0.02] border-white/10'}`}>
            
            {/* --- 模式 A: 正常文章 --- */}
            {!isVoid ? (
              <>
                <header className="mb-12 border-b border-white/5 pb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                      <Terminal size={12} /> {category}
                    </div>
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter uppercase italic">
                    {title}
                  </h1>
                  
                  {/* 修正后的状态文字：调高了对比度 */}
                  <div className="flex justify-between items-center text-[10px] tracking-[0.3em] uppercase mt-4">
                    <span className="text-white/60 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      Timestamp: {date}
                    </span>
                    <span className="text-cyan-400/80 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      Status: Access_Granted
                    </span>
                  </div>
                </header>

                <article className="prose prose-invert max-w-none text-white/80 leading-relaxed text-lg space-y-8">
                  {children}
                </article>
              </>
            ) : (
              /* --- 模式 B: Void Space 错误 --- */
              <div className="text-left py-10">
                <div className="inline-block border border-white/10 bg-white/5 px-4 py-1 mb-10 rounded-sm">
                  <span className="text-white/30 text-[9px] tracking-[0.4em] uppercase flex items-center gap-2">
                    <AlertTriangle size={12} /> Signal_Interrupted // 404
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-light mb-8 tracking-[0.15em] uppercase text-white/90">
                  Void<span className="opacity-20">Space</span>
                </h1>
                
                <div className="space-y-4 text-[10px] md:text-xs tracking-widest uppercase text-white/30 leading-relaxed border-l border-white/10 pl-6">
                  <p>Target_Coordinates: Beyond_Observation</p>
                  <p>Packet_Loss_Rate: 100.00%</p>
                  <p>Status: Disconnected_From_Singularity</p>
                </div>
              </div>
            )}

            {/* 公共底部 */}
            <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col items-start gap-8">
              <Link 
                to="/" 
                className={`group flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] transition-all uppercase 
                ${isVoid ? 'text-white/40 hover:text-white' : 'text-cyan-500 hover:text-white'}`}
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 
                  ${isVoid ? 'border-white/10 group-hover:border-white' : 'border-cyan-500/30 group-hover:border-white group-hover:bg-white/10'}`}>
                  <ArrowRight className="rotate-180" size={14} />
                </div>
                {isVoid ? 'Reset_Connection' : 'Return_to_Archive'}
              </Link>
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LogLayout;