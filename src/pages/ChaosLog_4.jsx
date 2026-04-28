import React, { useState, useEffect, useRef, useMemo } from 'react';

// =========================================================
// 1. 正常导入 Layout 组件
// =========================================================
import LogLayout from '../components/LogLayout';

// =========================================================
// 2. 正常导入本地真实图片 (对应你的上传图片和手写草图)
// =========================================================
import figWaterWheel from '../assets/Figure_8.png';
import figSector from '../assets/Figure_9.png';
import figVolume from '../assets/Figure_10.png';
import figEllipsoid from '../assets/Figure_11.png';
import figSaddleCycle from '../assets/Figure_12.png';
import figSubcritical from '../assets/Figure_13.png';


// =========================================================
// 🛡️ 静态资源隔离区 (海量公式库)
// =========================================================
const FORMULAS = {
  lorenz: "\\begin{cases} \\dot{x} = \\sigma(y - x) \\\\ \\dot{y} = rx - y - xz \\\\ \\dot{z} = xy - bz \\end{cases}",
  massVar1: "\\Delta M = \\Delta t \\left[ \\int_{\\theta_1}^{\\theta_2} Q d\\theta - \\int_{\\theta_1}^{\\theta_2} Km d\\theta \\right] + m(\\theta_1)\\omega\\Delta t - m(\\theta_2)\\omega\\Delta t",
  massVar2: "\\Delta M = \\underbrace{\\Delta t \\int_{\\theta_1}^{\\theta_2} Q d\\theta}_{\\text{pump in}} \\quad \\underbrace{- \\Delta t \\int_{\\theta_1}^{\\theta_2} Km d\\theta}_{\\text{leaks out}} \\quad \\underbrace{+ m(\\theta_1)\\omega\\Delta t}_{\\text{region in}} \\quad \\underbrace{- m(\\theta_2)\\omega\\Delta t}_{\\text{region out}}",
  massDeriv: "m(\\theta_1) - m(\\theta_2) = -\\int_{\\theta_1}^{\\theta_2} \\frac{\\partial m}{\\partial \\theta} d\\theta",
  continuityPre1: "\\implies \\frac{dM}{dt} = \\int_{\\theta_1}^{\\theta_2} \\left( Q - Km - \\omega \\frac{\\partial m}{\\partial \\theta} \\right) d\\theta",
  continuityPre2: "\\implies \\frac{dM}{dt} = \\int_{\\theta_1}^{\\theta_2} \\frac{\\partial m}{\\partial t} d\\theta",
  continuityEq: "\\frac{\\partial m}{\\partial t} = Q - Km - \\omega \\frac{\\partial m}{\\partial \\theta} \\quad \\text{(1)}",
  torqueGrav1: "d\\tau = dMg r \\sin\\theta = mg r \\sin\\theta d\\theta",
  torqueGrav2: "\\implies \\text{gravitation torque} = gr \\int_0^{2\\pi} m(\\theta,t)\\sin\\theta d\\theta",
  torqueEq: "I\\dot{\\omega} = -\\nu\\omega + gr \\int_0^{2\\pi} m(\\theta,t)\\sin\\theta d\\theta \\quad \\text{(2)}",
  fourierM: "m(\\theta,t) = \\sum_{n=0}^{\\infty} \\left[ a_n(t)\\sin n\\theta + b_n(t)\\cos n\\theta \\right] \\quad \\text{(3)}",
  fourierQ: "Q(\\theta) = \\sum_{n=0}^{\\infty} q_n \\cos n\\theta \\quad \\text{(4)}",
  lhs: "\\text{LHS: } \\sum_{n=0}^{\\infty} (\\dot{a}_n \\sin n\\theta + \\dot{b}_n \\cos n\\theta)",
  rhs: "\\text{RHS: } \\sum_{n=0}^{\\infty} q_n \\cos n\\theta - K \\sum_{n=0}^{\\infty} (a_n \\sin n\\theta + b_n \\cos n\\theta) - \\omega \\sum_{n=0}^{\\infty} (n a_n \\cos n\\theta - n b_n \\sin n\\theta)",
  coeffSin: "\\dot{a}_n = n\\omega b_n - Ka_n",
  coeffCos: "\\dot{b}_n = -n\\omega a_n - Kb_n + q_n",
  torqueInt: "I\\dot{\\omega} = -\\nu\\omega + gr \\int_0^{2\\pi} \\left[ \\sum_{n=0}^{\\infty} a_n(t)\\sin n\\theta + b_n(t)\\cos n\\theta \\right] \\sin\\theta d\\theta",
  torqueReduced1: "I\\dot{\\omega} = -\\nu\\omega + gr \\int_0^{2\\pi} a_1 \\sin^2\\theta d\\theta",
  torqueReduced2: "\\implies I\\dot{\\omega} = -\\nu\\omega + \\pi gr a_1",
  activeSys: "\\begin{cases} \\dot{a}_1 = \\omega b_1 - Ka_1 \\\\ \\dot{b}_1 = -\\omega a_1 - Kb_1 + q_1 \\\\ \\dot{\\omega} = (-\\nu\\omega + \\pi gr a_1) / I \\end{cases}",
  fpRest: "(a_1^*, b_1^*, \\omega^*) = \\left(0, \\frac{q_1}{K}, 0\\right)",
  fpOmegaSolve1: "\\frac{\\omega b_1}{K} = \\frac{\\nu\\omega}{\\pi gr} \\implies \\omega\\left( \\frac{b_1}{K} - \\frac{\\nu}{\\pi gr} \\right) = 0",
  fpOmegaSolve2: "\\omega \\left(\\frac{\\omega b_1}{K}\\right) + Kb_1 = q_1 \\implies b_1 \\left( \\frac{\\omega^2 + K^2}{K} \\right) = q_1 \\implies b_1 = \\frac{K q_1}{\\omega^2 + K^2}",
  fpOmegaSolve3: "\\frac{\\nu K}{\\pi gr} = \\frac{K q_1}{\\omega^2 + K^2} \\implies \\frac{\\nu}{\\pi gr} = \\frac{q_1}{\\omega^2 + K^2}",
  fpOmega: "\\implies (\\omega^*)^2 = \\frac{\\pi gr q_1}{\\nu} - K^2",
  rayleigh: "R = \\frac{\\pi gr q_1}{\\nu K^2}",
  volDeriv1: "V(t+dt) = V(t) + \\int_S (\\vec{f} \\cdot \\vec{n} dt) dA",
  volDeriv2: "\\implies \\dot{V} = \\frac{V(t+dt) - V(t)}{dt} = \\int_S \\vec{f} \\cdot \\vec{n} dA",
  volDeriv3: "\\implies \\dot{V} = \\int_V \\nabla \\cdot \\vec{f} dV",
  lorenzDiv: "\\nabla \\cdot \\vec{f} = \\frac{\\partial}{\\partial x}[\\sigma(y-x)] + \\frac{\\partial}{\\partial y}[rx-y-xz] + \\frac{\\partial}{\\partial z}[xy-bz] = -\\sigma - 1 - b < 0",
  volDeriv4: "\\implies \\dot{V} = \\int_V (-\\sigma - 1 - b) dV = -(\\sigma + 1 + b)V",
  volSol: "\\implies V(t) = V(0)e^{-(\\sigma + 1 + b)t}",
  fpSym: "x^* = y^* = \\pm\\sqrt{b(r-1)}, \\quad z^* = r-1",
  linearOrigin: "\\begin{pmatrix} \\dot{x} \\\\ \\dot{y} \\end{pmatrix} = \\begin{pmatrix} -\\sigma & \\sigma \\\\ r & -1 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix}",
  traceDet: "\\tau = -\\sigma - 1 < 0, \\quad \\Delta = \\sigma(1 - r)",
  tauDelta: "\\tau^2 - 4\\Delta = (-\\sigma - 1)^2 - 4\\sigma(1-r) = (\\sigma - 1)^2 + 4\\sigma r > 0",
  lyap: "V(x,y,z) = \\frac{1}{\\sigma}x^2 + y^2 + z^2",
  lyapDot1: "\\frac{1}{2}\\dot{V} = \\frac{1}{\\sigma}x\\dot{x} + y\\dot{y} + z\\dot{z}",
  lyapDot2: "= x(y-x) + y(rx-y-xz) + z(xy-bz)",
  lyapDot3: "= (xy - x^2) + (rxy - y^2 - xyz) + (zxy - bz^2)",
  lyapDot4: "= (r+1)xy - x^2 - y^2 - bz^2",
  lyapDot5: "\\implies \\frac{1}{2}\\dot{V} = - \\left[ x - \\frac{r+1}{2}y \\right]^2 - \\left[ 1 - \\left(\\frac{r+1}{2}\\right)^2 \\right]y^2 - bz^2",
  hopfC: "r_H = \\frac{\\sigma(\\sigma+b+3)}{\\sigma-b-1}"
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
        <h2 className="text-red-400 mb-4">⚠️ System Crash</h2>
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
  return <span ref={container} className="mx-1 font-serif text-red-200/90">{`$${tex}$`}</span>;
};

