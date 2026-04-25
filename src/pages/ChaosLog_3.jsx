import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// 1. 正常导入 Layout 组件 (在预览环境中暂时注释，复制到本地时请取消注释)
// =========================================================
import LogLayout from '../components/LogLayout';

// =========================================================
// 2. 正常导入本地真实图片 (在预览环境中暂时注释，复制到本地时请取消注释)
// =========================================================
import figTrapping from '../assets/Figure_6.png';
import figPoincare from '../assets/Figure_7.png';

// =========================================================
// 🛡️ 静态资源隔离区 (完全防爆机制)
// =========================================================
const FORMULAS = {
  pbTheorem: "\\dot{x} = f(x)",
  pbExampleSys: "\\begin{cases} \\dot{r} = r(1-r^2) + \\mu r \\cos\\theta \\\\ \\dot{\\theta} = 1 \\end{cases}",
  pbCondition1: "\\dot{r} = r(1-r^2) + \\mu r \\cos\\theta > 0",
  pbCondition2: "1 - r^2 - \\mu > 0 \\implies r_{min} < \\sqrt{1-\\mu}",
  pbAnnulus: "0.999\\sqrt{1-\\mu} < r < 1.001\\sqrt{1+\\mu}",
  chaosSens: "\\exists \\delta > 0, \\text{ s.t. } d = |f^n(x) - f^n(y)| > \\delta",
  chaosTrans: "\\exists n^* \\text{ s.t. } f^{n^*}(U) \\cap W \\neq \\emptyset",
  poincareMapDef: "x_{k+1} = P(x_k)",
  poincareSys: "\\begin{cases} \\dot{r} = r(1-r^2) \\\\ \\dot{\\theta} = 1 \\end{cases}",
  poincareInt1: "\\frac{dr}{dt} = r(1-r^2) \\implies \\frac{dr}{r(1-r^2)} = dt",
  poincareInt2: "\\int_{r_0}^{r_1} \\left[ \\frac{1}{r} + \\frac{r}{1-r^2} \\right] dr = \\int_0^{2\\pi} dt = 2\\pi",
  poincareInt3: "\\ln \\left( \\frac{r_1\\sqrt{1-r_0^2}}{r_0\\sqrt{1-r_1^2}} \\right) = 2\\pi \\implies e^{2\\pi} \\frac{r_0}{\\sqrt{1-r_0^2}} = \\frac{r_1}{\\sqrt{1-r_1^2}}",
  poincareSol: "r_1 = P(r_0) = \\left[ 1 + e^{-4\\pi}(r_0^{-2} - 1) \\right]^{-1/2}",
  linearPoincare: "x^* + \\eta_1 = P(x^* + \\eta_0) = P(x^*) + [DP(x^*)]\\eta_0 + O(||\\eta_0||^2)",
  eigenExpansion: "\\eta_k = \\sum_{j=1}^{n-1} \\eta_j (\\lambda_j)^k e_j"
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
// 组件: 数学渲染器
// =========================================================
const MathDisplay = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try { window.katex.render(tex, container.current, { throwOnError: false, displayMode: true }); } 
      catch (e) { console.error("KaTeX Render Error:", e); }
    }
  }, [tex, katexReady]);
  return <div ref={container} className="my-8 py-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner overflow-x-auto text-center"></div>;
};

const InlineMath = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try { window.katex.render(tex, container.current, { throwOnError: false, displayMode: false }); } 
      catch (e) { console.error("KaTeX Inline Error:", e); }
    }
  }, [tex, katexReady]);
  return <span ref={container} className="mx-1 font-serif text-cyan-200/90">{`$${tex}$`}</span>;
};

