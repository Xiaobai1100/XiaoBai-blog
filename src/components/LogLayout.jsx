// src/components/LogLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
// 确保从 App.jsx 导入最新的 BlackHoleBackground
import { BlackHoleBackground } from '../App'; 

const LogLayout = ({ title, category, date, children }) => {
  return (
    <div className="relative w-full min-h-screen bg-black text-white overflow-hidden selection:bg-cyan-500/30">
      
      {/* 1. 全局背景层：黑洞背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center">
        {/* transform -translate-y-[10%]: 将黑洞视觉中心上提，防止被页面底部的空旷感拖累
            scale-125: 稍微放大，让吸积盘铺满屏幕边缘
        */}
        <div className="w-full h-full transform -translate-y-[5%] scale-125 opacity-50">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 装饰层：极细微的噪点，增加电影感 */}
      <div className="fixed inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      {/* 3. 滚动内容层 */}
      <div className="relative z-20 w-full h-screen overflow-y-auto pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* 文章容器：采用极高透明度和中度模糊 */}
          <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 p-8 md:p-16 rounded-[2rem] shadow-2xl shadow-black/50">
            
            {/* Header 部分 */}
            <header className="mb-12 border-b border-white/5 pb-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Terminal size={12} />
                  {category === 'Announcement' ? '告示 // Announcement' : category}
                </div>
                <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tighter uppercase italic">
                {title}
              </h1>

              <div className="flex justify-between items-center text-white/30 font-mono text-[10px] tracking-widest uppercase">
                <span>Timestamp: {date}</span>
                <span>Security_Level: Unclassified</span>
              </div>
            </header>
            
            {/* 文章正文区域 */}
            <article className="prose prose-invert max-w-none">
              <div className="font-mono text-white/80 leading-relaxed text-base md:text-lg space-y-8">
                {children}
              </div>
            </article>

            {/* Footer 部分 */}
            <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col items-start gap-8">
              <Link 
                to="/" 
                className="group flex items-center gap-3 text-cyan-500 font-mono text-xs tracking-widest hover:text-white transition-all uppercase"
              >
                <div className="w-8 h-8 rounded-full border border-cyan-500/30 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 transition-all">
                  <ArrowRight className="rotate-180" size={14} />
                </div>
                Return
              </Link>

              <div className="w-full text-center text-white/10 font-mono text-[8px] tracking-[0.5em] uppercase">
                End_of_Transmission
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* 针对内容过长增加的底部遮罩 */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-30 pointer-events-none opacity-60"></div>
    </div>
  );
};

export default LogLayout;