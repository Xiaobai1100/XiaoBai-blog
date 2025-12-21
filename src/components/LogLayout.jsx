// src/components/LogLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import { BlackHoleBackground } from '../App'; 

const LogLayout = ({ title, category, date, children }) => {
  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* 1. 全局背景层：黑洞背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* 针对“爱因斯坦版”调整：
            -translate-y-[15%]: 将光子环中心上提到标题附近，非常帅气
            opacity-60: 稍微加深一点背景亮度，让透镜效果更明显
        */}
        <div className="w-full h-full transform -translate-y-[15%] scale-150 opacity-60">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 装饰层 */}
      <div className="fixed inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none"></div>

      {/* 3. 滚动内容层 */}
      <div className="relative z-20 w-full h-screen overflow-y-auto pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* 文章容器微调：
              bg-black/10: 改用极浅的黑色，比白色透明更深邃，更契合黑洞主题
              backdrop-blur-lg: 稍微加强模糊，保护文字阅读
          */}
          <div className="bg-black/10 backdrop-blur-lg border border-white/5 p-8 md:p-16 rounded-[2rem] shadow-2xl">
            
            {/* Header 部分 */}
            <header className="mb-12 border-b border-white/10 pb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Terminal size={12} />
                  {category === 'Announcement' ? '告示 // Announcement' : category}
                </div>
                <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-400/20 to-transparent"></div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                {title}
              </h1>

              <div className="flex justify-between items-center text-white/20 font-mono text-[9px] tracking-[0.3em] uppercase">
                <span>Timestamp: {date}</span>
                <span className="text-cyan-500/40">Status: Access_Granted</span>
              </div>
            </header>
            
            {/* 文章正文区域 */}
            <article className="prose prose-invert max-w-none">
              <div className="font-mono text-white/90 leading-relaxed text-base md:text-lg space-y-8">
                {children}
              </div>
            </article>

            {/* Footer 部分 */}
            <footer className="mt-24 pt-10 border-t border-white/5 flex flex-col items-start gap-8">
              <Link 
                to="/" 
                className="group flex items-center gap-3 text-cyan-500 font-mono text-[10px] tracking-[0.3em] hover:text-white transition-all uppercase"
              >
                <div className="w-10 h-10 rounded-full border border-cyan-500/30 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 group-hover:scale-110 transition-all duration-300">
                  <ArrowRight className="rotate-180" size={16} />
                </div>
                <span>Return_to_Central_Logs</span>
              </Link>

              <div className="w-full text-center text-white/5 font-mono text-[8px] tracking-[1em] uppercase py-4">
                - Signal Termination -
              </div>
            </footer>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-30 pointer-events-none opacity-80"></div>
    </div>
  );
};

export default LogLayout;