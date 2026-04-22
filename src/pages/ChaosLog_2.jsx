import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// ⚠️ 注意：在你本地项目中，请【解除】下方引入的注释！
// =========================================================
import LogLayout from '../components/LogLayout';

// (下方的内联 LogLayout 仅为防止在此处的预览环境报错，你复制到本地时可以删掉这块)
const LogLayout = ({ title, category, date, children }) => (
  <div className="min-h-screen bg-[#0d1117] text-white p-4 md:p-8 selection:bg-cyan-500/30">
    <div className="max-w-5xl mx-auto">
      <header className="mb-12 border-b border-white/10 pb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="text-cyan-400 text-[10px] tracking-[0.3em] uppercase mb-2 font-mono">Category: {category}</div>
            <h1 className="text-2xl md:text-3xl font-black tracking-widest uppercase font-mono">{title}</h1>
          </div>
          <div className="text-white/40 font-mono text-sm tracking-widest">{date}</div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  </div>
);

// =========================================================
// 🖼️ 静态图片导入区
// 请确保这些图片放在了 src/assets/ 文件夹下。
// 即使你暂时没放，下方我也配置了备用链接以防页面崩溃。
// =========================================================
import bzReaction from '../assets/Figure_3.jpg';
import phasePortrait from '../assets/Figure_4.png';
import classification from '../assets/Figure_5.png';


