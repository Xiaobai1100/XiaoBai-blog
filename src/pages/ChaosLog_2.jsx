import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// 1. 正常导入 Layout 组件 (在预览环境中暂时注释，复制到本地时请取消注释)
// =========================================================
import LogLayout from '../components/LogLayout';

// =========================================================
// 2. 正常导入你放在 assets 文件夹中的本地真实图片 (在预览环境中暂时注释，复制到本地时请取消注释)
// =========================================================
import bzReaction from '../assets/Figure_3.png';
import phasePortrait from '../assets/Figure_4.png';
import classification from '../assets/Figure_5.png';

// =========================================================
// 🛡️ 静态资源隔离区 (完全防爆机制，防止 Vercel 编译崩溃)
// =========================================================
const FORMULAS = {
  oneD: "\\dot{x} = f(x)",
  oneDEx: "\\dot{x} = r + x^2",
  twoD: "\\begin{cases} \\dot{x} = f(x, y) \\\\ \\dot{y} = g(x, y) \\end{cases}",
  nullclinesDef: "\\dot{x} = 0 \\quad \\text{and} \\quad \\dot{y} = 0",
  linearization: "u = x - x^*, \\quad v = y - y^*",
  jacobian: "A = \\begin{pmatrix} \\frac{\\partial f}{\\partial x} & \\frac{\\partial f}{\\partial y} \\\\ \\frac{\\partial g}{\\partial x} & \\frac{\\partial g}{\\partial y} \\end{pmatrix}_{(x^*, y^*)}",
  jacobianABCD: "A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
  linSys: "\\begin{pmatrix} \\dot{u} \\\\ \\dot{v} \\end{pmatrix} = A \\begin{pmatrix} u \\\\ v \\end{pmatrix}",
  bz1: "MA + I_2 \\rightarrow IMA + I^- + H^+; \\quad \\frac{d[I_2]}{dt} = -\\frac{k_{1a}[MA][I_2]}{k_{1b} + [I_2]}",
  bz2: "ClO_2 + I^- \\rightarrow ClO_2^- + \\frac{1}{2}I_2; \\quad \\frac{d[ClO_2]}{dt} = -k_2 \\frac{[ClO_2]}{[I^-]}",
  bz3: "ClO_2^- + 4I^- + 4H^+ \\rightarrow Cl^- + 2I_2 + 2H_2O; \\quad \\frac{d[ClO_2^-]}{dt} = -k_{3a}[ClO_2^-][I^-][H^+] - k_{3b}[ClO_2^-][I_2]\\frac{[I^-]}{u + [I^-]^2}",
  bzEq: "\\dot{x} = a - x - \\frac{4xy}{1+x^2}, \\quad \\dot{y} = bx \\left( 1 - \\frac{y}{1+x^2} \\right)",
  bzFixedPoint: "x^* = \\frac{a}{5}, \\quad y^* = 1 + (x^*)^2 = 1 + \\left(\\frac{a}{5}\\right)^2",
  bzJacobianEval: "J|_{(x^*, y^*)} = \\frac{1}{1+(x^*)^2} \\begin{pmatrix} 3(x^*)^2 - 5 & -4x^* \\\\ 2b(x^*)^2 & -bx^* \\end{pmatrix}",
  traceDet: "\\tau = \\text{tr}(A) = \\lambda_1 + \\lambda_2, \\quad \\Delta = \\det(A) = \\lambda_1 \\lambda_2",
  bzDet: "\\Delta = \\det(J) = \\frac{5bx^*}{1+(x^*)^2} > 0",
  hopfTrace: "\\tau = \\text{tr}(J) = \\frac{3(x^*)^2 - 5 - bx^*}{1 + (x^*)^2}",
  hopfCritical: "b_c = \\frac{3a}{5} - \\frac{25}{a}"
};

