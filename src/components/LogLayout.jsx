// src/components/LogLayout.jsx
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const LogLayout = ({ title, category, date, children }) => (
  <div className="relative w-full min-h-screen bg-black text-white pt-32 pb-20 px-6 overflow-y-auto">
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <div className="text-cyan-500 font-mono text-xs tracking-widest mb-4 uppercase">[{category}]</div>
        <h1 className="text-4xl md:text-6xl font-black uppercase mb-6 leading-tight">{title}</h1>
        <div className="text-white/40 font-mono text-xs italic">{date} // LOG_VERIFIED</div>
      </div>
      
      {/* 文章正文 */}
      <div className="font-mono text-white/80 leading-relaxed text-lg space-y-6">
        {children}
      </div>

      <Link to="/" className="inline-flex items-center gap-2 mt-20 text-cyan-500 font-mono text-sm hover:gap-4 transition-all uppercase">
        <ArrowRight className="rotate-180" size={16} /> Back_to_Logs
      </Link>
    </div>
  </div>
);

export default LogLayout;