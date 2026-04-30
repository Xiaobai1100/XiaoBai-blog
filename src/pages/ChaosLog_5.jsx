import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// 1. 正常导入 Layout 组件 (复制到本地时请取消注释)
// =========================================================
import LogLayout from '../components/LogLayout';

// =========================================================
// 2. 正常导入本地真实图片 (对应你上传的手写/教材图)
// =========================================================
import figButterfly from '../assets/Figure_14.png'; 
import figStructure from '../assets/Figure_15.png';
import figDelta from '../assets/Figure_16.png';
import figSlope from '../assets/Figure_17.png';

// 预览环境临时变量 (复制到本地且取消上方注释后，可删除这段临时链接)
const figButterfly = "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=800";
const figStructure = "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&q=80&w=800";
const figDelta = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800";
const figSlope = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800";

// =========================================================
// 🛡️ 静态资源隔离区 (公式库)
// =========================================================
const FORMULAS = {
  rH: "r_H = \\frac{\\sigma(\\sigma+b+3)}{\\sigma-b-1} \\approx 24.74",
  lyapunovExp: "||\\delta(t)|| \\sim ||\\delta_0|| e^{\\lambda t}",
  lyapunovVec: "\\delta_k(t) \\sim \\delta_k(0)e^{\\lambda_k t}",
  horizon1: "||\\delta(t)|| \\sim ||\\delta_0|| e^{\\lambda t_{horizon}} = a",
  horizon2: "\\implies t_{horizon} = \\frac{1}{\\lambda} \\ln \\frac{a}{||\\delta_0||}",
  horizon3: "\\implies t_{horizon} \\sim \\mathcal{O}\\left( \\frac{1}{\\lambda} \\ln \\frac{a}{||\\delta_0||} \\right)",
  simpleEq: "\\dot{x} = x",
  simpleSol: "x(t) = x_0 e^t"
};

// =========================================================
// 🛡️ 错误边界防御系统
// =========================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { this.setState({ errorInfo }); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen bg-[#0d1117] text-white p-10 font-mono">
        <h2 className="text-purple-400 mb-4">⚠️ System Crash</h2>
        <pre className="text-xs">{this.state.error?.toString()}</pre>
      </div>
    );
    return this.props.children;
  }
}

// =========================================================
// 组件: 数学渲染器
// =========================================================
const MathDisplay = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      window.katex.render(tex, container.current, { throwOnError: false, displayMode: true });
    }
  }, [tex, katexReady]);
  return <div ref={container} className="my-8 py-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner overflow-x-auto text-center"></div>;
};

const InlineMath = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      window.katex.render(tex, container.current, { throwOnError: false, displayMode: false });
    }
  }, [tex, katexReady]);
  return <span ref={container} className="mx-1 font-serif text-purple-200/90">{`$${tex}$`}</span>;
};

