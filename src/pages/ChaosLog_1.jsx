import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// ⚠️ 注意：在你本地项目中，请【解除】下方三行代码的注释！
// 这是为了确保你在本地和 Vercel 部署时，图片和布局能正常打包加载。
// =========================================================
import LogLayout from '../components/LogLayout';
import figure1 from '../assets/Figure_1.png';
import figure2 from '../assets/Figure_2.png';

// =========================================================
// 🛡️ 静态资源隔离区 (完全防爆机制)
// =========================================================
const FORMULAS = {
  linearization: "f(x) \\approx f(x^*) + f'(x^*)(x - x^*) \\implies x_{n+1} - x^* \\approx f'(x^*)(x_n - x^*)",
  logistic: "x_{n+1} = rx_n(1 - x_n), \\quad x \\in [0, 1]",
  chainRule: "(f^{(2^n)})'(x) = f'(x_1) \\cdot f'(x_2) \\cdots f'(x_{2^n})",
  feigenbaum: "\\delta = \\lim_{n \\to \\infty} \\frac{r_n - r_{n-1}}{r_{n+1} - r_n} \\approx 4.6692016...",
  schwarzian: "D_{sch} f(x) = \\left( \\frac{f''(x)}{f'(x)} \\right)' - \\frac{1}{2} \\left( \\frac{f''(x)}{f'(x)} \\right)^2 < 0"
};