// =========================================================
// 🛡️ 静态资源隔离区 (完全防爆机制，防止 Vercel 编译崩溃)
// =========================================================
const FORMULAS = {
  oneD: "\\dot{x} = f(x)",
  oneDEx: "\\dot{x} = r + x^2",
  twoD: "\\begin{cases} \\dot{x} = f(x, y) \\\\ \\dot{y} = g(x, y) \\end{cases}",
  linearization: "u = x - x^*, \\quad v = y - y^*",
  jacobian: "A = \\begin{pmatrix} \\frac{\\partial f}{\\partial x} & \\frac{\\partial f}{\\partial y} \\\\ \\frac{\\partial g}{\\partial x} & \\frac{\\partial g}{\\partial y} \\end{pmatrix}_{(x^*, y^*)}",
  linSys: "\\begin{pmatrix} \\dot{u} \\\\ \\dot{v} \\end{pmatrix} = A \\begin{pmatrix} u \\\\ v \\end{pmatrix}",
  bzEq: "\\begin{cases} \\dot{x} = a - x - \\frac{4xy}{1+x^2} \\\\ \\dot{y} = bx \\left(1 - \\frac{y}{1+x^2}\\right) \\end{cases}",
  traceDet: "\\tau = \\text{tr}(A) = \\lambda_1 + \\lambda_2, \\quad \\Delta = \\det(A) = \\lambda_1 \\lambda_2",
  charEq: "\\lambda^2 - \\tau \\lambda + \\Delta = 0 \\implies \\lambda = \\frac{\\tau \\pm \\sqrt{\\tau^2 - 4\\Delta}}{2}"
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
// 组件: 2D 向量场交互式实验室 (Vector Field Lab)
// =========================================================
const VectorFieldLab = () => {
  // Jacobian Matrix Parameters
  const [a, setA] = useState(1);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(-1);
  
  const canvasRef = useRef(null);

  // Derived properties
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

  // Draw Vector Field
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const scale = 20; // grid scale
    const center = { x: width / 2, y: height / 2 };

    // Draw Axes
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, center.y); ctx.lineTo(width, center.y);
    ctx.moveTo(center.x, 0); ctx.lineTo(center.x, height);
    ctx.stroke();

    // Vector field parameters
    const step = 25; // pixel spacing between arrows
    const arrowScale = 4;

    // Helper: draw arrow
    const drawArrow = (x, y, vx, vy) => {
        const mag = Math.sqrt(vx * vx + vy * vy);
        if (mag < 0.01) return;
        
        // Normalize and scale
        const nvx = (vx / mag) * arrowScale * Math.min(mag, 5);
        const nvy = (vy / mag) * arrowScale * Math.min(mag, 5);

        // Color based on magnitude and direction
        const hue = (Math.atan2(vy, vx) * 180 / Math.PI + 360) % 360;
        const opacity = Math.min(0.3 + mag * 0.1, 0.9);
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1.5;

        const startX = center.x + x * scale;
        const startY = center.y - y * scale; // inverted Y for standard Cartesian
        const endX = startX + nvx;
        const endY = startY - nvy; // inverted Y

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw Arrowhead
        const angle = Math.atan2(-nvy, nvx);
        const headlen = 4;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fill();
    };

    // Render Field
    for (let px = -width/2; px < width/2; px += step) {
        for (let py = -height/2; py < height/2; py += step) {
            const mathX = px / scale;
            const mathY = py / scale;
            // dx/dt = ax + by
            // dy/dt = cx + dy
            const vx = a * mathX + b * mathY;
            const vy = c * mathX + d * mathY;
            drawArrow(mathX, mathY, vx, vy);
        }
    }

    // Draw fixed point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, 2 * Math.PI);
    ctx.fill();

  }, [a, b, c, d]);

  return (
    <div className="my-10 p-6 bg-black/60 border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Canvas Section */}
        <div className="relative flex-1 bg-[#050b14] rounded-xl border border-white/5 shadow-inner overflow-hidden flex items-center justify-center p-2">
          <canvas ref={canvasRef} width={500} height={500} className="w-full max-w-[500px] aspect-square" />
          <div className="absolute top-4 left-4 text-[10px] text-white/40 uppercase tracking-widest font-bold">Phase_Space_Engine</div>
        </div>

        {/* Controls Section */}
        <div className="w-full lg:w-80 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-4">
            <h4 className="text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold border-b border-white/10 pb-2">Jacobian Matrix [A]</h4>
            <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-lg border border-white/5">
              {[ {label: 'a', val: a, setter: setA}, {label: 'b', val: b, setter: setB}, 
                 {label: 'c', val: c, setter: setC}, {label: 'd', val: d, setter: setD} ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/50">
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

          <div className="space-y-3">
             <h4 className="text-pink-400 text-xs tracking-[0.2em] uppercase font-bold border-b border-white/10 pb-2">Analysis Panel</h4>
             <div className="bg-white/[0.02] p-4 rounded-lg border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-white/40">Trace (τ)</span>
                    <span className="text-white font-bold">{tr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/40">Determinant (Δ)</span>
                    <span className="text-white font-bold">{det.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/5">
                    <span className="text-white/40">Topology</span>
                    <span className={`font-black ${det < 0 ? 'text-pink-400' : 'text-cyan-400'}`}>{type}</span>
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
    <LogLayout title="CONTINUOUS_DYNAMICS: DIFFERENTIAL_EQUATIONS_&_VECTOR_FIELDS" category="RESEARCH" date="2026-04-22">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <p>
            While discrete iterative maps reveal the aesthetic fractal nature of chaos, physical reality—from the orbital mechanics of planets to fluid turbulence and oscillating chemical reactions—unfolds continuously in time. In this log, we transition from difference equations to <strong>Differential Equations</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. One-Dimensional Phase Trajectories</h3>
          <p>
            For a continuous dynamical system, the evolution of a state <InlineMath tex="x" katexReady={katexReady} /> is governed by its velocity:
          </p>
          <MathDisplay tex={FORMULAS.oneD} katexReady={katexReady} />
          <p>
            Consider the classic 1D system <InlineMath tex="\dot{x} = r + x^2" katexReady={katexReady} />. By analyzing the roots where velocity is zero (<InlineMath tex="\dot{x} = 0" katexReady={katexReady} />), we can deduce the system's vector field without explicitly solving the equation.
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li>If <InlineMath tex="r < 0" katexReady={katexReady} />: Two fixed points exist (one stable, one unstable).</li>
            <li>If <InlineMath tex="r = 0" katexReady={katexReady} />: The points collide into a half-stable node (Saddle-Node Bifurcation).</li>
            <li>If <InlineMath tex="r > 0" katexReady={katexReady} />: The fixed points vanish into the complex plane; the system flows uniformly to infinity.</li>
          </ul>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. The Belousov-Zhabotinsky (BZ) Reaction</h3>
          <p>
            A paradigm of continuous dynamical systems is found in chemistry. Discovered in the 1950s, the <strong>Belousov-Zhabotinsky reaction</strong> shocked the scientific community by exhibiting macroscopic, periodic color oscillations (e.g., alternating between red and blue), defying the naive intuition that chemical reactions must monotonically decay to equilibrium.
          </p>
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            {/* 使用 Fallback，如果在本地且有图，请将 src 替换为 {bzReaction} */}
            <img 
              src={bzReactionFallback} 
              alt="BZ Chemical Reaction" 
              className="w-full object-cover opacity-90 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Periodic behavior of an oscillating chemical reaction (BZ System).
            </figcaption>
          </figure>

          <p>
            Because chemical kinetics are strictly governed by differential equations representing concentrations of reactants, we can non-dimensionalize the complex BZ reaction into a simplified 2D planar system:
          </p>
          <MathDisplay tex={FORMULAS.bzEq} katexReady={katexReady} />
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Nullclines and Phase Portraits</h3>
          <p>
            In a two-dimensional case <InlineMath tex="\dot{x} = f(x, y)" katexReady={katexReady} /> and <InlineMath tex="\dot{y} = g(x, y)" katexReady={katexReady} />, analyzing the entire vector field can be daunting. We employ <strong>Nullclines</strong>—curves where either <InlineMath tex="\dot{x} = 0" katexReady={katexReady} /> or <InlineMath tex="\dot{y} = 0" katexReady={katexReady} />.
          </p>
          <p>
            The intersections of these nullclines mathematically guarantee <InlineMath tex="\dot{x} = \dot{y} = 0" katexReady={katexReady} />. These exact intersections are the fixed points of the continuous system.
          </p>
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            {/* 使用 Fallback，如果在本地且有图，请将 src 替换为 {phasePortrait} */}
            <img 
              src={phasePortraitFallback} 
              alt="Nullclines Phase Portrait" 
              className="w-full object-cover opacity-90 invert hue-rotate-180 transition-opacity"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }}
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. The phase portrait of the simplified model of the BZ reaction showing nullcline intersections.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Linearization and the Jacobian Matrix</h3>
          <p>
            To rigorously analyze the stability near a fixed point <InlineMath tex="(x^*, y^*)" katexReady={katexReady} />, we apply Taylor expansion and discard higher-order non-linear terms. By introducing tiny perturbations <InlineMath tex="u" katexReady={katexReady} /> and <InlineMath tex="v" katexReady={katexReady} />:
          </p>
          <MathDisplay tex={FORMULAS.linearization} katexReady={katexReady} />
          <p>
            The local dynamics are entirely governed by a linear system utilizing the <strong>Jacobian Matrix <InlineMath tex="A" katexReady={katexReady} /></strong> evaluated at the fixed point:
          </p>
          <MathDisplay tex={FORMULAS.jacobian} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.linSys} katexReady={katexReady} />
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. The Trace-Determinant Classification</h3>
          <p>
            The essence of the Jacobian matrix lies in its eigenvalues (<InlineMath tex="\lambda" katexReady={katexReady} />) and eigenvectors. The eigenvectors dictate the primary directions of flow (the stable/unstable manifolds), while the eigenvalues dictate whether the flow is converging (<InlineMath tex="\lambda < 0" katexReady={katexReady} />) or diverging (<InlineMath tex="\lambda > 0" katexReady={katexReady} />).
          </p>
          <p>
            We can compute these eigenvalues using the characteristic equation, elegantly simplified via the Trace (<InlineMath tex="\tau" katexReady={katexReady} />) and Determinant (<InlineMath tex="\Delta" katexReady={katexReady} />):
          </p>
          <MathDisplay tex={FORMULAS.traceDet} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.charEq} katexReady={katexReady} />

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            {/* 使用 Fallback，如果在本地且有图，请将 src 替换为 {classification} */}
            <img 
              src={classificationFallback} 
              alt="Classification of Fixed Points" 
              className="w-full object-cover opacity-90 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 3. The Poincaré diagram: Classification of fixed points based on Trace and Determinant.
            </figcaption>
          </figure>
          
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><strong className="text-pink-400">Saddles:</strong> Occur when <InlineMath tex="\Delta < 0" katexReady={katexReady} />. The eigenvalues have opposite signs.</li>
            <li><strong className="text-cyan-400">Nodes:</strong> Occur when <InlineMath tex="\tau^2 - 4\Delta > 0" katexReady={katexReady} />. Purely real eigenvalues (no spiraling).</li>
            <li><strong className="text-cyan-400">Spirals:</strong> Occur when <InlineMath tex="\tau^2 - 4\Delta < 0" katexReady={katexReady} />. Complex eigenvalues induce rotational flow.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Interactive Lab: 2D Vector Fields</h3>
          <p>
            Experience the topological shifts firsthand. By manipulating the elements of the Jacobian matrix below, you linearly transform the 2D phase space. Observe how adjusting the parameters forces the system to undergo bifurcations, morphing between saddles, spirals, and nodes.
          </p>
          
          {/* 交互式 2D 向量场组件 */}
          <VectorFieldLab />
          
        </section>

        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <p className="text-sm text-white/30 tracking-[0.4em] uppercase font-light italic">
            // End_Transmission: Flowing through the Phase Space
          </p>
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Continuous Systems Analyzed. Manifolds Charted.
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