// =========================================================
// 终极组件: 3D Lorenz 奇异吸引子无损交互全息引擎 
// =========================================================
const LorenzAttractor3D = () => {
  const [sigma, setSigma] = useState(10);
  const [r, setR] = useState(28);
  const [b, setB] = useState(2.667);
  const [zoom, setZoom] = useState(10);
  
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const animRef = useRef();

  // 摄像机状态使用 useRef 以彻底避免 React 重新渲染打断动画
  const rotationRef = useRef({ pitch: 0.2, yaw: 0.5 });
  const zoomRef = useRef(10);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  // 同步滑块的缩放值到摄像机底层
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // 当物理参数 (sigma, r, b) 改变时，才重置轨迹
  useEffect(() => {
    pointsRef.current = [{ x: 0.1, y: 0.1, z: 0.1 }];
  }, [sigma, r, b]);

  // 鼠标交互事件
  const handleMouseDown = (e) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    
    rotationRef.current.yaw += deltaX * 0.008;
    rotationRef.current.pitch += deltaY * 0.008;
    
    // 限制俯仰角，防止画面翻转颠倒
    rotationRef.current.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationRef.current.pitch));
    
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => { isDragging.current = false; };

  // 核心独立渲染循环 (只依赖于底层参数)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // 💡 修复高清屏模糊问题 (Retina Display Fix)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const rectWidth = rect.width || 800;
    const rectHeight = rect.height || 450;
    canvas.width = rectWidth * dpr;
    canvas.height = rectHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const dt = 0.006;
    const stepsPerFrame = 6;
    const maxPoints = 4000; // 保存足够长的轨迹以形成完美的蝴蝶

    let isCancelled = false;

    const render = () => {
      if (isCancelled) return;
      // 注意这里使用 rectWidth/rectHeight 而不是 canvas.width/height
      const cx = rectWidth / 2;
      const cy = rectHeight / 2;

      // 1. 使用纯色清空画布
      ctx.fillStyle = '#050b14'; 
      ctx.fillRect(0, 0, rectWidth, rectHeight);

      // 2. 自动旋转逻辑 (当没有拖拽时，匀速自转)
      if (!isDragging.current) {
        rotationRef.current.yaw += 0.003; 
      }

      // 3. 读取底层物理状态与摄像机状态
      let pts = pointsRef.current;
      const { pitch, yaw } = rotationRef.current;
      const currentZoom = zoomRef.current;

      // 4. 微分方程数值积分 (Euler 法)
      let lastP = pts[pts.length - 1];
      for (let i = 0; i < stepsPerFrame; i++) {
        const dx = sigma * (lastP.y - lastP.x) * dt;
        const dy = (lastP.x * (r - lastP.z) - lastP.y) * dt;
        const dz = (lastP.x * lastP.y - b * lastP.z) * dt;
        lastP = { x: lastP.x + dx, y: lastP.y + dy, z: lastP.z + dz };
        pts.push(lastP);
      }
      
      // 💡 修复内存/CPU性能放血点 (使用 slice 替代 splice)
      if (pts.length > maxPoints) {
          pts = pts.slice(pts.length - maxPoints);
          pointsRef.current = pts; 
      }

      // 5. 带有透视的 3D 投影 (Perspective Projection)
      const project = (p) => {
        const tx = p.x;
        const ty = p.y;
        const tz = p.z - (r - 1); // 将Z轴中心偏置，使得旋转中心在吸引子内部

        // Pitch 旋转 (上下)
        const y1 = ty * Math.cos(pitch) - tz * Math.sin(pitch);
        const z1 = ty * Math.sin(pitch) + tz * Math.cos(pitch);
        // Yaw 旋转 (左右)
        const x2 = tx * Math.cos(yaw) + z1 * Math.sin(yaw);
        const z2 = -tx * Math.sin(yaw) + z1 * Math.cos(yaw); 

        // 透视除法
        const perspective = 30 / (30 - z2 * 0.5); 
        const scale = currentZoom * perspective;

        return { sx: cx + x2 * scale, sy: cy - y1 * scale, depth: z2 };
      };

      // 6. 绘制长尾发光轨迹
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      
      const gradient = ctx.createLinearGradient(0, 0, rectWidth, rectHeight);
      gradient.addColorStop(0, '#a855f7'); // Purple
      gradient.addColorStop(0.5, '#ec4899'); // Pink
      gradient.addColorStop(1, '#0ea5e9'); // Cyan
      ctx.strokeStyle = gradient;

      for (let i = 0; i < pts.length; i++) {
        const sp = project(pts[i]);
        if (i === 0) ctx.moveTo(sp.sx, sp.sy);
        else ctx.lineTo(sp.sx, sp.sy);
      }
      
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#a855f7';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 7. 绘制引导点
      const head = project(pts[pts.length - 1]);
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffffff';
      ctx.arc(head.sx, head.sy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      isCancelled = true;
      cancelAnimationFrame(animRef.current);
    };
  }, [sigma, r, b]); // 严格限制依赖，缩放和拖拽绝不打断动画！

  return (
    <div className="my-10 p-6 md:p-8 bg-black/60 border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="flex flex-col gap-6 items-center">
        
        {/* 全息交互视窗 */}
        <div 
          className="relative w-full aspect-video max-w-[800px] bg-[#050b14] rounded-xl border border-white/5 shadow-inner overflow-hidden flex items-center justify-center cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => handleMouseDown(e.touches[0])}
          onTouchMove={(e) => handleMouseMove(e.touches[0])}
          onTouchEnd={handleMouseUp}
        >
          <canvas ref={canvasRef} className="w-full h-full touch-none" />
          <div className="absolute top-4 left-4 text-[10px] text-white/40 uppercase tracking-widest font-bold">Interactive: Lorenz Strange Attractor</div>
          <div className="absolute bottom-4 right-4 text-[10px] text-purple-400/60 uppercase tracking-widest animate-pulse">Drag anywhere to Rotate</div>
        </div>

        {/* 控制面板 */}
        <div className="w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Zoom Scale:</span><span className="text-purple-300">{zoom.toFixed(1)}x</span>
            </div>
            <input type="range" min="3" max="25" step="0.1" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Prandtl [σ]:</span><span className="text-purple-300">{sigma.toFixed(1)}</span>
            </div>
            <input type="range" min="1" max="20" step="0.1" value={sigma} onChange={e => setSigma(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Rayleigh [r]:</span><span className="text-purple-300">{r.toFixed(1)}</span>
            </div>
            <input type="range" min="1" max="50" step="0.1" value={r} onChange={e => setR(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner space-y-2">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Geometry [b]:</span><span className="text-purple-300">{b.toFixed(3)}</span>
            </div>
            <input type="range" min="1" max="5" step="0.001" value={b} onChange={e => setB(parseFloat(e.target.value))} className="w-full accent-purple-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>

      </div>
    </div>
  );
};


// =========================================================
// 页面主逻辑
// =========================================================
const ChaosLogFinale = () => {
  const [katexReady, setKatexReady] = useState(false);

  useEffect(() => {
    if (!document.getElementById('katex-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'katex-cdn-css'; link.rel = 'stylesheet'; 
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
    if (window.katex) {
      setKatexReady(true);
    } else if (!document.getElementById('katex-cdn-js')) {
      const script = document.createElement('script');
      script.id = 'katex-cdn-js';
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = () => setKatexReady(true);
      document.head.appendChild(script);
    }
  }, []);

  return (
    <LogLayout title="CHAOS 5: CHAOS & STRANGE ATTRACTOR" category="RESEARCH" date="2026-05-01">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        {/* 1. Chaos on Strange Attractor */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Chaos on a Strange Attractor</h3>
          <p>
            Lorenz studied the particular case where (<InlineMath tex="\sigma = 10, b = 8/3, r = 28" katexReady={katexReady}/>). 
          </p>
          <MathDisplay tex={FORMULAS.rH} katexReady={katexReady} />
          <p>
            Since <InlineMath tex="r = 28 > r_H" katexReady={katexReady}/>, the system is past the subcritical Hopf bifurcation. 
            He began integrating from the initial condition <InlineMath tex="(0, 1, 0)" katexReady={katexReady}/> and plotted <InlineMath tex="y(t)" katexReady={katexReady}/> versus <InlineMath tex="t" katexReady={katexReady}/>.
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figButterfly} 
              alt="x-z projection butterfly" 
              className="w-full h-auto object-contain mx-auto opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. The <InlineMath tex="x-z" katexReady={katexReady}/> projection of the Lorenz attractor forms the iconic butterfly pattern.
            </figcaption>
          </figure>

          <p>
            And if we plot <InlineMath tex="x(t)" katexReady={katexReady}/> vs <InlineMath tex="z(t)" katexReady={katexReady}/>, it appears the famous butterfly pattern. 
            However, note that the trajectory isn't truly 2-D; it is a 2-D projection of the 3D trajectory.
            When we look for this thin set that covers the 3D trajectory, it looks like a pair of butterfly wings, and it is defined as a <strong>Strange Attractor</strong>.
          </p>
        </section>

        {/* 2. Geometrical Structure */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. The Geometrical Structure of the Strange Attractor</h3>
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figStructure} 
              alt="Strange Attractor Geometry" 
              className="max-w-[500px] w-full h-auto object-contain mx-auto opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. The topological structure of the strange attractor, showing how trajectories fold over themselves.
            </figcaption>
          </figure>

          <p>
            But how does this occur? To transport particles from right to left & back, it happens on the bottom of the whole structure. If we cut the strange attractor at any position, it will look like:
            <br/><br/>
            <strong>Like a Cantor set:</strong> layers upon layers of lines separated by voids, continuing infinitely.
          </p>
          
          <p>
            That actually is a <strong>Cantor set</strong>, which means the whole strange attractor is formed by a <strong>fractal</strong>, and its dimension is actually not 3, but approximately <strong>2.05</strong>.
          </p>

          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-purple-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]">
            <h4 className="text-purple-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: Mille-feuille and the Birth of the 2.05th Dimension</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              Under the inescapable fate of volume contraction, the Lorenz system must also guarantee that trajectories never intersect (due to the Uniqueness Theorem). It can only squeeze infinitely long trajectories into a finite space through continuous "stretching and folding."
              <br/><br/>
              The direction along the flow is 1 dimension, the width of the spread wings is 1 dimension, and the thickness of the Cantor dust—which you see after a "vertical slice" and which still has gaps even when magnified infinitely—contributes about 0.05 dimensions. This is the intuitive origin of the 2.05-dimensional fractal geometry.
            </p>
          </div>
        </section>

        {/* 3. Exponential Divergence */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Exponential Divergence of Nearby Trajectories</h3>
          <p>
            This motion on attractors exhibits <strong>sensitive dependence on initial conditions</strong>. 
            Two very close trajectories will rapidly diverge from each other & totally differ in the future (e.g., the butterfly effect).
          </p>
          
          <p>
            To make it more precise, assume <InlineMath tex="\mathbf{x}(t)" katexReady={katexReady}/> is a point on the attractor at <InlineMath tex="t" katexReady={katexReady}/>. Consider a nearby point <InlineMath tex="\mathbf{x}(t) + \delta(t)" katexReady={katexReady}/>. <InlineMath tex="\delta" katexReady={katexReady}/> is a tiny separation vector of initial length <InlineMath tex="||\delta_0|| = 10^{-15}" katexReady={katexReady}/>.
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figDelta} 
              alt="Separation Vector delta" 
              className="max-w-[400px] w-full h-auto object-contain mx-auto opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 3. A tiny initial separation vector <InlineMath tex="\delta(t)" katexReady={katexReady}/> between two nearby trajectories.
            </figcaption>
          </figure>

          <p>We are concerned about the rate of <InlineMath tex="\delta" katexReady={katexReady}/>'s growth. Numerical studies find:</p>
          <MathDisplay tex={FORMULAS.lyapunovExp} katexReady={katexReady} />
          
          <p>
            Where <InlineMath tex="\lambda" katexReady={katexReady}/> is the <strong>Liapunov Exponent</strong>. In the Lorenz attractor, <InlineMath tex="\lambda \approx 0.9" katexReady={katexReady}/>.
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><InlineMath tex="\lambda < 0 \implies" katexReady={katexReady}/> stable</li>
            <li><InlineMath tex="\lambda = 0 \implies" katexReady={katexReady}/> stable (e.g., limit cycle along the flow)</li>
            <li><InlineMath tex="\lambda > 0 \implies" katexReady={katexReady}/> <strong className="text-purple-400">chaos</strong></li>
          </ul>

          <h4 className="font-bold text-purple-400 mt-6">3 Qualifications for the Liapunov Exponent</h4>
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figSlope} 
              alt="Ln Delta Slope" 
              className="max-w-[400px] w-full h-auto object-contain mx-auto opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 4. The natural logarithm of the separation <InlineMath tex="||\delta||" katexReady={katexReady}/> oscillates but grows linearly with slope <InlineMath tex="\lambda" katexReady={katexReady}/>.
            </figcaption>
          </figure>

          <ol className="list-decimal list-inside space-y-4 text-white/70 ml-4">
            <li><strong>Wiggles (Oscillation):</strong> The Lorenz attractor isn't a uniform field, so it diverges faster at some positions and slower at others. Thus, the curve <InlineMath tex="\ln||\delta||" katexReady={katexReady}/> vs <InlineMath tex="t" katexReady={katexReady}/> appears to have oscillations.</li>
            <li><strong>Why Saturation finally?</strong> Even if the Lorenz attractor is 0-volume, it has a Diameter (Boundary). The distance between each part has a maximum. After it achieves this, divergence stops (leveling off).</li>
            <li>
              <strong>"Liapunov Exponent" is a colloquial expression:</strong> For an <InlineMath tex="n" katexReady={katexReady}/>-dimensional dynamic system, there exist <InlineMath tex="n" katexReady={katexReady}/> different <InlineMath tex="\lambda" katexReady={katexReady}/>. 
              After tracking a small sphere under the 3D phase field, it becomes an ellipsoid with 3 dimensions. Some stretch (<InlineMath tex="\lambda > 0" katexReady={katexReady}/>), some shrink (<InlineMath tex="\lambda < 0" katexReady={katexReady}/>).
              <MathDisplay tex={FORMULAS.lyapunovVec} katexReady={katexReady} />
              After a long time, the maximum stretching will cover & dominate other directions, and that is what we talk about above: <InlineMath tex="\lambda" katexReady={katexReady}/> is actually the <strong>Largest Liapunov Exponent</strong>.
            </li>
          </ol>
        </section>

        {/* 4. Prediction Horizon */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. The Prediction Horizon</h3>
          <p>
            When the system has a positive Liapunov exponent, there is a time horizon beyond which prediction breaks down.
            Suppose the measuring error is <InlineMath tex="||\delta_0||" katexReady={katexReady}/> & our Tolerance is <InlineMath tex="a" katexReady={katexReady}/>.
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.horizon1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.horizon2} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.horizon3} katexReady={katexReady} />
          </div>

          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-purple-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]">
            <h4 className="text-purple-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: The Wall of Sighs & Measurement Precision</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              This minimalist formula pronounces a death sentence on humanity's ability for long-term prediction. The logarithmic term <InlineMath tex="\ln" katexReady={katexReady}/> in the formula means: even if we exhaust all human wealth to build the most advanced radar and reduce the initial measurement error <InlineMath tex="||\delta_0||" katexReady={katexReady}/> by a million times (<InlineMath tex="10^6" katexReady={katexReady}/>), the logarithm <InlineMath tex="\ln(10^6)" katexReady={katexReady}/> only increases by about 13.8.
              <br/><br/>
              No matter how hard we work to reduce the error, the prediction horizon can only be extended by a mere few multiples of <InlineMath tex="1/\lambda" katexReady={katexReady}/> (Lyapunov Time). This is an absolute physical limit written by mathematics into the universe's source code.
            </p>
          </div>
        </section>

        {/* 5. Definition of Chaos */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Definition of Chaos</h3>
          <p>
            No definition of Chaos is universally accepted yet, but almost every definition agrees onto 3 ingredients below.
            <br/>
            <strong>Def by Strogatz:</strong> <em>Chaos is aperiodic long-term behavior in a deterministic system that exhibits sensitive dependence on initial conditions.</em>
          </p>
          
          <ol className="list-decimal list-inside space-y-4 text-white/70 ml-4 mt-4">
            <li><strong>Aperiodic long-term behavior:</strong> The trajectories do not settle down to fixed points or periodic orbits. This behavior cannot be an extremely rare special case.</li>
            <li><strong>Deterministic:</strong> The whole system is 100% determined without noisy inputs. The irregular movement is from its nonlinearity only.</li>
            <li><strong>Sensitive dependence on initial conditions:</strong> The system has at least one positive Liapunov Exponent.</li>
          </ol>

          <h4 className="font-bold text-purple-400 mt-6">Why "Unstable" $\neq$ "Chaos"?</h4>
          <p>Many people equate "unstable" with "chaos". To refute this idea, let's look at a simple example:</p>
          <MathDisplay tex={FORMULAS.simpleEq} katexReady={katexReady} />
          <p>1. It is 100% determined. <br/>2. Its solution is <InlineMath tex={FORMULAS.simpleSol} katexReady={katexReady}/>. It exhibits exponential separation.</p>
          <p>
            But it is <strong>not</strong> chaos, since infinity acts as a role of attracting fixed point. All the trajectories go to infinity so it doesn't have bounded aperiodic behavior.
          </p>

          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-purple-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]">
            <h4 className="text-purple-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: The Cage of Chaos</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              This counterexample is extremely profound. <InlineMath tex="\dot{x}=x" katexReady={katexReady}/> runs toward infinity like a runaway horse, which is quite boring. True chaos must be "caged madness".
              <br/><br/>
              It must possess both local exponential repulsion (instability) and be tightly trapped within a finite space by the system's outer boundaries (volume contraction). Trajectories with nowhere to escape are forced to fold infinitely within a bounded space, which is the very source of the beauty of chaos.
            </p>
          </div>
        </section>

        {/* 6. Attractor Definition */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Definition of Attractor & Strange Attractor</h3>
          <p><strong>Def of Attractor:</strong> (A closed set <InlineMath tex="A" katexReady={katexReady}/> with following properties)</p>
          <ol className="list-decimal list-inside space-y-2 text-white/70 ml-4">
            <li><InlineMath tex="A" katexReady={katexReady}/> is an <strong>invariant set</strong>: any trajectory <InlineMath tex="\mathbf{x}(t)" katexReady={katexReady}/> that starts in <InlineMath tex="A" katexReady={katexReady}/> stays in <InlineMath tex="A" katexReady={katexReady}/> for all time.</li>
            <li><InlineMath tex="A" katexReady={katexReady}/> <strong>attracts an open set</strong> of initial conditions: there is an open set <InlineMath tex="U" katexReady={katexReady}/> containing <InlineMath tex="A" katexReady={katexReady}/>. If <InlineMath tex="\mathbf{x}(0) \in U" katexReady={katexReady}/>, then the distance from <InlineMath tex="\mathbf{x}(t)" katexReady={katexReady}/> to <InlineMath tex="A" katexReady={katexReady}/> tends to zero as <InlineMath tex="t \to \infty" katexReady={katexReady}/>.</li>
            <li><InlineMath tex="A" katexReady={katexReady}/> is <strong>minimal</strong>: there is no proper subset of <InlineMath tex="A" katexReady={katexReady}/> that satisfies condition 1 & 2.</li>
          </ol>

          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-purple-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]">
            <h4 className="text-purple-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: Mathematical Mystery of the Lorenz Attractor</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              The third condition, "minimality," is meant to kick out imposter attractors that forcefully bundle "fixed points and useless line segments" together. This leads to a famous unsolved mystery in the history of dynamics:
              <br/><br/>
              Since the volume of the Lorenz system contracts to 0, trajectories are pulled into a set of zero volume. But does this zero-volume set truly satisfy "minimality"? Could there be smaller, independent attractors hidden inside that humanity has yet to discover?
              <br/><br/>
              Strogatz admits in the book: to this day, no one has rigorously proven on a pure mathematical level that the Lorenz butterfly seen in computers perfectly fits the definition of minimality. However, "except for a few mathematical purists, everyone believes it is a true attractor."
            </p>
          </div>

          <h4 className="font-bold text-purple-400 mt-6">What is a "Strange" Attractor?</h4>
          <p>
            Finally, we define a strange attractor to be an attractor that exhibits sensitive dependence on initial conditions. 
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li>Originally called "strange" because they are often fractal sets.</li>
            <li>Nowadays, the dynamical property (sensitive dependence) is more important than the geometric property (fractal).</li>
            <li>The terms <strong>chaotic attractor</strong> and <strong>fractal attractor</strong> are used to emphasize one or the other of those aspects.</li>
          </ul>
        </section>

        {/* 7. Full 3D Interactive Lab */}
        <section className="space-y-4 pt-8">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">7. Interactive Finale: The Strange Attractor</h3>
          <p>
            This is it. The mathematical butterfly that started a revolution. Use your mouse to <strong>rotate</strong> the attractor, drag the slider to <strong>zoom</strong>, and adjust the parameters to see how the fractal structure breathes and morphs in real-time.
          </p>
          <LorenzAttractor3D />
        </section>

        {/* Epilogue Postscript */}
        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <div className="inline-block px-10 py-5 bg-purple-600/10 border border-purple-500/30 text-purple-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(168,85,247,0.1)]">
            Epilogue: The End of Predictability
          </div>
          <div className="text-xs text-white/40 font-light italic mt-8 max-w-2xl mx-auto leading-relaxed space-y-4">
            <p>
              "From a simple mechanical water wheel to non-linear equations written in calculus; from the wildly contracting volume in phase space to the final safe harbor destroyed by a subcritical Hopf bifurcation. Our derivations, like clearing the mist, finally bore witness to the Lorenz butterfly flapping its wings in zero volume."
            </p>
            <p>
              "At the end of this journey, mathematics has given us a dual shock: it has shown us the breathtaking geometric beauty hidden within a deterministic system through an infinitely folded 2.05-dimensional fractal; simultaneously, it has drawn an absolute physical limit on humanity's ambition to control the future with a cold 'logarithmic wall of sighs.'"
            </p>
            <p className="text-purple-300 font-bold">
              "The breakdown of prediction is not due to our incompetence, but due to the immense richness of the system itself. Chaos is not disorder; it is an order of a higher degree than periodicity."
            </p>
          </div>

          <div className="pt-16 text-[10px] text-white/20 tracking-wider space-y-1.5 uppercase font-light">
            <p className="font-bold mb-2 text-white/30 tracking-[0.3em]">References</p>
            <p>Nonlinear Dynamics and Chaos (Steven H. Strogatz)</p>
            <p>Differential Equations, Dynamical Systems, and an Introduction to Chaos (Devaney, Robert L., Hirsch, Morris W., Smale etc.)</p>
          </div>
        </div>

      </div>
    </LogLayout>
  );
};

export default function ChaosLog5Wrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogFinale />
    </ErrorBoundary>
  );
}