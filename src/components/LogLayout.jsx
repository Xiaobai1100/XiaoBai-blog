// src/components/LogLayout.jsx
const LogLayout = ({ title, category, date, children }) => (
  <div className="relative w-full min-h-screen bg-black text-white overflow-hidden">
    
    {/* 背景层：将黑洞固定在视觉中心 */}
    <div className="fixed inset-0 z-0 opacity-50 pointer-events-none flex items-center justify-center">
       {/* 向上平移 15% 抵消顶部标题的视觉压迫感 */}
       <div className="w-full h-full transform -translate-y-[15%] scale-125">
          <BlackHoleBackground />
       </div>
    </div>

    {/* 内容层：调高透明度，让背后的吸积盘粒子清晰可见 */}
    <div className="relative z-20 w-full min-h-screen pt-32 pb-20 px-6 overflow-y-auto">
      {/* bg-black/20: 极高的透明度
          backdrop-blur-md: 降低模糊强度，让背景不再是模糊的一团
      */}
      <div className="max-w-3xl mx-auto bg-black/20 backdrop-blur-md border border-white/5 p-8 md:p-12 rounded-2xl shadow-2xl">
        {/* ... 原有文字内容保持不变 ... */}
      </div>
    </div>
  </div>
);