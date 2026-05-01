import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// 1. 正常导入 Layout 组件 (如果本地有该组件请取消注释，并删除下方的 fallback)
// =========================================================
import LogLayout from '../components/LogLayout';


// =========================================================
// 🛡️ 静态资源隔离区
// =========================================================
const FORMULAS = {
  eq1: "ds^2 = dx^2 + dy^2 + dz^2",
  eq2: "ds^2 = -c^2 dt^2 + dx^2 + dy^2 + dz^2",
  eq3: "ds^2 = -\\left(1 - \\frac{2GM}{c^2r}\\right) c^2 dt^2 + \\left(1 - \\frac{2GM}{c^2r}\\right)^{-1} dr^2 + r^2(d\\theta^2 + \\sin^2\\theta d\\phi^2)",
  eq4: "1 - \\frac{2GM}{c^2r} = 0 \\implies r = \\frac{2GM}{c^2}",
  eq5: "\\text{KE} + \\text{PE} = \\frac{1}{2}mc^2 - \\frac{GMm}{r} = 0 \\implies R_s = \\frac{2GM}{c^2}",
  eq6: "R_{\\mathrm{ISCO}} = 3R_s = \\frac{6GM}{c^2}",
  eq7: "d\\tau = dt \\sqrt{1 - \\frac{R_s}{r}}",
  eq8: "D = \\frac{1}{\\gamma (1 - \\beta \\cos\\theta)}",
  eq9: "\\alpha \\approx \\frac{2R_s}{b} + \\frac{15R_s^2}{b^2}",
  eq10: "\\epsilon(r) \\propto \\frac{3GM\\dot{M}}{8\\pi r^3} \\left(1 - \\sqrt{\\frac{R_{\\mathrm{ISCO}}}{r}}\\right)",
  eq11: "v_r \\approx -\\alpha\\left(\\frac{H}{R}\\right)^2 v_{\\phi}",
  riemann: "R^{\\hat{r}\\hat{t}}_{\\hat{r}\\hat{t}} = -\\frac{R_s}{r^3}, \\quad R^{\\hat{\\theta}\\hat{t}}_{\\hat{\\theta}\\hat{t}} = \\frac{R_s}{2r^3}",
  stretch: "a_{\\mathrm{radial}} = \\frac{R_s c^2 L}{r^3}, \\quad a_{\\mathrm{perp}} = -\\frac{R_s c^2 L}{2r^3}"
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
        <h2 className="text-orange-400 mb-4">⚠️ System Crash</h2>
        <pre className="text-xs text-red-400">{this.state.error?.toString()}</pre>
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
      try { 
        window.katex.render(String(tex || ""), container.current, { 
          throwOnError: false, 
          displayMode: true,
          strict: false
        }); 
      } catch (e) { console.error("KaTeX Render Error:", e); }
    }
  }, [tex, katexReady]);
  return <div ref={container} className="my-8 py-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner overflow-x-auto text-center"></div>;
};

const InlineMath = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try { 
        window.katex.render(String(tex || ""), container.current, { 
          throwOnError: false, 
          displayMode: false,
          strict: false
        }); 
      } catch (e) { console.error("KaTeX Inline Error:", e); }
    }
  }, [tex, katexReady]);
  return <span ref={container} className="mx-1 font-serif text-orange-200/90">{`$${tex}$`}</span>;
};


