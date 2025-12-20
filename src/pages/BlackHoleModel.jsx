import React from 'react';

const BlackHoleModel = () => {
  return (
    // 给顶部留出一点 padding-top (pt-20)，避免 iframe 内容被全局导航栏遮挡太严重
    // 或者保持全屏，我们在 HTML 里调整内部 UI 位置
    <div className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* 纯净的 iframe，去掉了多余的 React 按钮 */}
      <iframe 
        src="/blackhole.html" 
        title="Black Hole Simulation"
        className="w-full h-full border-0 block"
        style={{ backgroundColor: 'black' }}
      />
      
    </div>
  );
};

export default BlackHoleModel;