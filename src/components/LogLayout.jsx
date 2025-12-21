// src/components/LogLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
// 1. 引入刚才导出的黑洞
import { BlackHoleBackground } from '../App'; 

const LogLayout = ({ title, category, date, children }) => (
  <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
    
    {/* 2. 背景层：放置黑洞并控制透明度 */}
    <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
       <BlackHoleBackground />
    </div>

    {/* 3. 噪点装饰层 */}
    <div className="fixed inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

    {/* 内容层：增加毛玻璃效果 (backdrop-blur) 使文字清晰 */}
    <div className="relative z-20 w-full min-h-screen pt-32 pb-20 px-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-black/60 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-lg">
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="text-cyan-500 font-mono text-xs tracking-[0.3em] mb-4 uppercase">
            {category === 'Announcement' ? '告示 // ANNOUNCEMENT' : category}
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-6 tracking-tighter">
            {title}
          </h1>
          <div className="text-white/20 font-mono text-[10px]">
            {date} // Back
          </div>
        </div>
        
        <div className="font-mono text-white/90 leading-relaxed text-lg space-y-6">
          {children}
        </div>

        <div className="mt-20 pt-10 border-t border-white/5">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-500 font-mono text-xs hover:gap-4 transition-all">
            <ArrowRight className="rotate-180" size={14} /> BACK_TO_CENTRAL_LOGS
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default LogLayout;