import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Calendar, ArrowRight, Database } from 'lucide-react';
import { BlackHoleBackground, POSTS } from '../App'; 

const LogsPage = () => {
  // 每次进入页面强制置顶
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black text-white font-mono selection:bg-cyan-500/30">
      
      {/* 1. 背景层 (与 LogLayout 保持一致) */}
      <div className="fixed inset-0 z-0 opacity-30 flex items-center justify-center pointer-events-none">
        <div className="w-full h-full transform -translate-y-[20%] md:-translate-y-[10%] scale-[1.8] md:scale-125">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 列表内容 */}
      <div className="relative z-20 max-w-4xl mx-auto pt-40 pb-32 px-6">
        
        {/* 页眉状态 */}
        <div className="mb-16 border-l-2 border-cyan-500 pl-6 py-2">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 italic">
            Archive<span className="text-cyan-500">_Index</span>
          </h1>
          <div className="flex items-center gap-4 text-[10px] tracking-[0.3em] text-white/40 uppercase font-bold">
            <span className="flex items-center gap-2"><Database size={12}/> Records: {POSTS?.length || 0}</span>
            <span className="text-white/10">|</span>
            <span className="animate-pulse text-cyan-500/60">System: Ready</span>
          </div>
        </div>

        {/* 列表项 */}
        <div className="grid gap-4">
          {POSTS && POSTS.map((post) => (
            <Link 
              key={post.id} 
              to={`/logs/${post.id}`}
              className="group relative block bg-white/[0.02] border border-white/5 p-6 md:p-8 hover:border-cyan-500/40 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden"
            >
              {/* 背景修饰 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] group-hover:bg-cyan-500/10 transition-colors" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-[9px] tracking-[0.2em] text-white/30 uppercase">
                    <span className="text-cyan-400/60">{post.category}</span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors uppercase italic">
                    {post.title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3 text-white/20 group-hover:text-cyan-400 transition-all transform group-hover:translate-x-2">
                  <span className="text-[10px] tracking-[0.4em] uppercase hidden sm:block">Open_Log</span>
                  <ArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;