// =========================================================
// 🛡️ 错误边界防御系统
// =========================================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Caught by Error Boundary:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-white p-10 flex flex-col items-center justify-center font-mono">
          <div className="bg-red-900/50 border border-red-500 p-8 rounded-xl max-w-3xl w-full shadow-2xl">
            <h2 className="text-2xl font-black text-red-400 mb-4 tracking-widest uppercase">⚠️ System Crash Detected</h2>
            <p className="text-red-200 mb-4 font-bold">{this.state.error && this.state.error.toString()}</p>
            <div className="bg-black/60 p-4 rounded overflow-x-auto text-xs text-red-300/70 leading-relaxed">
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================
// 组件: 最安全的无状态数学渲染器
// =========================================================
const MathDisplay = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try {
        window.katex.render(tex, container.current, { throwOnError: false, displayMode: true });
      } catch (e) {
        console.error("KaTeX Render Error:", e);
      }
    }
  }, [tex, katexReady]);
  return <div ref={container} className="my-8 py-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner overflow-x-auto text-center"></div>;
};

const InlineMath = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try {
        window.katex.render(tex, container.current, { throwOnError: false, displayMode: false });
      } catch (e) {
        console.error("KaTeX Inline Error:", e);
      }
    }
  }, [tex, katexReady]);
  return <span ref={container} className="mx-1 font-serif text-cyan-200/90">{`$${tex}$`}</span>;
};

