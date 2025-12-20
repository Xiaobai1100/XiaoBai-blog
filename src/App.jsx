import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Github, Terminal, ChevronDown, FlaskConical, Boxes } from 'lucide-react';

// 引入页面组件
import Home from './pages/Home';
import BlackHoleModel from './pages/BlackHoleModel';

// 全局导航栏组件
const NavBar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 text-white mix-blend-difference pointer-events-none">
      
      {/* 1. 左侧 Logo */}
      <Link to="/" className="flex items-center gap-3 cursor-pointer group no-underline pointer-events-auto">
        <div className="w-8 h-8 flex items-center justify-center border border-white group-hover:bg-white group-hover:text-black transition-colors">
          <Terminal size={16} />
        </div>
        <div className="flex flex-col text-white">
          <span className="text-lg font-bold tracking-widest leading-none">XIAOBAI</span>
          <span className="text-[10px] tracking-[0.3em] opacity-70 group-hover:text-cyan-400 transition-colors">SAMA</span>
        </div>
      </Link>

      {/* 2. 中间导航菜单 */}
      <div className="hidden md:flex gap-12 text-xs font-mono tracking-widest items-center pointer-events-auto">
        <Link to="/" className="hover:text-cyan-400 transition-colors">HOME</Link>
        
        {/* === MODELS 下拉菜单 === */}
        <div className="relative group h-full">
          <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4 focus:outline-none">
            MODELS <ChevronDown size={12} />
          </button>

          {/* 下拉内容 */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[200px] pt-0">
            <div className="bg-black/90 border border-white/20 backdrop-blur-xl flex flex-col p-1 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              
              <Link 
                to="/models/black-hole" 
                className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-cyan-300 hover:bg-white/10 transition-colors text-left group/item"
              >
                <div className="w-1 h-1 bg-cyan-500 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity" />
                // BLACK HOLE
              </Link>
              
              <div className="flex items-center gap-3 px-4 py-3 text-white/30 cursor-not-allowed text-left">
                <Boxes size={12} />
                // THREE BODY (WIP)
              </div>

              <div className="flex items-center gap-3 px-4 py-3 text-white/30 cursor-not-allowed text-left">
                <FlaskConical size={12} />
                // FLUID SIM (WIP)
              </div>

            </div>
          </div>
        </div>

        <Link to="/lab" className="hover:text-cyan-400 transition-colors">LAB</Link>
      </div>

      {/* 3. 右侧 GitHub */}
      <a 
        href="https://github.com/Xiaobai1100/XiaoBai-blog" 
        target="_blank" 
        rel="noopener noreferrer"
        className="pointer-events-auto border border-white/30 px-6 py-2 text-[10px] tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center gap-2"
      >
        <Github size={14} /> GITHUB
      </a>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models/black-hole" element={<BlackHoleModel />} />
        <Route path="*" element={
          <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center font-mono z-50 relative">
            <h1 className="text-6xl font-bold text-red-500 mb-4 animate-pulse">404</h1>
            <Link to="/" className="mt-8 border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition-colors">
              RETURN TO BASE
            </Link>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;