const PYTHON_CODE = [
  "import numpy as np",
  "import matplotlib.pyplot as plt",
  "",
  "def logistic(r, x):",
  "    return r * x * (1 - x)",
  "",
  "# 1. Bifurcation Diagram",
  "def plot_bifurcation():",
  "    n = 10000",
  "    r = np.linspace(2.5, 4.0, n)",
  "    iterations = 1000",
  "    last = 100",
  "    x = 1e-5 * np.ones(n)",
  "    ",
  "    plt.figure(figsize=(10, 6))",
  "    for i in range(iterations):",
  "        x = logistic(r, x)",
  "        if i >= (iterations - last):",
  "            plt.plot(r, x, ',k', alpha=0.25)",
  "    plt.title('Bifurcation Diagram of Logistic Map')",
  "    plt.xlabel('r')",
  "    plt.ylabel('x')",
  "    plt.show()",
  "",
  "# 2. Cobweb Plot",
  "def plot_cobweb(r, x0=0.1, iters=50):",
  "    x = np.linspace(0, 1, 100)",
  "    plt.figure(figsize=(6, 6))",
  "    plt.plot(x, logistic(r, x), 'r', label='f(x)')",
  "    plt.plot(x, x, 'k--', label='y=x')",
  "    ",
  "    cur_x = x0",
  "    for _ in range(iters):",
  "        y = logistic(r, cur_x)",
  "        plt.plot([cur_x, cur_x], [cur_x, y], 'b', alpha=0.3)",
  "        plt.plot([cur_x, y], [y, y], 'b', alpha=0.3)",
  "        cur_x = y",
  "    plt.title(f'Cobweb Plot (r={r})')",
  "    plt.show()",
  "",
  "plot_bifurcation()",
  "plot_cobweb(r=3.9)"
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

// =========================================================
// 组件: 行内公式渲染器
// =========================================================
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
    <LogLayout title="CHAOS 1: INTRO_OF_DYNAMICAL_SYSTEMS" category="RESEARCH" date="2026-03-26">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        <section className="space-y-4">
          <p>
            In non-linear dynamics, a deceptively simple rule can often breed immensely complex behavior. 
            This log explores the core theories of dynamical systems, starting from fundamental fixed points 
            and journeying step-by-step into the profound mysteries of Chaos.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Dynamical Systems: Discrete vs. Continuous</h3>
          <p>Dynamical systems are primarily categorized into two major classes:</p>
          <ul className="list-disc list-inside space-y-2 text-white/70 ml-4">
            <li><strong>Discrete Systems (Iterative Maps):</strong> Described by iterative mappings <InlineMath tex="x_{n+1} = f(x_n)" katexReady={katexReady} />.</li>
            <li><strong>Continuous Systems:</strong> Described by Differential Equations.</li>
          </ul>
          <p className="mt-4">The core focus of this log will be exclusively on discrete iterative maps.</p>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Fixed Points an& Stability</h3>
          <p>
            <strong>Definition:</strong> If a point satisfies <InlineMath tex="f(x^*) = x^*" katexReady={katexReady} />, then <InlineMath tex="x^*" katexReady={katexReady} /> is called a <em>Fixed Point</em>.
          </p>
          <p>
            <strong>Stability Criterion:</strong> We want to investigate: if the initial value slightly deviates from <InlineMath tex="x^*" katexReady={katexReady} />, will the system return to it or escape? By applying linearization approximation:
          </p>
          
          <MathDisplay tex={FORMULAS.linearization} katexReady={katexReady} />
          
          <p className="font-bold text-white mt-4">Conclusion:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs tracking-widest">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded">
              <span className="text-cyan-400 font-black block mb-1">STABLE (ATTRACTOR)</span>
              If <InlineMath tex="|f'(x^*)| < 1" katexReady={katexReady} />, the fixed point is stable.
            </div>
            <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded">
              <span className="text-pink-400 font-black block mb-1">UNSTABLE (REPELLOR)</span>
              If <InlineMath tex="|f'(x^*)| > 1" katexReady={katexReady} />, the fixed point is unstable.
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Classic Case: Logistic Map</h3>
          <p>
            The equation for the Logistic Map is given by:
          </p>
          
          <MathDisplay tex={FORMULAS.logistic} katexReady={katexReady} />
          
          <p>
            Its derivative is <InlineMath tex="f'(x) = r - 2rx" katexReady={katexReady} />. As the parameter <InlineMath tex="r" katexReady={katexReady} /> increases, the system exhibits distinctly different dynamical characteristics:
          </p>
          
          <ul className="space-y-4 text-white/70 ml-4">
            <li>
              <strong className="text-white">Stage 1: Convergence to Zero (<InlineMath tex="r \in [0, 1]" katexReady={katexReady} />)</strong><br/>
              The only fixed point <InlineMath tex="x^* = 0" katexReady={katexReady} /> is stable. The system will eventually face "extinction".
            </li>
            <li>
              <strong className="text-white">Stage 2: Convergence to Equilibrium (<InlineMath tex="r \in (1, 3]" katexReady={katexReady} />)</strong><br/>
              <InlineMath tex="x^* = 0" katexReady={katexReady} /> becomes unstable, while a new fixed point <InlineMath tex="x^* = 1 - 1/r" katexReady={katexReady} /> is born and remains stable.
            </li>
            <li>
              <strong className="text-white">Stage 3: Period-Doubling Bifurcation (<InlineMath tex="r > 3" katexReady={katexReady} />)</strong><br/>
              When <InlineMath tex="r = 3" katexReady={katexReady} />, <InlineMath tex="f'(x^*)" katexReady={katexReady} /> reaches <InlineMath tex="-1" katexReady={katexReady} />, and the fixed point loses stability. The system no longer settles at a single point, but begins to oscillate between two values, forming a 2-cycle. At this point, it satisfies <InlineMath tex="f(f(x)) = x" katexReady={katexReady} />.
            </li>
          </ul>

          <ChaosLab />
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Period Doubling and the Feigenbaum Constant</h3>
          <p>
            For a <InlineMath tex="2^n" katexReady={katexReady} />-cycle, its stability is determined by the chain rule of the composite function:
          </p>
          
          <MathDisplay tex={FORMULAS.chainRule} katexReady={katexReady} />
          
          <p>As long as the absolute value of this product is less than 1, the periodic orbit is stable.</p>

          <h4 className="font-bold text-cyan-400 mt-6">The First Feigenbaum Constant</h4>
          <p>
            As <InlineMath tex="r" katexReady={katexReady} /> increases, bifurcations occur at an accelerating rate. Let <InlineMath tex="r_n" katexReady={katexReady} /> be the parameter value where the <InlineMath tex="2^n" katexReady={katexReady} />-cycle begins; the convergence ratio approaches a universal constant:
          </p>

          <MathDisplay tex={FORMULAS.feigenbaum} katexReady={katexReady} />

          <p>
            <strong>Why is <InlineMath tex="\delta" katexReady={katexReady} /> so profoundly important? (Universality)</strong><br/>
            Universality is one of the most mesmerizing discoveries in non-linear science. Whether it is the Logistic Map or the Sine Map <InlineMath tex="x_{n+1} = r \sin(\pi x_n)" katexReady={katexReady} />, as long as the function is quadratically continuous at its maximum point, their rhythm of approaching chaos (<InlineMath tex="\delta" katexReady={katexReady} />) is exactly identical!
          </p>
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Cobweb Plots and Bifurcation Diagrams</h3>
          <p>
            We can intuitively observe this mathematical transition using Python code.
          </p>
          
          <CodeBlock code={PYTHON_CODE} />
          
          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figure2} 
              alt="Bifurcation Diagram" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity invert hue-rotate-180"
              style={{ filter: "invert(1) hue-rotate(180deg) contrast(1.2)" }} 
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Bifurcation Diagram outlining the route to chaos.
            </figcaption>
          </figure>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figure1} 
              alt="Cobweb Plot" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 2. Cobweb Plot mapping dynamic trajectories.
            </figcaption>
          </figure>
        </section>

        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">6. Schwarzian Derivative & Constant Verification</h3>
          <p>
            Why are certain functions guaranteed to undergo a period-doubling cascade and ultimately yield the universal constant <InlineMath tex="\delta" katexReady={katexReady} />? The critical condition for this mathematical guarantee lies within the <strong>Schwarzian Derivative</strong>:
          </p>
          
          <MathDisplay tex={FORMULAS.schwarzian} katexReady={katexReady} />
          
          <p className="opacity-70">
            If a unimodal map maintains a negative Schwarzian derivative across its entire interval, it mathematically ensures that the map possesses <em>at most one</em> stable periodic orbit at any given parameter value. 
          </p>
          <p className="bg-white/5 p-4 border-l-2 border-cyan-500/50 text-xs italic">
            // This is the fundamental verification criterion: A negative Schwarzian derivative prevents the coexistence of competing attractors. When a fixed point loses stability, this condition forces the system to birth a clean, non-competing period-doubled orbit, thereby ensuring the infinite cascade structure necessary to derive the universal Feigenbaum constant <InlineMath tex="\delta \approx 4.669" katexReady={katexReady} />.
          </p>
        </section>

        <section className="space-y-4 pt-8">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">Conclusion</h3>
          <p className="opacity-80 leading-relaxed">
            From a simple inequality <InlineMath tex="|f'| < 1" katexReady={katexReady} /> to the universal constant <InlineMath tex="4.669" katexReady={katexReady} />, we witness the hidden order embedded within the chaos of nature. This continuous transition from steady-state to oscillation, and ultimately to chaos, forms the fundamental mathematical cornerstone for understanding real-world complexities such as fluid turbulence, financial market volatility, and biological population evolution.
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

export default function ChaosLogWrapped() {
  return (
    <ErrorBoundary>
      <ChaosLogContent />
    </ErrorBoundary>
  );
}