// =========================================================
// 组件: 2D 向量场交互式实验室 (Vector Field Lab - 上下布局版)
// =========================================================
const VectorFieldLab = () => {
  const [a, setA] = useState(1.3);
  const [b, setB] = useState(3.0);
  const [c, setC] = useState(1.0);
  const [d, setD] = useState(-1.0);
  
  const canvasRef = useRef(null);

  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  
  let type = "";
  if (det < 0) type = "Saddle Point";
  else if (det === 0) type = "Non-isolated Fixed Point";
  else {
    if (disc < 0) {
      if (tr > 0) type = "Unstable Spiral";
      else if (tr < 0) type = "Stable Spiral";
      else type = "Center (Neutral)";
    } else {
      if (tr > 0) type = "Unstable Node";
      else type = "Stable Node";
    }
  }

  // --- 新增：计算特征值以供显示 ---
  let lambda1Str = "";
  let lambda2Str = "";
  if (disc >= 0) {
    const l1 = (tr + Math.sqrt(disc)) / 2;
    const l2 = (tr - Math.sqrt(disc)) / 2;
    lambda1Str = l1.toFixed(2);
    lambda2Str = l2.toFixed(2);
  } else {
    const realPart = (tr / 2).toFixed(2);
    const imagPart = (Math.sqrt(-disc) / 2).toFixed(2);
    lambda1Str = `${realPart} + ${imagPart}i`;
    lambda2Str = `${realPart} - ${imagPart}i`;
  }
  // ---------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    // 加大了网格密度，使得大画布上的向量更加丰富
    const scale = 24; 
    const center = { x: width / 2, y: height / 2 };

    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, center.y); ctx.lineTo(width, center.y);
    ctx.moveTo(center.x, 0); ctx.lineTo(center.x, height);
    ctx.stroke();

    const step = 30; 
    const arrowScale = 5;

    const drawArrow = (x, y, vx, vy) => {
        const mag = Math.sqrt(vx * vx + vy * vy);
        if (mag < 0.01) return;
        
        const nvx = (vx / mag) * arrowScale * Math.min(mag, 5);
        const nvy = (vy / mag) * arrowScale * Math.min(mag, 5);

        const hue = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
        const opacity = Math.min(0.3 + mag * 0.1, 0.9);
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1.5;

        const startX = center.x + x * scale;
        const startY = center.y - y * scale; 
        const endX = startX + nvx;
        const endY = startY - nvy; 

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const angle = Math.atan2(-nvy, nvx);
        const headlen = 5;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fill();
    };

    for (let px = -width/2; px < width/2; px += step) {
        for (let py = -height/2; py < height/2; py += step) {
            const mathX = px / scale;
            const mathY = py / scale;
            const vx = a * mathX + b * mathY;
            const vy = c * mathX + d * mathY;
            drawArrow(mathX, mathY, vx, vy);
        }
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, 2 * Math.PI);
    ctx.fill();

  }, [a, b, c, d]);

  return (
    <div className="my-10 p-6 md:p-10 bg-black/60 border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="flex flex-col gap-10 items-center">
        
        {/* Canvas Section */}
        <div className="relative w-full max-w-[650px] bg-[#050b14] rounded-xl border border-white/5 shadow-inner overflow-hidden flex items-center justify-center p-2">
          <canvas ref={canvasRef} width={600} height={600} className="w-full aspect-square" />
          <div className="absolute top-6 left-6 text-xs text-white/40 uppercase tracking-widest font-bold">Phase_Space_Engine</div>
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[650px]">
          
          <div className="space-y-4">
            <h4 className="text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold border-b border-white/10 pb-2">Jacobian Matrix [A]</h4>
            <div className="grid grid-cols-2 gap-6 bg-white/[0.02] p-5 rounded-xl border border-white/5 shadow-inner">
              {[ {label: 'a', val: a, setter: setA}, {label: 'b', val: b, setter: setB}, 
                 {label: 'c', val: c, setter: setC}, {label: 'd', val: d, setter: setD} ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs text-white/50 font-bold">
                    <span>{item.label}</span>
                    <span className="text-cyan-300">{item.val.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="-3" max="3" step="0.1" value={item.val} 
                    onChange={(e) => item.setter(parseFloat(e.target.value))} 
                    className="w-full accent-cyan-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" 
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <h4 className="text-pink-400 text-xs tracking-[0.2em] uppercase font-bold border-b border-white/10 pb-2">Analysis Panel</h4>
             <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 space-y-3 text-xs shadow-inner h-full flex flex-col justify-center">
                <div className="flex justify-between items-center">
                    <span className="text-white/40 uppercase tracking-widest">Trace (τ)</span>
                    <span className="text-white font-bold text-sm bg-white/5 px-2 py-1 rounded">{tr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-white/40 uppercase tracking-widest">Determinant (Δ)</span>
                    <span className="text-white font-bold text-sm bg-white/5 px-2 py-1 rounded">{det.toFixed(2)}</span>
                </div>
                
                {/* --- 新增：特征值显示区域 --- */}
                <div className="flex justify-between items-center">
                    <span className="text-white/40 uppercase tracking-widest">Eigenvalues</span>
                    <div className="text-right flex flex-col gap-1">
                      <span className="text-white font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">λ₁ = {lambda1Str}</span>
                      <span className="text-white font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">λ₂ = {lambda2Str}</span>
                    </div>
                </div>
                {/* ----------------------------- */}

                <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-1">
                    <span className="text-white/40 uppercase tracking-widest">Topology</span>
                    <span className={`font-black text-sm tracking-wide ${det < 0 ? 'text-pink-400' : 'text-cyan-400'}`}>{type}</span>
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
const ChaosLogContinuous = () => {
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
    <LogLayout title="CHAOS 2: CONTINUOUS_DYNAMICS" category="RESEARCH" date="2026-04-22">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Introduction to Continuous Systems</h3>
          <p>
            Unlike discrete iterative maps, continuous dynamical systems involve states that evolve smoothly over time. These systems are strictly governed by <strong>Differential Equations</strong>.
          </p>
          <p>
            A milestone in this field is the discovery of <strong>Oscillating Chemical Reactions</strong>. In the 1950s, Belousov observed periodical behavior in chemical mixtures. This was initially met with intense skepticism, as it seemed to contradict the Second Law of Thermodynamics (which implies monotonic decay to equilibrium). However, these systems are simply moving toward a complex attractor in a non-equilibrium state.
          </p>
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={bzReaction} 
              alt="BZ Chemical Reaction" 
              className="w-full object-cover opacity-90 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Experimental observation of the Belousov-Zhabotinsky reaction showing color oscillation over time.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. One-Dimensional Case: <InlineMath tex="\dot{x} = f(x)" katexReady={katexReady} /></h3>
          <p>
            In the 1D case, the velocity <InlineMath tex="\dot{x}" katexReady={katexReady} /> of the system is governed solely by its current state <InlineMath tex="x" katexReady={katexReady} />.
          </p>
          
          <h4 className="font-bold text-cyan-400 mt-6">Phase Trajectory Method</h4>
          <p>
            We can geometrically determine the stability of fixed points without formally solving the ODE using the "left flow, right push" rule:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li>If <InlineMath tex="f(x) > 0" katexReady={katexReady} />: Velocity is positive, the point moves to the <strong>right</strong> (<InlineMath tex="\rightarrow" katexReady={katexReady} />).</li>
            <li>If <InlineMath tex="f(x) < 0" katexReady={katexReady} />: Velocity is negative, the point moves to the <strong>left</strong> (<InlineMath tex="\leftarrow" katexReady={katexReady} />).</li>
          </ul>

          <h4 className="font-bold text-cyan-400 mt-6">Bifurcation: Qualitative Changes</h4>
          <p>
            A <strong>Bifurcation</strong> is defined as a qualitative change in the vector field:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><strong>Quantitative Change:</strong> The exact position of a fixed point shifts slightly, but the overall phase portrait topology remains identical.</li>
            <li><strong>Qualitative Change:</strong> The number of fixed points changes (e.g., from 1 to 2, or vanishing to 0), or their intrinsic stability properties completely flip.</li>
          </ul>

          <p className="mt-4">
            <strong>Example: Saddle-Node Bifurcation</strong> (<InlineMath tex="\dot{x} = r + x^2" katexReady={katexReady} />)
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><InlineMath tex="r < 0" katexReady={katexReady} />: Two fixed points exist (one stable, one unstable).</li>
            <li><InlineMath tex="r = 0" katexReady={katexReady} />: The points violently collide into a single <strong>half-stable</strong> point.</li>
            <li><InlineMath tex="r > 0" katexReady={katexReady} />: All fixed points vanish into the complex plane; the system uniformly flows to infinity.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Two-Dimensional Case and Nullclines</h3>
          <p>
            In 2D systems described by <InlineMath tex="\dot{x} = f(x, y)" katexReady={katexReady} /> and <InlineMath tex="\dot{y} = g(x, y)" katexReady={katexReady} />, the phase space expands into a plane equipped with a complex <strong>Vector Field</strong>.
          </p>

          <h4 className="font-bold text-cyan-400 mt-6">Nullclines: The Skeleton of Phase Space</h4>
          <p>
            To intuitively grasp the dynamics of a 2D system without analyzing every single vector, we identify the <strong>Nullclines</strong>. These are the specific curves where the velocity in one of the principal directions is exactly zero:
          </p>
          <MathDisplay tex={FORMULAS.nullclinesDef} katexReady={katexReady} />
          <p>
            The profound significance of nullclines lies in their intersection. <strong>The exact points where the <InlineMath tex="x" katexReady={katexReady}/>-nullcline and <InlineMath tex="y" katexReady={katexReady}/>-nullcline intersect mathematically guarantee that <InlineMath tex="\dot{x} = \dot{y} = 0" katexReady={katexReady}/>.</strong> Therefore, these intersections uniquely define the fixed points (equilibria) of the entire continuous system.
          </p>
          
          <h4 className="font-bold text-cyan-400 mt-6">Linearization near <InlineMath tex="(x^*, y^*)" katexReady={katexReady} /></h4>
          <p>
            To understand the flow behavior near an equilibrium, we introduce tiny perturbations <InlineMath tex="u" katexReady={katexReady} /> and <InlineMath tex="v" katexReady={katexReady} />. The local dynamics are governed by the <strong>Jacobian Matrix <InlineMath tex="A" katexReady={katexReady} /></strong>:
          </p>
          <MathDisplay tex={FORMULAS.jacobian} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.linSys} katexReady={katexReady} />

          <h4 className="font-bold text-cyan-400 mt-6">Eigenvalues and Manifolds</h4>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><strong>Eigenvectors</strong> map out the primary <strong>eigendirections</strong> (the straight-line flows in the phase portrait).</li>
            <li><strong><InlineMath tex="\lambda < 0" katexReady={katexReady} /> (Stable Manifold):</strong> Fluid or trajectories flow directly into the fixed point.</li>
            <li><strong><InlineMath tex="\lambda > 0" katexReady={katexReady} /> (Unstable Manifold):</strong> Trajectories are fiercely pushed out from the fixed point.</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Classification of Fixed Points</h3>
          <p>
            The topological behavior is entirely determined by the Trace (<InlineMath tex="\tau" katexReady={katexReady} />) and Determinant (<InlineMath tex="\Delta" katexReady={katexReady} />) of the Jacobian Matrix.
          </p>
          
          <ul className="list-none space-y-4 text-white/70">
            <li>
              <strong className="text-white">1. Trace <InlineMath tex="\tau = \text{tr}(A) = \lambda_1 + \lambda_2" katexReady={katexReady} /></strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li><InlineMath tex="\tau < 0" katexReady={katexReady} />: Stable (trajectories point inside).</li>
                <li><InlineMath tex="\tau > 0" katexReady={katexReady} />: Unstable (trajectories point outside).</li>
              </ul>
            </li>
            <li>
              <strong className="text-white">2. Determinant <InlineMath tex="\Delta = \text{det}(A) = \lambda_1 \lambda_2" katexReady={katexReady} /></strong>
              <ul className="list-disc list-inside ml-6 mt-1">
                <li><InlineMath tex="\Delta < 0" katexReady={katexReady} />: <strong>Saddle point</strong> (features one stable and one unstable manifold).</li>
              </ul>
            </li>
            <li>
              <strong className="text-white">3. Discriminant <InlineMath tex="\tau^2 - 4\Delta" katexReady={katexReady} /></strong> (Determines spirals)
              <ul className="list-disc list-inside ml-6 mt-1">
                <li><InlineMath tex="\tau^2 - 4\Delta < 0" katexReady={katexReady} />: Complex eigenvalues, resulting in a <strong>Spiral</strong> or a neutral <strong>Center</strong>.</li>
                <li><InlineMath tex="\tau^2 - 4\Delta > 0" katexReady={katexReady} />: Real eigenvalues, resulting in a clean <strong>Node</strong>.</li>
              </ul>
            </li>
          </ul>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={classification} 
              alt="Classification of Fixed Points" 
              className="w-full object-cover opacity-90 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }}
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. The Poincaré diagram: Classification of fixed points based on Trace and Determinant.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Interactive Lab: 2D Vector Fields</h3>
          <p>
            Experience the topological shifts firsthand. The local behavior near the origin is dictated by the Jacobian matrix <InlineMath tex="A" katexReady={katexReady} />, defined as:
          </p>
          <MathDisplay tex={FORMULAS.jacobianABCD} katexReady={katexReady} />
          <p>
            By manipulating the specific matrix elements <InlineMath tex="a, b, c, d" katexReady={katexReady} /> below, you linearly transform the 2D phase space. Observe how adjusting the parameters forces the system to undergo bifurcations, morphing between saddles, spirals, and nodes in real-time.
          </p>
          
          <VectorFieldLab />
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Case Study: The Belousov-Zhabotinsky (BZ) System</h3>
          <p>
            The BZ reaction involves a labyrinth of complex chemical steps that can be rigorously modeled by coupled differential equations tracking the concentrations of reactants and products over time.
          </p>

          <h4 className="font-bold text-cyan-400 mt-6">Main Reaction Steps</h4>
          <p>The core kinetic mechanism is described by the following sequence and their respective rate laws:</p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.bz1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.bz2} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.bz3} katexReady={katexReady} />
          </div>

          <h4 className="font-bold text-cyan-400 mt-6">Simplified Dimensionless Model & Nullclines</h4>
          <p>
            By distilling the complexity and non-dimensionalizing the variables, we obtain an elegant 2D mathematical model where <InlineMath tex="x" katexReady={katexReady} /> and <InlineMath tex="y" katexReady={katexReady} /> are dimensionless concentrations:
          </p>
          <MathDisplay tex={FORMULAS.bzEq} katexReady={katexReady} />

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={phasePortrait} 
              alt="Nullclines Phase Portrait" 
              className="w-full object-cover opacity-90 invert hue-rotate-180 transition-opacity"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }}
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 3. Phase portrait of the simplified BZ model showing nullclines. The fixed point lies exactly at the intersection of <InlineMath tex="\dot{x}=0" katexReady={katexReady} /> and <InlineMath tex="\dot{y}=0" katexReady={katexReady} />.
            </figcaption>
          </figure>

          <h4 className="font-bold text-cyan-400 mt-6">Fixed Point and Jacobian Evaluation</h4>
          <p>
            By solving the nullcline equations simultaneously (<InlineMath tex="\dot{x}=0, \dot{y}=0" katexReady={katexReady} />), we locate the unique fixed point of the system:
          </p>
          <MathDisplay tex={FORMULAS.bzFixedPoint} katexReady={katexReady} />
          
          <p>
            To understand the stability, we linearize the system by evaluating the Jacobian matrix precisely at this fixed point <InlineMath tex="(x^*, y^*)" katexReady={katexReady} />. The calculus yields:
          </p>
          <MathDisplay tex={FORMULAS.bzJacobianEval} katexReady={katexReady} />
          
          <p>
            From this matrix, we can extract the Determinant (<InlineMath tex="\Delta" katexReady={katexReady} />) and Trace (<InlineMath tex="\tau" katexReady={katexReady} />). Notice that the determinant is strictly positive:
          </p>
          <MathDisplay tex={FORMULAS.bzDet} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.hopfTrace} katexReady={katexReady} />

          <h4 className="font-bold text-cyan-400 mt-6">Hopf Bifurcation</h4>
          <p>
            Because <InlineMath tex="\Delta > 0" katexReady={katexReady} />, the fixed point can never be a saddle. Instead, as the parameter <InlineMath tex="b" katexReady={katexReady} /> increases, the trace <InlineMath tex="\tau" katexReady={katexReady} /> transitions smoothly from negative (stable) to positive (unstable). This transition occurs at the precise critical threshold:
          </p>
          <MathDisplay tex={FORMULAS.hopfCritical} katexReady={katexReady} />
          
          <p>
            This indicates that the system undergoes a magnificent <strong>Hopf Bifurcation</strong>. The previously stable fixed point abruptly loses stability, birthing a stable <strong>limit cycle</strong>—which is the exact mathematical manifestation of the periodic chemical oscillations we observe in the petri dish.
          </p>
          
          <div className="mt-8 bg-white/[0.02] p-6 border-l-4 border-cyan-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <p className="text-sm italic leading-relaxed text-white/70">
              <span className="text-cyan-400 font-black tracking-widest uppercase text-[10px] block mb-2">// Author's Note</span>
              "By the way, these days I have often been troubled by some disturbances in my life. They used to greatly trouble me until I saw the wheels of a cart: the uneven ground causing them to repeatedly sway and generate oscillations, almost exactly like that mathematical limit cycle. 
              <br/><br/>
              What I want to say is that life is the same. It cannot run perfectly along an idealized, completely flat trajectory. But even when it is wobbling and oscillating, it remains fundamentally—a stable system."
            </p>
          </div>
        </section>

        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <p className="text-sm text-white/30 tracking-[0.4em] uppercase font-light italic">
            // End_Transmission: Flowing through the Phase Space
          </p>
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Continuous Systems Analyzed. Manifolds Charted.
          </div>
        </div>
		
        {/* Postscript */}
        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Dimensionality Transcended. Maps Calculated.
          </div>
          <p className="text-xs text-white/30 tracking-[0.2em] font-light italic mt-8 max-w-2xl mx-auto leading-relaxed">
              "By the way, these days I have often been troubled by some disturbances in my life. They used to greatly trouble me until I saw the wheels of a cart: the uneven ground causing them to repeatedly sway and generate oscillations, almost exactly like that mathematical limit cycle. 
              <br/><br/>
              What I want to say is that life is the same. It cannot run perfectly along an idealized, completely flat trajectory. But even when it is wobbling and oscillating, it remains fundamentally—a stable system."
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

export default function ChaosLog2Wrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogContinuous />
    </ErrorBoundary>
  );
}