// =========================================================
// 核心交互实验：3D 局部相空间与亚临界 Hopf 分叉图并排
// =========================================================
const BifurcationInteractiveLab = () => {
  const [r, setR] = useState(20.0);
  const rH = 24.74; 
  const bParam = 2.667;
  
  const canvasRef = useRef(null);
  const timeRef = useRef(0);
  const animationRef = useRef(null);

  // 渲染精准的 3D 教科书式图表
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 + 10 };
    const scale = 40; 

    // 判断局部参数，若 r < rH 存在环
    const hasCycle = r < rH;
    const cycleRadius = hasCycle ? Math.sqrt(rH - r) * 0.8 : 0; 

    const renderLoop = () => {
      ctx.clearRect(0, 0, width, height);
      timeRef.current += 0.05;
      const t = timeRef.current;

      // 固定的 3D 视角投影：绕 Y 轴转一点，再绕 X 轴倾斜，完美契合你的手写笔记图12
      const pitch = 0.5; // 倾角
      const yaw = 0.3;   // 旋转
      
      const project = (x, y, z) => {
        // Yaw
        const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
        const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
        const z1 = z;
        // Pitch
        const x2 = x1;
        const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
        // 映射
        return { sx: center.x + x2 * scale, sy: center.y - y2 * scale };
      };

      // 1. 绘制 2D 稳定流形平面 (透明灰色带白边)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      let p1 = project(-3, -3, 0); ctx.moveTo(p1.sx, p1.sy);
      let p2 = project(3, -3, 0); ctx.lineTo(p2.sx, p2.sy);
      let p3 = project(3, 3, 0); ctx.lineTo(p3.sx, p3.sy);
      let p4 = project(-3, 3, 0); ctx.lineTo(p4.sx, p4.sy);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      // 2. 绘制 Z 轴 (不稳定流形)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.setLineDash([4, 4]);
      let zBottom = project(0, 0, -4); ctx.moveTo(zBottom.sx, zBottom.sy);
      let zTop = project(0, 0, 4); ctx.lineTo(zTop.sx, zTop.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. 绘制 Saddle Cycle (红色虚线环)
      if (hasCycle) {
        ctx.beginPath();
        ctx.strokeStyle = '#ef4444'; // 红色
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        for(let a=0; a<=Math.PI*2.05; a+=0.1) {
          let pt = project(cycleRadius * Math.cos(a), cycleRadius * Math.sin(a), 0);
          if(a===0) ctx.moveTo(pt.sx, pt.sy); else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 4. 绘制中心不动点 C+
      const cp = project(0, 0, 0);
      ctx.beginPath();
      ctx.fillStyle = hasCycle ? '#22d3ee' : '#ef4444'; 
      ctx.arc(cp.sx, cp.sy, 4, 0, 2*Math.PI);
      ctx.fill();

      // 5. 绘制理论轨迹与动态引导箭头
      // 5A: 稳定流形的内螺旋 (被吸入 C+)
      const drawInnerSpiral = () => {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
        for(let a = 0; a <= 15; a += 0.2) {
          let rad = hasCycle ? cycleRadius * Math.exp(-0.2 * a) : 2.5 * Math.exp(-0.2 * a);
          let pt = project(rad * Math.cos(a), rad * Math.sin(a), 0);
          if(a===0) ctx.moveTo(pt.sx, pt.sy); else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.stroke();
        
        // 动态点
        let phase = (t % 15);
        let dynRad = hasCycle ? cycleRadius * Math.exp(-0.2 * phase) : 2.5 * Math.exp(-0.2 * phase);
        let dpt = project(dynRad * Math.cos(phase), dynRad * Math.sin(phase), 0);
        ctx.beginPath(); ctx.fillStyle = '#22d3ee'; ctx.arc(dpt.sx, dpt.sy, 3, 0, 2*Math.PI); ctx.fill();
      };
      drawInnerSpiral();

      // 5B: 不稳定流形的外螺旋 (逃逸，仅当有鞍形环，或者本身 C+ 已经失稳)
      const drawEscapeTrajectory = () => {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
        for(let a = 0; a <= 8; a += 0.2) {
          let baseRad = hasCycle ? cycleRadius : 0.1;
          let rad = baseRad * Math.exp(0.1 * a);
          let zVal = 0.05 * Math.exp(0.4 * a); // 逃逸时沿Z轴飞出
          let pt = project(rad * Math.cos(a), rad * Math.sin(a), zVal);
          if(a===0) ctx.moveTo(pt.sx, pt.sy); else ctx.lineTo(pt.sx, pt.sy);
        }
        ctx.stroke();
        
        // 动态点
        let phase = (t % 8);
        let baseRad = hasCycle ? cycleRadius : 0.1;
        let dynRad = baseRad * Math.exp(0.1 * phase);
        let zVal = 0.05 * Math.exp(0.4 * phase);
        let dpt = project(dynRad * Math.cos(phase), dynRad * Math.sin(phase), zVal);
        ctx.beginPath(); ctx.fillStyle = '#f472b6'; ctx.arc(dpt.sx, dpt.sy, 3, 0, 2*Math.PI); ctx.fill();
      };
      drawEscapeTrajectory();

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationRef.current);
  }, [r]);

  // 精准生成 SVG 分叉图路径（修复向左的抛物线）
  const svgPaths = useMemo(() => {
    // 映射函数：r 取 [0, 35]，映射到 x 取 [20, 380]
    const mapR = (r_val) => 20 + r_val * 10;
    // 映射函数：x 的值映射到 y 轴，中心 150
    const mapX = (x_val) => 150 - x_val * 12;

    let pathOriginSolid = `M ${mapR(0)} 150 L ${mapR(1)} 150`;
    let pathOriginDashed = `M ${mapR(1)} 150 L ${mapR(35)} 150`;

    let pathCPlusSolid = ""; let pathCMinusSolid = "";
    let pathCPlusDashed = ""; let pathCMinusDashed = "";
    let cycleTop1 = ""; let cycleTop2 = ""; 
    let cycleBot1 = ""; let cycleBot2 = "";

    for (let r_val = 1; r_val <= 35; r_val += 0.5) {
      let rx = mapR(r_val);
      let cx = Math.sqrt(bParam * (r_val - 1));

      if (r_val <= rH) {
        pathCPlusSolid += (pathCPlusSolid===""?'M':' L') + `${rx} ${mapX(cx)}`;
        pathCMinusSolid += (pathCMinusSolid===""?'M':' L') + `${rx} ${mapX(-cx)}`;
        
        // 生成完美的向左开口抛物线 (Unstable Saddle Cycle)
        // 鞍形环在 rH 时振幅为0，向左 r 越小振幅越大
        if (r_val >= 10) {
          let cycleAmp = 1.0 * Math.sqrt(rH - r_val); // 振幅因子
          cycleTop1 += (cycleTop1===""?'M':' L') + `${rx} ${mapX(cx + cycleAmp)}`;
          cycleTop2 += (cycleTop2===""?'M':' L') + `${rx} ${mapX(cx - cycleAmp)}`;
          cycleBot1 += (cycleBot1===""?'M':' L') + `${rx} ${mapX(-cx + cycleAmp)}`;
          cycleBot2 += (cycleBot2===""?'M':' L') + `${rx} ${mapX(-cx - cycleAmp)}`;
        }
      } else {
        pathCPlusDashed += (pathCPlusDashed===""?'M':' L') + `${rx} ${mapX(cx)}`;
        pathCMinusDashed += (pathCMinusDashed===""?'M':' L') + `${rx} ${mapX(-cx)}`;
      }
    }
    
    return { mapR, mapX, pathOriginSolid, pathOriginDashed, pathCPlusSolid, pathCMinusSolid, pathCPlusDashed, pathCMinusDashed, cycleTop1, cycleTop2, cycleBot1, cycleBot2 };
  }, []);

  return (
    <div className="my-10 p-6 md:p-8 bg-black/60 border border-white/10 rounded-2xl shadow-2xl font-mono">
      {/* 采用双栏并排布局，压缩尺寸 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* 左侧：精简 3D 教科书式图解 */}
        <div className="relative w-full aspect-square max-w-[400px] mx-auto bg-[#050b14] rounded-xl border border-white/5 shadow-inner overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />
          <div className="absolute top-4 left-4 text-[10px] text-white/40 uppercase tracking-widest font-bold">Fig 12. 3D Phase Space (Local C+)</div>
          <div className="absolute bottom-4 right-4 text-[9px] text-right space-y-1">
            <div className="text-cyan-400">Stable Manifold (In)</div>
            <div className="text-pink-400">Unstable Manifold (Out)</div>
            <div className="text-red-500">-- Saddle Cycle</div>
          </div>
        </div>

        {/* 右侧：SVG 分叉图与控制面板 */}
        <div className="w-full flex flex-col justify-between h-full space-y-6 max-w-[400px] mx-auto">
          
          <div className="relative w-full aspect-video bg-white/[0.02] rounded-xl border border-white/5 shadow-inner p-2">
            <div className="absolute top-2 left-3 text-[10px] text-white/40 uppercase tracking-widest font-bold">Fig 13. Subcritical Hopf Map</div>
            <svg width="100%" height="100%" viewBox="0 0 400 300" className="overflow-visible mt-2">
              {/* Origin */}
              <path d={svgPaths.pathOriginSolid} fill="none" stroke="#22d3ee" strokeWidth="2" />
              <path d={svgPaths.pathOriginDashed} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
              
              {/* Stable Branches */}
              <path d={svgPaths.pathCPlusSolid} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
              <path d={svgPaths.pathCMinusSolid} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
              
              {/* Unstable Branches */}
              <path d={svgPaths.pathCPlusDashed} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d={svgPaths.pathCMinusDashed} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" />
              
              {/* Unstable Saddle Cycles (完美还原向左开口的虚线抛物线) */}
              <path d={svgPaths.cycleTop1} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d={svgPaths.cycleTop2} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d={svgPaths.cycleBot1} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d={svgPaths.cycleBot2} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3 3" />

              {/* Scanning Indicator */}
              <line x1={svgPaths.mapR(r)} y1="10" x2={svgPaths.mapR(r)} y2="290" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
              { r > 1 && r <= rH && (
                <circle cx={svgPaths.mapR(r)} cy={svgPaths.mapX(Math.sqrt(bParam*(r-1)))} r="4" fill="#22d3ee" className="animate-pulse" />
              )}
              { r > rH && (
                <circle cx={svgPaths.mapR(r)} cy={svgPaths.mapX(Math.sqrt(bParam*(r-1)))} r="4" fill="#ef4444" className="animate-pulse" />
              )}
            </svg>
          </div>

		  <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 shadow-inner space-y-3">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Rayleigh Number [r]:</span>
              <span className="text-red-300 font-mono bg-white/5 px-2 py-0.5 rounded">{r.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="15.0" max="30.0" step="0.1" value={r} 
              onChange={(e) => setR(parseFloat(e.target.value))} 
              className="w-full accent-red-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2" 
            />
            <div className="text-[10px] text-white/40 pt-2 flex justify-between items-center">
               <div>Critical r<sub>H</sub> ≈ 24.74</div>
               <div className="text-right text-pink-400 font-bold">
                 {r < rH ? "Saddle Cycle Restrains" : "Boundary Crushed"}
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// =========================================================
// 页面主逻辑
// =========================================================
const ChaosLogLorenz = () => {
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
    <LogLayout title="CHAOS 4: LORENZ EQ. & SADDLE CYCLE" category="RESEARCH" date="2026-04-28">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <p>
            In 1963, Ed Lorenz formulated a simplified mathematical model for atmospheric convection. Over a wide range of parameters, he discovered that its solutions oscillate erratically and <em>never exactly repeat</em>. This profound discovery laid the foundation for Chaos Theory.
          </p>
          <MathDisplay tex={FORMULAS.lorenz} katexReady={katexReady} />
          <p>
            To describe this erratic motion physically, we can dynamically map these abstract equations to an elegant mechanical model: the <strong>Chaotic Water Wheel</strong>.
          </p>
        </section>

        {/* 1. Chaotic Water Wheel */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. The Chaotic Water Wheel Model</h3>
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figWaterWheel} 
              alt="Chaotic Water Wheel States" 
              className="w-full object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Three fundamental states of the water wheel based on inflow speed.
            </figcaption>
          </figure>

          <p className="font-bold text-red-400 mt-4">Physical Behavior:</p>
          <ul className="list-decimal list-inside space-y-2 text-white/70 ml-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <li><strong>Too slow:</strong> If the inflow is too slow, the wheel keeps motionless (friction dominates).</li>
            <li><strong>Particular speed:</strong> At a moderate flow, the wheel achieves a steady rotation in one direction.</li>
            <li><strong>Go faster (Chaos):</strong> If the inflow is extremely fast, the wheel rotates one way for some time, then abruptly reverses! It becomes impossible to predict the rotation direction erratically.</li>
          </ul>

          <h4 className="font-bold text-red-400 mt-6">Variables to Describe the Wheel's Motion</h4>
          <p>Looking from the top view of the wheel:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/70 text-xs mt-2 bg-white/[0.02] p-4 rounded-xl">
            <li><InlineMath tex="\theta =" katexReady={katexReady}/> angle in lab frame.</li>
            <li><InlineMath tex="\omega(t) =" katexReady={katexReady}/> angular velocity.</li>
            <li><InlineMath tex="m(\theta, t) =" katexReady={katexReady}/> mass distribution of water around the rim.</li>
            <li><InlineMath tex="Q =" katexReady={katexReady}/> inflow rate (pump in).</li>
            <li><InlineMath tex="r =" katexReady={katexReady}/> radius of the wheel.</li>
            <li><InlineMath tex="K =" katexReady={katexReady}/> leakage rate (leaks out).</li>
            <li><InlineMath tex="\nu =" katexReady={katexReady}/> rotation damping rate.</li>
            <li><InlineMath tex="I =" katexReady={katexReady}/> moment of inertia of the wheel.</li>
          </ul>
        </section>

        {/* 2. Deriving Governing Equations */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Deriving the Governing Equations</h3>
          
          <h4 className="font-bold text-red-400 mt-6">Conservation of Mass (The Continuity Equation)</h4>
          <p>
            Consider a fixed sector region between <InlineMath tex="\theta_1" katexReady={katexReady}/> and <InlineMath tex="\theta_2" katexReady={katexReady}/>. The mass variation <InlineMath tex="\Delta M" katexReady={katexReady}/> over a time interval <InlineMath tex="\Delta t" katexReady={katexReady}/> is composed of four logical contributions:
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figSector} 
              alt="Mass Variation Sector" 
              className="max-w-[300px] mx-auto object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. The mass transfer across the sector boundaries.
            </figcaption>
          </figure>

          <MathDisplay tex={FORMULAS.massVar1} katexReady={katexReady} />
          <p>This logically breaks down into:</p>
          <MathDisplay tex={FORMULAS.massVar2} katexReady={katexReady} />
          
          <p>
            By calculus, we can elegantly rewrite the rotational transport term (region in/out) as a spatial integral:
          </p>
          <MathDisplay tex={FORMULAS.massDeriv} katexReady={katexReady} />
          <p>
            Dividing the entire equation by <InlineMath tex="\Delta t" katexReady={katexReady}/> and taking the limit <InlineMath tex="\Delta t \to 0" katexReady={katexReady}/>:
          </p>
          <MathDisplay tex={FORMULAS.continuityPre1} katexReady={katexReady} />
          <p>By the integral definition of total mass <InlineMath tex="M(t)" katexReady={katexReady}/>, we also have:</p>
          <MathDisplay tex={FORMULAS.continuityPre2} katexReady={katexReady} />
          <p>
            Equating the integrands for an arbitrary sector yields the <strong>Continuity Equation</strong> for mass:
          </p>
          <MathDisplay tex={FORMULAS.continuityEq} katexReady={katexReady} />

          <h4 className="font-bold text-red-400 mt-6">Torque Balance</h4>
          <p>
            Using Newton's Second Law for rotation: <InlineMath tex="I\dot{\omega} = \Sigma \tau = \text{damping torque} + \text{gravitation torque}" katexReady={katexReady}/>.
            The gravitation torque caused by each infinitesimal mass <InlineMath tex="dm" katexReady={katexReady}/> produces a combined torque of:
          </p>
          <MathDisplay tex={FORMULAS.torqueGrav1} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.torqueGrav2} katexReady={katexReady} />
          <p>Combining this with the linear damping torque (<InlineMath tex="-\nu\omega" katexReady={katexReady}/>) gives the angular velocity equation:</p>
          <MathDisplay tex={FORMULAS.torqueEq} katexReady={katexReady} />
        </section>

        {/* 3. Fourier Analysis */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Fourier Analysis & System Reduction</h3>
          <p>
            We have an integro-partial differential system. We need <strong>Fourier analysis</strong> to rebuild and simplify the entire system. We expand <InlineMath tex="m" katexReady={katexReady}/> and <InlineMath tex="Q" katexReady={katexReady}/> into Fourier series:
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.fourierM} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.fourierQ} katexReady={katexReady} />
          </div>
          <p className="text-xs text-white/50 italic">Note: Since inflow is symmetrically added at the top, <InlineMath tex="-\theta" katexReady={katexReady}/> is the same as <InlineMath tex="\theta" katexReady={katexReady}/>, so there are no <InlineMath tex="\sin n\theta" katexReady={katexReady}/> terms in <InlineMath tex="Q(\theta)" katexReady={katexReady}/>.</p>

          <p>Substitute the series into the continuity equation and evaluate the spatial derivative:</p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2 text-sm">
            <MathDisplay tex={FORMULAS.lhs} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.rhs} katexReady={katexReady} />
          </div>
          
          <p>Because <InlineMath tex="\sin n\theta" katexReady={katexReady}/> and <InlineMath tex="\cos n\theta" katexReady={katexReady}/> are orthogonal functions, we can equate their coefficients directly:</p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.coeffSin} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.coeffCos} katexReady={katexReady} />
          </div>

          <p>Substituting into the Torque Balance equation creates a mathematical marvel:</p>
          <MathDisplay tex={FORMULAS.torqueInt} katexReady={katexReady} />
          <p>Due to orthogonality, the integral collapses entirely to just the <InlineMath tex="n=1" katexReady={katexReady}/> sine term!</p>
          <MathDisplay tex={FORMULAS.torqueReduced1} katexReady={katexReady} />
          <p>Since <InlineMath tex="\int_0^{2\pi} \sin^2\theta d\theta = \pi" katexReady={katexReady}/>:</p>
          <MathDisplay tex={FORMULAS.torqueReduced2} katexReady={katexReady} />

		  <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-red-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(239,68,68,0.02)]">
            <h4 className="text-red-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: The Miracle of Decoupling</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              Through this derivation, the notes rigorously prove that <InlineMath tex="\dot{\omega}" katexReady={katexReady}/> is <strong>only related to</strong> <InlineMath tex="a_1" katexReady={katexReady}/>. For all <InlineMath tex="n \neq 1" katexReady={katexReady}/>, the infinitely many higher-order Fourier modes <InlineMath tex="a_n, b_n" katexReady={katexReady}/> are completely decoupled from the macroscopic rotation of the water wheel. This is exactly why we can perfectly collapse the complex partial differential equation into a 3D ordinary differential equation system!
            </p>
          </div>

          <p className="mt-4">The final reduced active system is exactly equivalent to the Lorenz Equations:</p>
          <MathDisplay tex={FORMULAS.activeSys} katexReady={katexReady} />
        </section>

        {/* 4. Fixed Points & Rayleigh Number */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Fixed Points & The Rayleigh Number</h3>
          <p>
            We are concerned about the steady states. Setting the derivatives to 0 reveals two distinct branches of fixed points:
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.fpOmegaSolve1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.fpOmegaSolve2} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.fpOmegaSolve3} katexReady={katexReady} />
          </div>
          
          <h4 className="font-bold text-red-400 mt-4">Case 1: The Wheel is at Rest (<InlineMath tex="\omega = 0" katexReady={katexReady}/>)</h4>
          <MathDisplay tex={FORMULAS.fpRest} katexReady={katexReady} />

          <h4 className="font-bold text-red-400 mt-4">Case 2: Steady Rotation (<InlineMath tex="\omega \neq 0" katexReady={katexReady}/>)</h4>
          <MathDisplay tex={FORMULAS.fpOmega} katexReady={katexReady} />
          
          <p>
            To have real solutions for steady rotation, the right side must be positive. We define the dimensionless <strong>Rayleigh Number (<InlineMath tex="R" katexReady={katexReady}/>)</strong>:
          </p>
          <MathDisplay tex={FORMULAS.rayleigh} katexReady={katexReady} />
          
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4 mt-4">
            <li><InlineMath tex="R < 1" katexReady={katexReady}/> : Stable rest.</li>
            <li><InlineMath tex="R > 1" katexReady={katexReady}/> : Stable <InlineMath tex="\omega^*" katexReady={katexReady}/> (steady rotation in 2 symmetric directions).</li>
            <li><InlineMath tex="R > R_H" katexReady={katexReady}/> : Chaos (where <InlineMath tex="R_H" katexReady={katexReady}/> is the critical value for Hopf bifurcation).</li>
          </ul>
        </section>

        {/* 5. Properties */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Properties of the Lorenz Equations</h3>
          <p>
            Returning to the standard Lorenz variables, the system exhibits three profound properties:
          </p>
          <ul className="list-decimal list-inside space-y-2 text-white/70 ml-4">
            <li><strong>Nonlinearity:</strong> The only nonlinearities are the quadratic terms <InlineMath tex="xy" katexReady={katexReady}/> and <InlineMath tex="xz" katexReady={katexReady}/>.</li>
            <li><strong>Symmetry:</strong> The transformation <InlineMath tex="(x,y) \to (-x,-y)" katexReady={katexReady}/> leaves the system unchanged.</li>
            <li><strong>Volume Contraction:</strong> The Lorenz system is <em>dissipative</em>, volumes in phase space contract under the flow.</li>
          </ul>
          
          <h4 className="font-bold text-red-400 mt-4">Detailed Proof of Volume Contraction</h4>
          <p>
            Think of an arbitrary 3D system <InlineMath tex="\dot{\vec{x}} = \vec{f}(\vec{x})" katexReady={katexReady}/> and an arbitrary closed surface <InlineMath tex="S(t)" katexReady={katexReady}/> with Volume <InlineMath tex="V(t)" katexReady={katexReady}/> in phase space. 
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figVolume} 
              alt="Volume Contraction Surface" 
              className="max-w-[400px] mx-auto object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 3. A closed volume <InlineMath tex="V(t)" katexReady={katexReady}/> evolving into <InlineMath tex="V(t+dt)" katexReady={katexReady}/> in phase space.
            </figcaption>
          </figure>

          <p>The rate of volume change is governed by the outer normal component velocity:</p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.volDeriv1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.volDeriv2} katexReady={katexReady} />
          </div>
          <p>Rewrite the integral by the <strong>Divergence Theorem</strong>:</p>
          <MathDisplay tex={FORMULAS.volDeriv3} katexReady={katexReady} />
          
          <p>For the Lorenz system specifically, the divergence of the vector field is a strictly negative constant:</p>
          <MathDisplay tex={FORMULAS.lorenzDiv} katexReady={katexReady} />
          
          <p>This implies that volumes in phase space shrink exponentially fast to zero!</p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.volDeriv4} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.volSol} katexReady={katexReady} />
          </div>
          
          <p className="bg-white/5 p-4 border-l-2 border-red-500/50 text-sm italic mt-4">
            <strong>Conclusion:</strong> If we start with an enormous solid of initial conditions, it will eventually shrink to a limiting set of zero volume. It still has shape in 3D space (fixed points, limit cycles, or a <em>strange attractor</em>), but essentially no volume. 
            Also, it's impossible for the Lorenz system to have either repelling fixed points or repelling closed orbits.
          </p>
        </section>

        {/* 6. Stability & Bifurcation */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Stability of Fixed Points & Bifurcation</h3>
          <p>
            The fixed point at the origin <InlineMath tex="(0,0,0)" katexReady={katexReady}/> is a fixed point for all values of parameters. For <InlineMath tex="r > 1" katexReady={katexReady}/>, a symmetric pair emerges (which Lorenz called <InlineMath tex="C^+" katexReady={katexReady}/> & <InlineMath tex="C^-" katexReady={katexReady}/>):
          </p>
          <MathDisplay tex={FORMULAS.fpSym} katexReady={katexReady} />
          <p>As <InlineMath tex="r \to 1^+" katexReady={katexReady}/>, <InlineMath tex="C^+" katexReady={katexReady}/> and <InlineMath tex="C^-" katexReady={katexReady}/> coalesce with the origin in a <strong>pitchfork bifurcation</strong>.</p>

          <h4 className="font-bold text-red-400 mt-6">Linear Stability of the Origin</h4>
          <p>Linearization near the origin drops the nonlinearities (<InlineMath tex="xy, xz \to 0" katexReady={katexReady}/>):</p>
          <MathDisplay tex={FORMULAS.linearOrigin} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.traceDet} katexReady={katexReady} />
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li>If <InlineMath tex="r > 1" katexReady={katexReady}/>, the origin is a <strong>saddle point</strong>, since <InlineMath tex="\Delta < 0" katexReady={katexReady}/>.</li>
            <li>If <InlineMath tex="r < 1" katexReady={katexReady}/>, all directions are incoming & the origin is a <strong>sink</strong>. Since <InlineMath tex={FORMULAS.tauDelta} katexReady={katexReady}/>, the origin is a <strong>stable node</strong>.</li>
          </ul>

          <h4 className="font-bold text-red-400 mt-6">Global Stability of the Origin (<InlineMath tex="r < 1" katexReady={katexReady}/>)</h4>
          <p>
            For <InlineMath tex="r < 1" katexReady={katexReady}/>, we can show that every trajectory approaches the origin as <InlineMath tex="t \to \infty" katexReady={katexReady}/>; the origin is <strong>globally stable</strong>.
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figEllipsoid} 
              alt="Liapunov Concentric Ellipsoids" 
              className="max-w-[400px] mx-auto object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 4. The surfaces of constant <InlineMath tex="V" katexReady={katexReady}/> are concentric ellipsoids about the origin.
            </figcaption>
          </figure>

          <p>
            <strong>Proof (Liapunov Function):</strong> Consider <InlineMath tex={FORMULAS.lyap} katexReady={katexReady}/>. Taking the time derivative along trajectories:
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.lyapDot1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.lyapDot2} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.lyapDot3} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.lyapDot4} katexReady={katexReady} />
          </div>

          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-red-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(239,68,68,0.02)]">
            <h4 className="text-red-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: Forced Completion of the Square</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              The notes exhibit masterful algebraic technique here. Notice how the <InlineMath tex="+xyz" katexReady={katexReady}/> and <InlineMath tex="-xyz" katexReady={katexReady}/> terms cancel perfectly! To prove that this expression is strictly negative when <InlineMath tex="r < 1" katexReady={katexReady}/>, we force the cross term <InlineMath tex="xy" katexReady={katexReady}/> to distribute and <em>complete the square</em>. This ultimate verdict mathematically severs any possibility of chaos for low energy states.
            </p>
          </div>

          <MathDisplay tex={FORMULAS.lyapDot5} katexReady={katexReady} />
          <p>
            Since <InlineMath tex="r < 1" katexReady={katexReady}/>, the coefficient <InlineMath tex="\left[ 1 - \left(\frac{r+1}{2}\right)^2 \right] > 0" katexReady={katexReady}/>.
            So, <InlineMath tex="\dot{V} = 0 \implies (x,y,z) = 0" katexReady={katexReady}/>, otherwise <InlineMath tex="\dot{V} < 0" katexReady={katexReady}/>. Trajectories keep moving to lower <InlineMath tex="V" katexReady={katexReady}/>, penetrating smaller ellipsoids. Hence the claim is established.
          </p>

          <h4 className="font-bold text-red-400 mt-6">Stability of <InlineMath tex="C^+" katexReady={katexReady}/> & <InlineMath tex="C^-" katexReady={katexReady}/> and the Route to Chaos</h4>
          <p>
            For <InlineMath tex="r > 1" katexReady={katexReady}/>, <InlineMath tex="C^+" katexReady={katexReady}/> and <InlineMath tex="C^-" katexReady={katexReady}/> exist and are linearly stable up until a critical Hopf bifurcation threshold:
          </p>
          <MathDisplay tex={FORMULAS.hopfC} katexReady={katexReady} />
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figSaddleCycle} 
              alt="Saddle Cycle near Fixed Point" 
              className="max-w-[400px] mx-auto object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 5. For <InlineMath tex="r < r_H" katexReady={katexReady}/>, the phase portrait near <InlineMath tex="C^+" katexReady={katexReady}/> has a saddle cycle around it.
            </figcaption>
          </figure>

          <p>
            At <InlineMath tex="r_H" katexReady={katexReady}/>, there is a <strong>Hopf bifurcation</strong>. After bifurcation (<InlineMath tex="r" katexReady={katexReady}/> slightly greater than <InlineMath tex="r_H" katexReady={katexReady}/>), the Hopf bifurcation is <strong>subcritical</strong>—the limit cycles are unstable & exist only for <InlineMath tex="r < r_H" katexReady={katexReady}/>.
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figSubcritical} 
              alt="Subcritical Hopf Bifurcation" 
              className="max-w-[400px] mx-auto object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 6. At Hopf bifurcation, the fixed point absorbs the saddle cycle and changes into a saddle point.
            </figcaption>
          </figure>

          <p>
            <strong>What happens when <InlineMath tex="r > r_H" katexReady={katexReady}/>?</strong><br/>
            The fixed points absorb their surrounding saddle cycles and become unstable themselves. In this regime, there are <strong>absolutely no stable attractors</strong> (no stable fixed points, no stable limit cycles).
            <br/><br/>
            Yet, because of volume contraction, trajectories cannot fly off to infinity; they must remain confined to a bounded set of zero volume. The particles are repelled from one unstable object after another, forced to wander endlessly without ever intersecting their own past paths. 
            <br/><br/>
            This mathematical impossibility in 2D forces the 3D existence of the <strong>Strange Attractor</strong>.
          </p>
        </section>

        {/* 7. Interactive Hologram Lab */}
        <section className="space-y-4 pt-8">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">7. Interactive Lab: Saddle Cycle & Subcritical Hopf</h3>
          <p>
            Instead of observing the global Strange Attractor (which we will save for the finale), let's zoom in on a 3D cross-section near the fixed point <InlineMath tex="C^+" katexReady={katexReady}/>. 
            This lab integrates the dual visual perspectives from <strong>Figure 5</strong> (3D Phase Space) and <strong>Figure 6</strong> (Bifurcation Diagram) into one interactive engine.
          </p>
          <BifurcationInteractiveLab />
        </section>

        {/* Postscript */}
        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <div className="inline-block px-10 py-5 bg-red-600/10 border border-red-500/30 text-red-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(239,68,68,0.1)]">
            Attractor Bound. Boundaries Crushed.
          </div>
          <p className="text-xs text-white/30 tracking-[0.2em] font-light italic mt-8 max-w-2xl mx-auto leading-relaxed">
            "The saddle cycle acts as a fragile wall of stability. Once the bifurcation parameter crushes that boundary, all trajectories are cast out into the mathematical abyss, setting the perfect stage for the birth of true Chaos."
          </p>

          {/* References */}
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

export default function ChaosLog4Wrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogLorenz />
    </ErrorBoundary>
  );
}