// =========================================================
// 组件: 极限环与捕获区域在线实验室 (Limit Cycle & Trapping Region Lab)
// =========================================================
const LimitCycleLab = () => {
  const [mu, setMu] = useState(0.5);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  const initParticles = (count, radiusScale) => {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 2 * radiusScale;
      const theta = Math.random() * 2 * Math.PI;
      particles.push({
        x: r * Math.cos(theta),
        y: r * Math.sin(theta),
        age: Math.random() * 100
      });
    }
    return particles;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = { x: width / 2, y: height / 2 };
    const scale = 150;

    particlesRef.current = initParticles(600, 2);
    const dt = 0.02;

    const renderLoop = () => {
      ctx.fillStyle = 'rgba(5, 11, 20, 0.15)';
      ctx.fillRect(0, 0, width, height);

      if (mu < 1) {
        const rMin = Math.sqrt(1 - mu) * scale;
        const rMax = Math.sqrt(1 + mu) * scale;
        
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.2)'; // Pink
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center.x, center.y, rMin, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)'; // Cyan
        ctx.beginPath();
        ctx.arc(center.x, center.y, rMax, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = '#38bdf8';
      
      particlesRef.current.forEach(p => {
        let r = Math.sqrt(p.x * p.x + p.y * p.y);
        let theta = Math.atan2(p.y, p.x);

        const dr = (r * (1 - r * r) + mu * r * Math.cos(theta)) * dt;
        const dtheta = 1 * dt;

        r += dr;
        theta += dtheta;

        p.x = r * Math.cos(theta);
        p.y = r * Math.sin(theta);
        p.age += 1;

        const screenX = center.x + p.x * scale;
        const screenY = center.y - p.y * scale;

        const speed = Math.sqrt(dr*dr + dtheta*dtheta);
        ctx.fillStyle = `hsla(190, 90%, 60%, ${Math.min(0.8, speed * 10 + 0.2)})`;

        ctx.beginPath();
        ctx.arc(screenX, screenY, 1.5, 0, 2 * Math.PI);
        ctx.fill();

        if (p.age > 400 || r > 3 || r < 0.05) {
           const newR = Math.random() * 2.5;
           const newTheta = Math.random() * 2 * Math.PI;
           p.x = newR * Math.cos(newTheta);
           p.y = newR * Math.sin(newTheta);
           p.age = 0;
        }
      });

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mu]);

  return (
    <div className="my-10 p-6 md:p-10 bg-black/60 border border-white/10 rounded-2xl shadow-2xl font-mono">
      <div className="flex flex-col gap-8 items-center">
        
        <div className="relative w-full max-w-[550px] bg-[#050b14] rounded-xl border border-white/5 shadow-inner overflow-hidden flex items-center justify-center p-2">
          <canvas ref={canvasRef} width={600} height={600} className="w-full aspect-square bg-[#050b14]" />
          <div className="absolute top-6 left-6 text-xs text-white/40 uppercase tracking-widest font-bold">Limit_Cycle_Engine</div>
          <div className="absolute bottom-6 right-6 text-[10px] text-pink-400/50 uppercase tracking-widest">Inner bound: Pink dashed</div>
          <div className="absolute bottom-10 right-6 text-[10px] text-cyan-400/50 uppercase tracking-widest">Outer bound: Cyan dashed</div>
        </div>

        <div className="w-full max-w-[550px] space-y-4">
          <h4 className="text-cyan-400 text-xs tracking-[0.2em] uppercase font-bold border-b border-white/10 pb-2">Perturbation Parameter [μ]</h4>
          <div className="bg-white/[0.02] p-5 rounded-xl border border-white/5 shadow-inner space-y-3">
            <div className="flex justify-between text-xs text-white/70 font-bold">
              <span>Current μ Value:</span>
              <span className="text-cyan-300 font-mono bg-white/5 px-3 py-1 rounded">{mu.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0" max="0.9" step="0.05" value={mu} 
              onChange={(e) => setMu(parseFloat(e.target.value))} 
              className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer mt-4" 
            />
            <p className="text-[10px] text-white/40 italic pt-2">
              Drag the slider to observe how the trapping region shifts. As μ approaches 1, the inner boundary collapses, testing the limits of the Poincaré-Bendixson Theorem.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};


// =========================================================
// 页面主逻辑
// =========================================================
const ChaosLogPoincare = () => {
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
    <LogLayout title="CHAOS 3: Poincaré-Bendixson Th. & RETURN MAP" category="RESEARCH" date="2026-04-25">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <p>
            In our previous log, we explored how continuous systems manifest in the 2D phase plane. However, one profound question remains: <strong>Why do we never see chaos in two-dimensional continuous systems?</strong> 
            This log delves into the strict topological laws that forbid 2D chaos, and introduces the ingenious mathematical tool designed to break past them.
          </p>
        </section>

        {/* 1. Poincaré-Bendixson Theorem */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. The Poincaré-Bendixson (P-B) Theorem</h3>
          <p>
            The P-B Theorem is a cornerstone of non-linear dynamics. It strictly dictates the ultimate fate of trajectories in a two-dimensional plane.
          </p>
          <p className="font-bold text-cyan-400 mt-4">Theorem Conditions:</p>
          <p>Suppose that:</p>
          <ul className="list-decimal list-inside space-y-2 text-white/70 ml-4 bg-white/[0.02] p-6 rounded-xl border border-white/5">
            <li><InlineMath tex="R" katexReady={katexReady} /> is a closed, bounded subset of the plane.</li>
            <li><MathDisplay tex={FORMULAS.pbTheorem} katexReady={katexReady} /> is a continuously differentiable vector field on an open set containing <InlineMath tex="R" katexReady={katexReady} />.</li>
            <li><strong className="text-pink-400"> <InlineMath tex="R" katexReady={katexReady} /> does not contain any fixed points.</strong></li>
            <li>There exists a trajectory <InlineMath tex="C" katexReady={katexReady} /> that is <em>"confined"</em> in <InlineMath tex="R" katexReady={katexReady} /> (it starts in <InlineMath tex="R" katexReady={katexReady} /> and stays in <InlineMath tex="R" katexReady={katexReady} /> for all future time).</li>
          </ul>
          
          <p className="mt-4 text-lg text-white font-bold text-center">
            $\implies$ <InlineMath tex="R" katexReady={katexReady} /> contains a closed orbit (a Limit Cycle).
          </p>

          <div className="mt-6 bg-white/[0.02] p-6 border-l-4 border-cyan-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(34,211,238,0.02)]">
            <h4 className="text-cyan-400 font-black tracking-widest uppercase text-xs mb-2">Log Insight: Physical Intuition</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              Since condition (3) holds, a particle in <InlineMath tex="R" katexReady={katexReady} /> cannot just drift into a fixed point and stop. 
              Condition (4) ensures it cannot escape the region. Having no fixed point forces the particle to keep moving indefinitely. 
              In a 2D plane, if you cannot stop, cannot escape, and cannot cross your own path... your only option is to eventually orbit in an endless closed loop.
            </p>
          </div>
        </section>

        {/* 2. Trapping Region & Example */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. The Trick: Constructing a Trapping Region</h3>
          <p>
            When applying the P-B theorem, conditions 1 to 3 are usually trivial. The challenge is condition 4: How can we guarantee a trajectory is confined? 
            The standard mathematical trick is to construct a <strong>Trapping Region</strong> (usually an annulus)—a region where all vectors on the boundary point strictly <em>inward</em>.
          </p>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figTrapping} 
              alt="Trapping Region Construction" 
              className="w-full object-cover opacity-90 transition-opacity invert hue-rotate-180" 
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }}
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Illustrating the construction of an Annular Trapping Region. The particle is squeezed between outer and inner boundaries.
            </figcaption>
          </figure>

          <h4 className="font-bold text-cyan-400 mt-6">Example: A Perturbed Polar System</h4>
          <p>Consider the system in polar coordinates:</p>
          <MathDisplay tex={FORMULAS.pbExampleSys} katexReady={katexReady} />
          <p>
            When <InlineMath tex="\mu = 0" katexReady={katexReady} />, it is trivial to see a stable limit cycle at <InlineMath tex="r = 1" katexReady={katexReady} />. 
            We want to prove that a closed orbit still survives for <InlineMath tex="\mu > 0" katexReady={katexReady} /> (as long as <InlineMath tex="\mu" katexReady={katexReady} /> is small enough).
          </p>

          <p>
            <strong>Solution:</strong> We seek two concentric circles <InlineMath tex="r_{min}" katexReady={katexReady} /> and <InlineMath tex="r_{max}" katexReady={katexReady} />, such that <InlineMath tex="\dot{r} < 0" katexReady={katexReady} /> on the outer circle and <InlineMath tex="\dot{r} > 0" katexReady={katexReady} /> on the inner circle.
            For <InlineMath tex="r_{min}" katexReady={katexReady} />, we require:
          </p>
          <MathDisplay tex={FORMULAS.pbCondition1} katexReady={katexReady} />
          <p>
            Since <InlineMath tex="\cos\theta \ge -1" katexReady={katexReady} />, it suffices to have:
          </p>
          <MathDisplay tex={FORMULAS.pbCondition2} katexReady={katexReady} />
          <p>
            Similarly, we find <InlineMath tex="r_{max} < \sqrt{1+\mu}" katexReady={katexReady} />. By choosing tight bounds, we verify that a closed orbit unequivocally exists within the annulus:
          </p>
          <MathDisplay tex={FORMULAS.pbAnnulus} katexReady={katexReady} />

          {/* Interactive Trapping Region Lab */}
          <LimitCycleLab />

        </section>

        {/* 3. Chaos and Dimensionality */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Dimensionality: Why 2D Phase Spaces Cannot Be Chaotic</h3>
          <p>
            To fully appreciate the P-B Theorem, we must understand what it strictly forbids: <strong>Chaos</strong>. The topological definition of Chaos demands three elements:
          </p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><strong>Sensitivity to Initial Conditions:</strong> <InlineMath tex={FORMULAS.chaosSens} katexReady={katexReady} /></li>
            <li><strong>Topological Transitivity:</strong> <InlineMath tex={FORMULAS.chaosTrans} katexReady={katexReady} /></li>
            <li><strong>Density:</strong> The set of periodic points is dense in the domain.</li>
          </ul>

          <div className="mt-6 bg-white/[0.02] p-6 border-l-4 border-pink-500/50 rounded-r-xl shadow-[inset_0_0_20px_rgba(244,114,182,0.02)]">
            <h4 className="text-pink-400 font-black tracking-widest uppercase text-xs mb-2">The Topological Wall (Jordan Curve Theorem)</h4>
            <p className="text-xs italic leading-relaxed text-white/70">
              The restriction fundamentally roots in the <strong>Jordan Curve Theorem</strong>: A closed curve in 2D strictly separates the plane into an "inside" and an "outside". 
              Because continuous trajectories cannot cross themselves (due to uniqueness of solutions), an orbit acts as an impenetrable wall. <br/><br/>
              A trajectory cannot have an infinitely long, non-repeating path in a bounded 2D area. Only in 3D (or higher) can trajectories "jump over" or "bypass" these footprints to weave the complex, intertwined fabric of Strange Attractors required for Chaos.
            </p>
          </div>
        </section>

        {/* 4. Poincare Return Map */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Breaking into 3D: The Poincaré Return Map</h3>
          <p>
            Since 3D chaotic flows are too tangled to visualize directly, Henri Poincaré invented a brilliant "dimensional reduction" tool: The <strong>Poincaré Map</strong>.
          </p>
          <p>
            Consider an <InlineMath tex="n" katexReady={katexReady} />-dimensional system. Let <InlineMath tex="S" katexReady={katexReady} /> be an <InlineMath tex="(n-1)" katexReady={katexReady} />-dimensional <em>surface of section</em>, transverse to the flow. 
            The Poincaré map <InlineMath tex="P" katexReady={katexReady} /> maps from <InlineMath tex="S \to S" katexReady={katexReady} /> by following a continuous trajectory from one intersection with <InlineMath tex="S" katexReady={katexReady} /> to the next:
          </p>
          <MathDisplay tex={FORMULAS.poincareMapDef} katexReady={katexReady} />

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figPoincare} 
              alt="3D Poincare Section" 
              className="w-full object-cover opacity-90 transition-opacity invert hue-rotate-180" 
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }}
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. The Poincaré map converts a continuous 3D flow into a discrete sequence of points on a 2D section.
            </figcaption>
          </figure>

          <p>
            If <InlineMath tex="x^*" katexReady={katexReady} /> is a fixed point of <InlineMath tex="P" katexReady={katexReady} /> (i.e., <InlineMath tex="P(x^*) = x^*" katexReady={katexReady} />), the trajectory returns exactly to where it started. Thus, a discrete fixed point on the Poincaré Map represents a continuous <strong>closed orbit</strong> in the full system!
          </p>
        </section>

        {/* 5. Poincare Map Calculation */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Integrating the Return Map: A Calculation</h3>
          <p>Let's rigorously compute the Poincaré map for a simple 2D system to see how it works analytically:</p>
          <MathDisplay tex={FORMULAS.poincareSys} katexReady={katexReady} />
          
          <p>
            Let <InlineMath tex="S" katexReady={katexReady} /> be the positive x-axis. Since <InlineMath tex="\dot{\theta} = 1" katexReady={katexReady} />, the first return to <InlineMath tex="S" katexReady={katexReady} /> always takes exactly <InlineMath tex="t = 2\pi" katexReady={katexReady} />.
            By separating variables, we integrate over one full period:
          </p>
          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
            <MathDisplay tex={FORMULAS.poincareInt1} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.poincareInt2} katexReady={katexReady} />
            <MathDisplay tex={FORMULAS.poincareInt3} katexReady={katexReady} />
          </div>

          <p>Solving for the next intersection <InlineMath tex="r_1" katexReady={katexReady} /> gives the explicit discrete mapping function:</p>
          <MathDisplay tex={FORMULAS.poincareSol} katexReady={katexReady} />

        </section>

        {/* 6. Linear Stability & Floquet Multipliers */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Linear Stability of Periodic Orbits</h3>
          <p>
            Now that we have successfully obtained the map <InlineMath tex="P" katexReady={katexReady} />, we can extract stability information. Verifying whether a continuous closed orbit is stable is mathematically equivalent to verifying whether the discrete fixed point <InlineMath tex="x^*" katexReady={katexReady} /> of its Poincaré map is stable.
          </p>
          <p>
            Let <InlineMath tex="\eta_0" katexReady={katexReady} /> be an infinitesimal perturbation. After one return to <InlineMath tex="S" katexReady={katexReady} />:
          </p>
          <MathDisplay tex={FORMULAS.linearPoincare} katexReady={katexReady} />
          
          <p>
            The matrix <InlineMath tex="DP(x^*)" katexReady={katexReady} /> is the linearized Poincaré map. Assuming a basis of eigenvectors exists, after <InlineMath tex="k" katexReady={katexReady} /> iterations, the perturbation evolves as:
          </p>
          <MathDisplay tex={FORMULAS.eigenExpansion} katexReady={katexReady} />

          <p className="bg-white/5 p-4 border-l-2 border-cyan-500/50 text-sm italic mt-4">
            If all eigenvalues <InlineMath tex="|\lambda_j| < 1" katexReady={katexReady} />, the perturbation <InlineMath tex="||\eta_k|| \to 0" katexReady={katexReady} /> geometrically fast, confirming the orbit is linearly stable. 
            These crucial eigenvalues are known in advanced dynamics as the <strong>Characteristic (or Floquet) Multipliers</strong> of the periodic orbit.
          </p>
        </section>

        {/* Postscript */}
        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Dimensionality Transcended. Maps Calculated.
          </div>
          <p className="text-xs text-white/30 tracking-[0.2em] font-light italic mt-8 max-w-2xl mx-auto leading-relaxed">
            "The Poincaré Map teaches us a profound lesson on perspective. When continuous existence becomes too tangled and chaotic to comprehend, we can slice through it. By merely observing where we intersect with a fixed plane—our moments of reflection—we convert a terrifyingly complex flow into a sequence of discrete, understandable steps."
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

export default function ChaosLog3Wrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogPoincare />
    </ErrorBoundary>
  );
}