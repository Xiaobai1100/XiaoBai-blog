import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const GiscusComments = () => {
  const commentRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    // 使用你获取到的真实参数
    script.setAttribute('data-repo', "Xiaobai1100/XiaoBai-blog");
    script.setAttribute('data-repo-id', "R_kgDOQsEckw");
    script.setAttribute('data-category', "Announcements");
    script.setAttribute('data-category-id', "DIC_kwDOQsEck84C0E26");
    
    script.setAttribute('data-mapping', "pathname");
    script.setAttribute('data-strict', "0");
    script.setAttribute('data-reactions-enabled', "1"); // 开启点赞/表情互动
    script.setAttribute('data-emit-metadata', "0");
    script.setAttribute('data-input-position', "bottom");
    
    // 强制使用透明暗色主题，防止白色底框破坏黑洞视觉
    script.setAttribute('data-theme', "transparent_dark"); 
    script.setAttribute('data-lang', "en");

    const currentRef = commentRef.current;
    if (currentRef) {
      currentRef.innerHTML = '';
      currentRef.appendChild(script);
    }

    return () => {
      if (currentRef) currentRef.innerHTML = '';
    };
  }, [pathname]);

  return (
    <section className="mt-20 pt-10 border-t border-white/5 font-mono">
      {/* 顶部状态条：增加仪式感 */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </div>
          <span className="text-[9px] tracking-[0.4em] text-cyan-400/60 uppercase">
            Interaction_Channel: Secure
          </span>
        </div>
        <span className="text-[8px] text-white/10 uppercase tracking-widest">
          Protocol: Giscus_v2
        </span>
      </div>

      {/* Giscus 评论组件载体 */}
      <div ref={commentRef} className="giscus-frame" />
      
      {/* 底部装饰线 */}
      <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
};

export default GiscusComments;