import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// ⚠️ 注意：在你本地项目中，请【解除】下一行的注释，并【删除】下方的 LogLayout 常量！
// =========================================================
// import LogLayout from '../components/LogLayout';

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
// 🛡️ 静态资源隔离区
// =========================================================
const FORMULAS = {
  stability: "|x_{n+1} - x^*| \\approx |f'(x^*)| \\cdot |x_n - x^*|",
  feigenbaum: "\\delta = \\lim_{n \\to \\infty} \\frac{r_n - r_{n-1}}{r_{n+1} - r_n} \\approx 4.6692016...",
  schwarzian: "Sf(x) = \\frac{f'''(x)}{f'(x)} - \\frac{3}{2} \\left( \\frac{f''(x)}{f'(x)} \\right)^2 < 0"
};

const PYTHON_CODE = [
  "import numpy as np",
  "import matplotlib.pyplot as plt",
  "",
  "# 1. Define Logistic Map Function",
  "def f(x, r):",
  "    return r * x * (1 - x)",
  "",
  "# 2. Cobweb Plot Generator",
  "def plot_cobweb(ax, r, x0, iterations=100):",
  "    x_range = np.linspace(0, 1, 500)",
  "    ax.plot(x_range, x_range, 'k--', alpha=0.5, label='y=x')",
  "    ax.plot(x_range, f(x_range, r), 'r', lw=2, label=f'f(x), r={r}')",
  "    ",
  "    x = x0",
  "    trajectory = [x]",
  "    for _ in range(iterations):",
  "        y = f(x, r)",
  "        ax.plot([x, x], [x, y], 'b', lw=1, alpha=0.3)",
  "        ax.plot([x, y], [y, y], 'b', lw=1, alpha=0.3)",
  "        x = y",
  "        trajectory.append(x)",
  "        ",
  "    ax.set_title(f'Cobweb Plot: r={r}, x0={x0}')",
  "    ax.set_xlabel('$x_n$')",
  "    ax.set_ylabel('$x_{n+1}$') ",
  "    ax.set_xlim(0, 1)",
  "    ax.set_ylim(0, 1)",
  "    ax.grid(True, linestyle='--', alpha=0.5)",
  "    return trajectory",
  "",
  "# 3. Setup Subplots",
  "fig, axes = plt.subplots(3, 2, figsize=(12, 14), gridspec_kw={'width_ratios': [2, 1]})",
  "plt.subplots_adjust(hspace=0.4)",
  "",
  "r_values = [2.8, 3.2, 3.9]",
  "x0 = 0.1",
  "iters = 80",
  "",
  "for i, r in enumerate(r_values):",
  "    ax_cobweb = axes[i, 0]",
  "    traj = plot_cobweb(ax_cobweb, r, x0, iters)",
  "    if i == 0:",
  "        ax_cobweb.legend(loc='upper left')",
  "        ",
  "    ax_time = axes[i, 1]",
  "    ax_time.plot(traj, 'g.-', lw=1, alpha=0.6)",
  "    ax_time.set_title(f'Time Series: r={r}')",
  "    ax_time.set_xlabel('Iteration (n)')",
  "    ax_time.set_ylabel('$x_n$')",
  "    ax_time.set_xlim(0, iters)",
  "    ax_time.set_ylim(0, 1)",
  "    ax_time.grid(True, linestyle='--', alpha=0.5)",
  "    ",
  "    if r == 2.8:",
  "        meanings = 'Fixed Point (Stable)'",
  "    elif r == 3.2:",
  "        meanings = '2-Cycle (Stable)'",
  "    else:",
  "        meanings = 'Chaos (Aperiodic)'",
  "        ",
  "    ax_time.text(0.5, 0.05, meanings, color='maroon', fontweight='bold', transform=ax_time.transAxes, ha='center')",
  "",
  "plt.tight_layout()",
  "plt.show()"
].join('\n');

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
// 组件: 交互式混沌实验室
// =========================================================
const ChaosLab = () => {
  const [r, setR] = useState(3.0);
  const [x0, setX0] = useState(0.2);
  const canvasRef = useRef(null);
  const size = 450;
  const padding = 50;

  const logistic = (r, x) => r * x * (1 - x);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    const toPx = (val) => padding + val * (size - 2 * padding);

    ctx.strokeStyle = '#ffffff0a';
    ctx.beginPath();
    for(let i=0; i<=10; i++) {
        const p = i/10;
        ctx.moveTo(toPx(p), toPx(0)); ctx.lineTo(toPx(p), toPx(1));
        ctx.moveTo(toPx(0), toPx(p)); ctx.lineTo(toPx(1), toPx(p));
    }
    ctx.stroke();

    ctx.strokeStyle = '#ffffff33';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toPx(0), toPx(1)); ctx.lineTo(toPx(1), toPx(0));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const px = i / 100;
      const py = logistic(r, px);
      if (i === 0) ctx.moveTo(toPx(px), toPx(1 - py));
      else ctx.lineTo(toPx(px), toPx(1 - py));
    }
    ctx.stroke();

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    let curX = x0;
    ctx.beginPath();
    ctx.moveTo(toPx(curX), toPx(1));
    for (let i = 0; i < 80; i++) {
      const nextY = logistic(r, curX);
      ctx.lineTo(toPx(curX), toPx(1 - nextY));
      ctx.lineTo(toPx(nextY), toPx(1 - nextY));
      curX = nextY;
    }
    ctx.stroke();
  }, [r, x0]);

  return (
    <div className="my-10 p-4 md:p-8 bg-black/60 border border-white/10 rounded-2xl font-mono overflow-hidden shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="relative">
          <canvas 
            ref={canvasRef} 
            width={size} 
            height={size} 
            className="w-full bg-slate-900/80 rounded-lg border border-white/5 shadow-inner"
          />
          <div className="absolute top-4 right-6 text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Cobweb_Engine_01</div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between text-[11px] text-cyan-400 uppercase tracking-widest font-black">
              <span>Growth_Rate (r)</span>
              <span className="bg-cyan-500/10 px-3 py-1 rounded text-cyan-300 border border-cyan-500/20">{r.toFixed(3)}</span>
            </div>
            <input 
              type="range" min="0" max="4" step="0.001" value={r} 
              onChange={(e) => setR(parseFloat(e.target.value) || 0)} 
              className="w-full accent-cyan-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[11px] text-pink-400 uppercase tracking-widest font-black">
              <span>Seed_Vector (x₀)</span>
              <span className="bg-pink-500/10 px-3 py-1 rounded text-pink-300 border border-pink-500/20">{x0.toFixed(3)}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" value={x0} 
              onChange={(e) => setX0(parseFloat(e.target.value) || 0)} 
              className="w-full accent-pink-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="p-5 bg-slate-800/40 rounded-lg border border-white/5 space-y-3">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] italic font-black text-center">// Dynamics_Observation</p>
            <p className="text-[13px] text-cyan-100/60 leading-relaxed uppercase text-center font-bold">
                {r < 1 ? "Global Extinction: Trajectories collapse to origin." : 
                 r < 3 ? "Fixed Point Stability: System settles at x* = 1 - 1/r." : 
                 r < 3.449 ? "First Bifurcation: Convergence to 2-period orbit." : 
                 r < 3.569 ? "Period-doubling Cascade: Approaching edge of chaos." : 
                 "Chaotic Regime: Deterministic unpredictability."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// 组件: 最安全的无状态数学渲染器
// =========================================================
const MathDisplay = ({ tex }) => {
  const container = useRef(null);

  useEffect(() => {
    const renderMath = () => {
      if (window.katex && container.current) {
        try {
          window.katex.render(tex, container.current, { throwOnError: false, displayMode: true });
        } catch (e) {
          console.error("KaTeX Render Error:", e);
        }
      }
    };

    if (window.katex) {
      renderMath();
    } else {
      const interval = setInterval(() => {
        if (window.katex) {
          clearInterval(interval);
          renderMath();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [tex]);

  return <div ref={container} className="my-8 py-6 bg-white/[0.02] rounded-xl border border-white/5 shadow-inner overflow-x-auto text-center">{tex}</div>;
};

// =========================================================
// 组件: Python 代码块
// =========================================================
const CodeBlock = ({ code }) => (
  <div className="my-8 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl">
    <div className="flex items-center px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
      <span>chaos_simulation.py</span>
    </div>
    <pre className="p-6 text-[11px] md:text-xs text-cyan-50/80 overflow-x-auto font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

// =========================================================
// 页面主逻辑
// =========================================================
const ChaosLogContent = () => {
  useEffect(() => {
    if (!document.getElementById('katex-cdn-css')) {
      const link = document.createElement('link');
      link.id = 'katex-cdn-css'; link.rel = 'stylesheet'; 
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('katex-cdn-js')) {
      const script = document.createElement('script');
      script.id = 'katex-cdn-js';
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <LogLayout title="DYNAMICAL_SYSTEMS: THE_TOPOLOGY_OF_CHAOS" category="RESEARCH" date="2026-03-26">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <p>
            The emergence of complexity from deceptively simple recursive rules represents a fundamental shift in mathematical physics. 
            By analyzing discrete maps, we observe how deterministic systems transition from stable equilibria into bounded chaos.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Local Stability & Fixed Points</h3>
          <p>
            {/* 🛑 所有这里的花括号都被字符串安全包裹，防止 React 把 {n+1} 当变量计算！ */}
            Consider the iterative map {"$x_{n+1} = f(x_n)$"}. A state {"$x^*$"} is defined as a fixed point if {"$f(x^*) = x^*$"}. 
            The behavior of trajectories in its infinitesimal neighborhood is governed by the linearized derivative:
          </p>
          
          <MathDisplay tex={FORMULAS.stability} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs tracking-widest">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded">
              <span className="text-cyan-400 font-black block mb-1">STABLE ATTRACTOR</span>
              If {"$|f'(x^*)| < 1$"}, initial perturbations decay geometrically.
            </div>
            <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded">
              <span className="text-pink-400 font-black block mb-1">UNSTABLE REPELLOR</span>
              If {"$|f'(x^*)| > 1$"}, local fluctuations amplify exponentially.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Iterative Lab: The Logistic Cascade</h3>
          <p>
            The Logistic Map {"$x_{n+1} = r x_n (1 - x_n)$"} exemplifies the bifurcation route to chaos. Interact with 
            the parameter {"$r$"} to witness the "Cobweb" spiral transition from stability to periodic orbits:
          </p>
          <ChaosLab />
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Python Simulation & Visualization</h3>
          <p>
            To rigorously analyze the transition mappings, we can utilize `numpy` and `matplotlib` to render both 
            the cobweb iterations and their corresponding time-series behavior across different parameters {"$r$"}.
          </p>
          
          <CodeBlock code={PYTHON_CODE} />
          
          <p>
            The execution of this simulation yields the following visualizations, clearly demonstrating the phase 
            shifts from stable fixed points ({"$r=2.8$"}) to 2-cycles ({"$r=3.2$"}), and ultimately to aperiodic chaos ({"$r=3.9$"}).
          </p>
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src="/Figure_1.png" 
              onError={(e) => { e.target.onerror = null; e.target.src = "/Figure_1.jpg" }}
              alt="Cobweb and Time Series Plot" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Cobweb Maps and Time Series evolution generated via Python.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Universal Scaling (Feigenbaum Constant)</h3>
          <p>
            In the period-doubling regime, the intervals between successive bifurcations {"$r_n$"} converge following a specific, 
            universal ratio. This is the **Feigenbaum Constant** {"$\\delta$"}:
          </p>
          
          <MathDisplay tex={FORMULAS.feigenbaum} />
          
          <p>
            This universality is a profound <strong>Serendipity</strong>: any unimodal map with a quadratic maximum 
            will reach chaos through the exact same geometric progression. This entire cascade is best visualized 
            through the Bifurcation Diagram:
          </p>
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src="/Figure_2.png" 
              onError={(e) => { e.target.onerror = null; e.target.src = "/Figure_2.jpg" }}
              alt="Bifurcation Diagram" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. Phase Space Map: The Bifurcation Diagram outlining the route to chaos.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. The Schwarzian Derivative Criterion</h3>
          <p>
            A map {"$f$"} must satisfy a global curvature constraint to exhibit a stable period-doubling cascade, 
            known as the <strong>Schwarzian Derivative</strong>:
          </p>
          
          <MathDisplay tex={FORMULAS.schwarzian} />
          
          <p className="opacity-50 text-xs italic bg-white/5 p-4 border-l-2 border-white/20">
            // This negative Schwarzian derivative ensures that the map has at most one stable periodic orbit, 
            preventing the coexistence of competing attractors in the cascade.
          </p>
        </section>

        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <p className="text-sm text-white/30 tracking-[0.4em] uppercase font-light italic">
            // End_Transmission: Analyzing the Event Horizon
          </p>
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Success in Research & Discovery of Serendipity.
          </div>
        </div>

      </div>
    </LogLayout>
  );
};

// 使用 ErrorBoundary 严密包裹
export default function ChaosLogWrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogContent />
    </ErrorBoundary>
  );
}