// =========================================================
// 互动实验室 1：时间膨胀与史瓦西度规
// =========================================================
const TimeDilationLab = ({ katexReady }) => {
  const [distance, setDistance] = useState(5.0);
  const rs = 2.0; 
  
  const timeFlow = distance > rs ? Math.sqrt(1 - rs / distance) : 0;
  const maxR = 10.0;
  const points = [];
  
  for (let r = 2.001; r <= maxR; r += 0.05) {
    const t = Math.sqrt(1 - rs / r);
    const x = ((r - rs) / (maxR - rs)) * 100; 
    const y = 100 - (t * 100);
    points.push(`${x},${y}`);
  }

  const currentX = Math.max(0, Math.min(100, ((distance - rs) / (maxR - rs)) * 100));
  const currentY = 100 - (timeFlow * 100);

  return (
    <div className="my-10 p-6 md:p-8 bg-[#050b14] border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
        
        {/* 修复：移除 aspect 约束，增加明确的最小高度 */}
        <div className="md:col-span-3 relative w-full min-h-[350px] md:min-h-[450px] bg-black/40 rounded-xl border border-white/5 p-6 md:p-10 overflow-hidden">
          <svg viewBox="-10 -10 120 125" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="timeGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* 修复：增加线宽和字号 */}
            <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <text x="50" y="110" className="text-[5px] fill-white/40 font-bold" textAnchor="middle">Distance from Singularity (r)</text>
            <text x="-6" y="50" className="text-[5px] fill-white/40 font-bold" textAnchor="middle" transform="rotate(-90 -6 50)">Time Flow Rate</text>
            <polygon points={`0,100 ${points.join(' ')} 100,100`} fill="url(#timeGrad)" />
            <polyline points={points.join(' ')} fill="none" stroke="#f97316" strokeWidth="2" />
            <line x1={currentX} y1="0" x2={currentX} y2="100" stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" strokeWidth="0.8" />
            <circle cx={currentX} cy={currentY} r="3" fill="#f97316" className="animate-pulse" />
          </svg>
          <div className="absolute top-4 left-4 text-[10px] md:text-[12px] text-orange-400 font-bold tracking-widest uppercase">Metric Gradient</div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5 space-y-4">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Effective Flow</div>
            <div className="text-4xl font-black tracking-tighter text-white">
              {(timeFlow * 100).toFixed(2)}<span className="text-sm text-orange-500 ml-1">%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${timeFlow * 100}%` }} />
            </div>
          </div>
          <div className="space-y-4">
            <input type="range" min="2.01" max="10.0" step="0.01" value={distance} onChange={(e) => setDistance(parseFloat(e.target.value))} className="w-full accent-orange-500 cursor-pointer" />
            <p className="text-[11px] text-white/50 leading-relaxed italic">
              "As you approach <InlineMath tex="R_s" katexReady={katexReady}/>, your proper time remains normal, but the coordinate time relative to infinity diverges. At the horizon, the 'ticking' of the universe stops."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 互动实验室 2：有效势能与 ISCO (彻底修复越界 Bug 与统一样式)
// =========================================================
const EffectivePotentialLab = ({ katexReady }) => {
  const [L, setL] = useState(4.3);
  const calcV = (r, L_val) => -1/r + (L_val*L_val)/(2*r*r) - (L_val*L_val)/(r*r*r);
  
  const minR = 2.05;
  const maxR = 20.0;
  const minV = -0.06;
  const maxV = 0.05;
  const yZero = 100 - ((0 - minV) / (maxV - minV)) * 100;

  const points = [];
  for (let r = minR; r <= maxR; r += 0.1) {
    const v = calcV(r, L);
    const x = ((r - minR) / (maxR - minR)) * 100;
    const y = 100 - ((v - minV) / (maxV - minV)) * 100;
    points.push(`${x},${y}`); // 不在 JS 层做限制，交给 SVG 的 clipPath 处理
  }

  const disc = L*L*L*L - 12*L*L; 
  let hasStable = disc >= 0;
  let rStable = hasStable ? (L*L + Math.sqrt(disc)) / 2 : null;
  let rUnstable = hasStable ? (L*L - Math.sqrt(disc)) / 2 : null;

  const getSvgCoords = (r) => {
    const v = calcV(r, L);
    return {
      x: ((r - minR) / (maxR - minR)) * 100,
      y: 100 - ((v - minV) / (maxV - minV)) * 100
    };
  };

  return (
    <div className="my-10 p-6 md:p-8 bg-[#050b14] border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
        
        {/* 修复：移除 aspect 约束，增加明确的最小高度 */}
        <div className="md:col-span-3 relative w-full min-h-[350px] md:min-h-[450px] bg-black/40 rounded-xl border border-white/5 p-6 md:p-10 overflow-hidden">
          <svg viewBox="-10 -10 120 125" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="vEffGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              {/* 关键修复: 利用 clipPath 防止势能线画到格子外面 */}
              <clipPath id="chart-clip">
                <rect x="0" y="0" width="100" height="100" />
              </clipPath>
            </defs>

            {/* 修复：坐标轴背景字体和线宽 */}
            <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <line x1="0" y1="0" x2="0" y2="100" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
            <text x="50" y="110" className="text-[5px] fill-white/40 font-bold" textAnchor="middle">Radius (r)</text>
            <text x="-6" y="50" className="text-[5px] fill-white/40 font-bold" textAnchor="middle" transform="rotate(-90 -6 50)">V_eff(r)</text>
            
            {/* Zero Energy Line (V = 0) */}
            <line x1="0" y1={yZero} x2="100" y2={yZero} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" strokeDasharray="2 2" />
            <text x="102" y={yZero + 1} className="text-[4px] fill-white/40">E=0</text>

            <g clipPath="url(#chart-clip)">
              {/* 势能面积填充与折线 */}
              <polygon points={`0,100 ${points.join(' ')} 100,100`} fill="url(#vEffGrad)" />
              <polyline points={points.join(' ')} fill="none" stroke="#f97316" strokeWidth="2" />
              
              {/* 标注稳定/不稳定轨道 */}
              {hasStable && rStable <= maxR && (
                <circle cx={getSvgCoords(rStable).x} cy={getSvgCoords(rStable).y} r="3" fill="#38bdf8" className="drop-shadow-[0_0_5px_#38bdf8]" />
              )}
              {hasStable && rUnstable <= maxR && rUnstable >= minR && (
                <circle cx={getSvgCoords(rUnstable).x} cy={getSvgCoords(rUnstable).y} r="3" fill="#ef4444" className="drop-shadow-[0_0_5px_#ef4444]" />
              )}
            </g>
          </svg>
          
          <div className="absolute top-4 left-4 text-[10px] md:text-[12px] text-orange-400 font-bold tracking-widest uppercase">Effective Potential</div>
          <div className="absolute top-4 right-4 flex flex-col gap-1 text-[8px] md:text-[10px] tracking-widest text-right font-bold bg-black/50 p-2 rounded-md border border-white/5">
             <div className="text-cyan-400">● Stable Orbit</div>
             <div className="text-red-400">● Unstable Orbit</div>
          </div>
        </div>

        {/* 右控: 物理状态参数 */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/[0.03] p-6 rounded-xl border border-white/5 space-y-4">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2">Angular Momentum (L)</div>
            <div className={`text-4xl font-black tracking-tighter ${hasStable ? 'text-white' : 'text-red-500 animate-pulse'}`}>
              {L.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-4">
            <input 
              type="range" min="2.5" max="5.5" step="0.01" value={L} 
              onChange={e => setL(parseFloat(e.target.value))}
              className={`w-full cursor-pointer h-1 rounded-lg appearance-none ${hasStable ? 'accent-orange-500 bg-white/10' : 'accent-red-500 bg-red-500/30'}`}
            />
            <div className="text-[11px] leading-relaxed italic h-24">
              {hasStable ? 
                <span className="text-white/50">"A local minimum exists. Particles can maintain a stable circular orbit at this radius without falling in."</span> :
                <span className="text-red-400">"L is below the ISCO critical threshold! The 'pit' and 'hill' have merged. All particles unconditionally plunge into the singularity."</span>
              }
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};


// =========================================================
// 互动实验室 3：多普勒波纹原理 (Doppler Wavefront Lab)
// =========================================================
const DopplerWaveLab = () => {
  const [velocity, setVelocity] = useState(0.5); 
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    let waves = [];
    let frame = 0;

    const render = () => {
      frame++;
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const sourceX = cx; 
      
      if (frame % 10 === 0) waves.push({ r: 0, x: sourceX });

      waves.forEach((w, index) => {
        w.r += 2.5; 
        const v_offset = velocity * 2.5; 
        
        ctx.beginPath();
        const currentCenterX = sourceX + (frame - (frame - (index*10))) * v_offset;
        ctx.arc(currentCenterX, cy, w.r, 0, Math.PI * 2);
        
        const beta = velocity;
        const gamma = 1 / Math.sqrt(1 - beta * beta);
        const D_front = 1 / (gamma * (1 - beta)); 
        const D_back = 1 / (gamma * (1 + beta));  

        const grad = ctx.createRadialGradient(currentCenterX, cy, w.r - 2, currentCenterX, cy, w.r + 2);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.5, `rgba(${255 * D_back}, ${150 * D_front}, ${255 * D_front}, ${0.8 / (w.r/50)})`);
        grad.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      waves = waves.filter(w => w.r < 300);
      requestAnimationFrame(render);
    };

    const anim = requestAnimationFrame(render);
    return () => cancelAnimationFrame(anim);
  }, [velocity]);

  return (
    <div className="my-10 bg-[#050b14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 space-y-6">
          <h4 className="text-orange-400 text-xs tracking-[0.2em] uppercase font-bold">The Relativistic Wavefront</h4>
          <p className="text-xs text-white/60 leading-relaxed">
            Instead of looking at the disk, observe the <strong>Wavefront Compression</strong>. 
            When a source moves at near-light speeds, the waves it emits are physically crowded together in the direction of motion, skyrocketing its frequency and intensity.
          </p>
          <div className="space-y-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] tracking-widest text-white/40 uppercase">
              <span>Velocity (β = v/c)</span>
              <span className="text-orange-400 font-bold">{velocity.toFixed(2)} c</span>
            </div>
            <input 
              type="range" min="0" max="0.95" step="0.01" value={velocity} 
              onChange={e => setVelocity(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>
        </div>
        <div className="relative h-[300px] bg-black">
          <canvas ref={canvasRef} width={500} height={300} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none border-l border-white/5" />
          <div className="absolute bottom-4 right-4 text-[8px] text-white/20 uppercase tracking-[0.3em]">
             Radial Wave Propagation
          </div>
        </div>
      </div>
    </div>
  );
};


// =========================================================
// 互动实验室 4：引力透镜测地线积分器 (Lensing Raytracer Lab)
// =========================================================
const LensingRaytracerLab = ({ katexReady }) => {
  const [b, setB] = useState(5.5);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const Rs = 2.0;
    const scale = 25; 

    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, Rs * scale, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(249,115,22,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5 * Rs * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, cy - b * scale);
    ctx.lineTo(W, cy - b * scale);
    ctx.stroke();

    let currentPhi = Math.PI - 0.001; 
    let currentU = Math.sin(currentPhi) / b;
    let currentDu = Math.cos(currentPhi) / b;
    let d_phi = -0.01; 

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#38bdf8';
    ctx.beginPath();

    let started = false;
    for (let i = 0; i < 3000; i++) {
        let r = 1 / currentU;
        let x = cx + r * Math.cos(currentPhi) * scale;
        let y = cy - r * Math.sin(currentPhi) * scale; 

        if (!started) { ctx.moveTo(x, y); started = true; } 
        else { ctx.lineTo(x, y); }

        let d2u = -currentU + 1.5 * Rs * currentU * currentU;
        currentDu += d2u * d_phi;
        currentU += currentDu * d_phi;
        currentPhi += d_phi;

        if (currentU <= 0) break; 
        if ((1 / currentU) < Rs) { 
            ctx.lineTo(cx + (1/currentU) * Math.cos(currentPhi) * scale, cy - (1/currentU) * Math.sin(currentPhi) * scale);
            break; 
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [b]);

  return (
    <div className="my-10 bg-[#050b14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden font-mono">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 flex flex-col justify-center space-y-6 border-b md:border-b-0 md:border-r border-white/10">
          <div>
            <h4 className="text-orange-400 text-xs tracking-[0.2em] uppercase font-bold mb-2">Geodesic Raytracer</h4>
            <p className="text-[11px] text-white/60 leading-relaxed">
              This canvas integrates the exact photon orbital equation: <InlineMath tex="\frac{d^2u}{d\phi^2} + u = \frac{3GM}{c^2} u^2" katexReady={katexReady}/> in real-time. 
              The photon sphere lies at <InlineMath tex="1.5 R_s" katexReady={katexReady}/> (dashed line).
            </p>
          </div>
          <div className="space-y-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] tracking-widest text-white/40 uppercase">
              <span>Impact Parameter (b)</span>
              <span className="text-orange-400 font-bold">{b.toFixed(2)} M</span>
            </div>
            <input 
              type="range" min="4.0" max="8.0" step="0.01" value={b} 
              onChange={e => setB(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <p className="text-[9px] text-white/30 uppercase tracking-widest pt-2">
              Critical b ≈ 5.20. Watch the photon orbit multiple times before deciding its fate!
            </p>
          </div>
        </div>
        <div className="relative h-[350px] bg-black flex items-center justify-center">
          <canvas ref={canvasRef} width={400} height={350} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
};


// =========================================================
// 页面主逻辑: Relativity & Black Hole
// =========================================================
const RelativityLog = () => {
  const [katexReady, setKatexReady] = useState(false);

  useEffect(() => {
    if (!document.getElementById('katex-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'katex-cdn-css'; 
      link.rel = 'stylesheet'; 
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
      document.head.appendChild(link);
    }
    
    if (window.katex) {
      setKatexReady(true);
    } else if (!document.getElementById('katex-cdn-js')) {
      const script = document.createElement('script');
      script.id = 'katex-cdn-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
      script.onload = () => setKatexReady(true);
      document.head.appendChild(script);
    }
  }, []);

  return (
    <LogLayout title="Gravity & BlackHole" category="RESEARCH" date="2026-05-01">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        {/* Abstract */}
        <section className="space-y-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">
          <h3 className="text-orange-400 font-bold tracking-widest uppercase text-xs mb-2">Abstract</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            This document explores the physical core behind the WebGL interactive black hole rendering project. Moving beyond the rendering pipeline, we focus on the fundamental concepts of General Relativity and Astrophysics. We provide detailed yet intuitive derivations of the Schwarzschild Metric, gravitational time dilation, relativistic beaming, and the dynamics of a Shakura-Sunyaev accretion disk, bridging the gap between rigorous astrophysics and real-time visualization code.
          </p>
        </section>

        {/* 1. Spacetime Geometry */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Spacetime Geometry & The Metric</h3>
          
          <h4 className="font-bold text-orange-400 mt-6 text-sm uppercase">1.1 Understanding the Metric: The Pythagorean Theorem of Spacetime</h4>
          <p>
            In standard 3D flat space, the distance between two nearby points is given by the Pythagorean theorem:
          </p>
          <MathDisplay tex={FORMULAS.eq1} katexReady={katexReady} />
          <p>
            In Special Relativity, we add time into the mix to create a 4D "spacetime interval" <InlineMath tex="ds^2" katexReady={katexReady}/>. Time is treated as a dimension, but with an opposite sign:
          </p>
          <MathDisplay tex={FORMULAS.eq2} katexReady={katexReady} />
          <p>
            When a massive object is present, spacetime is no longer flat. By solving Einstein's Field Equations for a vacuum outside a spherical mass, Karl Schwarzschild derived the exact metric for this curved spacetime:
          </p>
          <MathDisplay tex={FORMULAS.eq3} katexReady={katexReady} />

          <h4 className="font-bold text-orange-400 mt-8 text-sm uppercase">1.2 The Schwarzschild Radius & Event Horizon</h4>
          <p>
            What happens if the denominator in the radial term approaches zero? Space becomes infinitely stretched at a specific boundary:
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.eq4} katexReady={katexReady} />
          </div>
          <p>
            This specific radius is called the <strong>Schwarzschild Radius (<InlineMath tex="R_s" katexReady={katexReady}/>)</strong>. Interestingly, you can derive this exact same radius using simple Newtonian physics by setting the escape velocity to the speed of light:
          </p>
          <MathDisplay tex={FORMULAS.eq5} katexReady={katexReady} />
          
          <div className="mt-8 bg-orange-500/5 p-8 border-l-4 border-orange-500/50 rounded-r-xl">
             <h4 className="text-orange-400 font-black text-xs uppercase mb-4 tracking-widest">Log Insight: Riemann Curvature & Spaghettification</h4>
             <p className="text-xs italic leading-relaxed text-white/70">
               Because the Schwarzschild solution describes a vacuum, the Ricci curvature vanishes (<InlineMath tex="R_{\mu\nu} = 0" katexReady={katexReady}/>). The curvature is hidden entirely in the Riemann Tensor:
             </p>
             <MathDisplay tex={FORMULAS.riemann} katexReady={katexReady} />
             <p className="text-xs italic leading-relaxed text-white/70 mt-2">
               The physical manifestation of this tensor is tidal force. A falling body experiences radial stretching and perpendicular crushing:
             </p>
             <MathDisplay tex={FORMULAS.stretch} katexReady={katexReady} />
             <p className="text-xs italic leading-relaxed text-white/70 mt-2">
               Notice the <InlineMath tex="1/r^3" katexReady={katexReady}/> dependence. For a stellar-mass black hole, you would be torn apart by tidal forces ("Spaghettified") long before reaching the Event Horizon. For a supermassive black hole like Gargantua, the curvature at the horizon is gentle enough to cross intact.
             </p>
          </div>

          <h4 className="font-bold text-orange-400 mt-8 text-sm uppercase">1.3 Innermost Stable Circular Orbit (ISCO)</h4>
          <p>
            According to Newton, you can orbit a star at any distance as long as you move fast enough. General Relativity destroys this assumption. Due to extreme spacetime curvature, gravity creates a runaway attractive effect close to the black hole, making orbits unstable inside the ISCO:
          </p>
          <MathDisplay tex={FORMULAS.eq6} katexReady={katexReady} />
          
          <EffectivePotentialLab katexReady={katexReady} />
        </section>

        {/* 2. Relativistic Optics */}
        <section className="space-y-6 pt-8">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Relativistic Optics (The Shader Core)</h3>
          
          <h4 className="font-bold text-orange-400 mt-6 text-sm uppercase">2.1 Gravitational Time Dilation and Redshift</h4>
          <p>
            As derived from the metric, the relationship between proper time <InlineMath tex="\tau" katexReady={katexReady}/> and coordinate time <InlineMath tex="t" katexReady={katexReady}/> for a stationary observer is:
          </p>
          <MathDisplay tex={FORMULAS.eq7} katexReady={katexReady} />
          
          <TimeDilationLab katexReady={katexReady} />

          <h4 className="font-bold text-orange-400 mt-8 text-sm uppercase">2.2 Relativistic Doppler Beaming</h4>
          <p>
            Matter in the accretion disk orbits at a significant fraction of the speed of light. When luminous matter moves towards you at relativistic speeds, it appears immensely brighter. The relativistic Doppler factor <InlineMath tex="D" katexReady={katexReady}/> is:
          </p>
          <MathDisplay tex={FORMULAS.eq8} katexReady={katexReady} />
          
          <DopplerWaveLab />

          <h4 className="font-bold text-orange-400 mt-8 text-sm uppercase">2.3 Gravitational Lensing (Einstein Lensing)</h4>
          <p>
            The immense mass bends the path of light coming from the back of the disk. While an exact solution requires complex elliptic integrals, we use a robust high-order Taylor approximation for the deflection angle in our shaders:
          </p>
          <MathDisplay tex={FORMULAS.eq9} katexReady={katexReady} />
          <p>
             The mathematical bending is what pulls the image of the disk behind the black hole up and over the top, creating the iconic glowing "halo" effect.
          </p>

          <LensingRaytracerLab katexReady={katexReady} />
        </section>

        {/* 3. Accretion Disk Physics Dynamics */}
        <section className="space-y-6 pt-8">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Accretion Disk Physics Dynamics</h3>
          
          <h4 className="font-bold text-orange-400 mt-6 text-sm uppercase">3.1 Shakura-Sunyaev Emissivity Profile</h4>
          <p>
            Why does the disk glow? As gas spirals inward, gravitational potential energy is converted into heat via friction. According to the classic Shakura-Sunyaev <InlineMath tex="\alpha" katexReady={katexReady}/>-disk model, the emissivity <InlineMath tex="\epsilon(r)" katexReady={katexReady}/> is:
          </p>
          <MathDisplay tex={FORMULAS.eq10} katexReady={katexReady} />

          <h4 className="font-bold text-orange-400 mt-8 text-sm uppercase">3.2 Viscous Radial Infall</h4>
          <p>
            Particles do not just fall straight in; they slowly drift inwards due to internal friction. Using the <InlineMath tex="\alpha" katexReady={katexReady}/>-viscosity parameterization, the radial infall velocity <InlineMath tex="v_r" katexReady={katexReady}/> is:
          </p>
          <MathDisplay tex={FORMULAS.eq11} katexReady={katexReady} />
          <p>
             This shows why outer particles drift very slowly, but once they cross the ISCO boundary, they lose centrifugal support and enter a rapid, free-fall plunge into the singularity.
          </p>
        </section>

        {/* Call to Action */}
        <section className="pt-16 text-center border-t border-white/10 mt-16">
          <h4 className="text-xl font-bold tracking-[0.4em] text-white uppercase mb-4">Observation Complete</h4>
          <p className="text-sm text-white/40 mb-10">All theoretical frameworks have been integrated into the primary simulation engine.</p>
          <a 
            href="https://xiaobai-sama.xyz/models/black-hole"
            className="inline-block px-12 py-5 bg-orange-600/10 border border-orange-500/50 text-orange-400 font-bold tracking-[0.4em] uppercase hover:bg-orange-500/20 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300"
          >
            Terminal: Gargantua Engine
          </a>
        </section>

      </div>
    </LogLayout>
  );
};

export default function BlackHoleLogWrapped() {
  return (
    <ErrorBoundary>
      <RelativityLog />
    </ErrorBoundary>
  );
}