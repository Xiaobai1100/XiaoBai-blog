// src/components/LogLayout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BlackHoleBackground } from '../App'; 

const LogLayout = ({ title, category, date, children }) => (
  <div className="relative w-full min-h-screen bg-black text-white overflow-x-hidden">
    
    {/* 背景层：调整黑洞垂直位置 */}
    <div 
      className="fixed inset-0 z-0 opacity-40 pointer-events-none"
      style={{ 
        transform: 'translateY(-10%)', // 向上平移 10% 让它在视觉上更靠近屏幕中心
        scale: '1.2'                   // 稍微放大一点，防止边缘露馅
      }}
    >
       <BlackHoleBackground />
    </div>

    {/* 噪点装饰层 - 调低一点，避免干扰背景 */}
    <div className="fixed inset-0 z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

    {/* 内容层 */}
    <div className="relative z-20 w-full min-h-screen pt-24 pb-20 px-6 overflow-y-auto">
      {/* bg-black/10: 调低了背景颜色深度（从 60% 降到 30%）
          backdrop-blur-xl: 适度的模糊，保证文字清晰的同时透出背后的黑洞
      */}
      <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 mb-4">
             <span className="w-8 h-[1px] bg-cyan-500"></span>
             <div className="text-cyan-500 font-mono text-xs tracking-[0.3em] uppercase">
                {category === 'Announcement' ? '告示 // ANNOUNCEMENT' : category}
             </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-6 leading-tight tracking-tighter">
            {title}
          </h1>
          <div className="text-white/30 font-mono text-[10px] tracking-widest uppercase">
            TIMESTAMP: {date} // LOG_ACCESS_GRANTED
          </div>
        </div>
        
        {/* 文章正文 */}
        <div className="font-mono text-white/90 leading-relaxed text-lg space-y-6">
          {children}
        </div>

        <div className="mt-20 pt-10 border-t border-white/5">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-500 font-mono text-xs hover:gap-4 transition-all uppercase tracking-widest group">
            <ArrowRight className="rotate-180 group-hover:text-white transition-colors" size={14} /> 
            Return_to_Central_Logs
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default LogLayout;