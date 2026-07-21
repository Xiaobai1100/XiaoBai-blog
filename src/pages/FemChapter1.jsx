import React, { useState, useEffect, useRef } from 'react';

// =========================================================
// Note: Ensure your local assets & components are correct!
// =========================================================
import LogLayout from '../components/LogLayout';
import figure1 from '../assets/Fem_Convergence.png';

// =========================================================
// Static Resource Isolation District
// =========================================================
const FORMULAS = {
  strongForm: "-\\frac{d}{dx}\\left( p(x) \\frac{du}{dx} \\right) + q(x)u(x) = f(x), \\quad x \\in (0, 1)",
  boundary: "u(0) = 0, \\quad u(1) = 0",
  coefficients: "p(x) = e^x, \\quad q(x) = x, \\quad f(x) = \\pi^2 e^x \\sin(\\pi x) - e^x \\pi \\cos(\\pi x) + x \\sin(\\pi x)",
  exactSol: "u(x) = \\sin(\\pi x)",
  weakForm: "\\text{Find } u \\in V_0 \\text{ such that } a(u, v) = l(v) \\quad \\forall v \\in V_0",
  bilinear: "a(u, v) = \\int_0^1 \\left( p(x) u'(x) v'(x) + q(x) u(x) v(x) \\right) dx, \\quad l(v) = \\int_0^1 f(x) v(x) dx",
  discretization: "u_h(x) = \\sum_{j=1}^{n-1} U_j \\phi_j(x)",
  system: "(K + M)U = F",
  matrixK: "K_{ij} = \\int_0^1 p(x) \\phi_j'(x) \\phi_i'(x) dx, \\quad M_{ij} = \\int_0^1 q(x) \\phi_j(x) \\phi_i(x) dx",
  loadVector: "F_i = \\int_0^1 f(x) \\phi_i(x) dx"
};

const PYTHON_CODE = [
  "import numpy as np",
  "import scipy.sparse as sp",
  "import scipy.sparse.linalg as spla",
  "",
  "def solve_fem_1d(n):",
  "    h = 1.0 / n",
  "    nodes = np.linspace(0, 1, n + 1)",
  "    ",
  "    # 2-Point Gauss Quadrature rules on [-1, 1] mapped to [0, 1]",
  "    gp = np.array([-1.0/np.sqrt(3), 1.0/np.sqrt(3)])",
  "    gw = np.array([1.0, 1.0])",
  "    ",
  "    # Define physical parameters",
  "    p = lambda x: np.exp(x)",
  "    q = lambda x: x",
  "    f = lambda x: (np.pi**2 * np.exp(x) * np.sin(np.pi*x) ",
  "                   - np.exp(x)*np.pi*np.cos(np.pi*x) + x*np.sin(np.pi*x))",
  "    ",
  "    rows, cols, data_K, data_M = [], [], [], []",
  "    F = np.zeros(n - 1)",
  "    ",
  "    for e in range(n):",
  "        xL, xR = nodes[e], nodes[e+1]",
  "        # Map Gauss points to element [xL, xR]",
  "        xq = 0.5 * (xR - xL) * gp + 0.5 * (xR + xL)",
  "        wq = 0.5 * (xR - xL) * gw",
  "        ",
  "        for i_local in range(2):",
  "            node_i = e if i_local == 0 else e + 1",
  "            if node_i == 0 or node_i == n: continue  # Boundary nodes",
  "            ",
  "            # Assembly of load vector F",
  "            for q_idx in range(len(xq)):",
  "                phi_i = (xR - xq[q_idx])/h if i_local == 0 else (xq[q_idx] - xL)/h",
  "                F[node_i - 1] += wq[q_idx] * f(xq[q_idx]) * phi_i",
  "                ",
  "            for j_local in range(2):",
  "                node_j = e if j_local == 0 else e + 1",
  "                if node_j == 0 or node_j == n: continue",
  "                ",
  "                # Integrals for K and M Matrices",
  "                val_K, val_M = 0.0, 0.0",
  "                for q_idx in range(len(xq)):",
  "                    dphi_i = -1.0/h if i_local == 0 else 1.0/h",
  "                    dphi_j = -1.0/h if j_local == 0 else 1.0/h",
  "                    phi_i = (xR - xq[q_idx])/h if i_local == 0 else (xq[q_idx] - xL)/h",
  "                    phi_j = (xR - xq[q_idx])/h if j_local == 0 else (xq[q_idx] - xL)/h",
  "                    ",
  "                    val_K += wq[q_idx] * p(xq[q_idx]) * dphi_i * dphi_j",
  "                    val_M += wq[q_idx] * q(xq[q_idx]) * phi_i * phi_j",
  "                ",
  "                rows.append(node_i - 1)",
  "                cols.append(node_j - 1)",
  "                data_K.append(val_K)",
  "                data_M.append(val_M)",
  "                ",
  "    A = sp.coo_matrix((data_K, (rows, cols)), shape=(n-1, n-1)).tocsr() + \\",
  "        sp.coo_matrix((data_M, (rows, cols)), shape=(n-1, n-1)).tocsr()",
  "        ",
  "    U_interior = spla.spsolve(A, F)",
  "    U = np.zeros(n + 1)",
  "    U[1:n] = U_interior",
  "    return nodes, U"
].join('\n');

// =========================================================
// Error Boundary Defense System
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
    console.error("FEM Page Crashed:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-white p-10 flex flex-col items-center justify-center font-mono">
          <div className="bg-red-900/50 border border-red-500 p-8 rounded-xl max-w-3xl w-full shadow-2xl">
            <h2 className="text-2xl font-black text-red-400 mb-4 tracking-widest uppercase">⚠️ Numerical Instability / Render Crash</h2>
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
// Interactive Component: Finite Element Mesh Visualizer
// =========================================================
const FemLab = () => {
  const [n, setN] = useState(4);
  const canvasRef = useRef(null);
  const width = 500;
  const height = 150;
  const padding = 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const toPx = (x) => padding + x * (width - 2 * padding);
    const h = 1.0 / n;

    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toPx(0), height / 2);
    ctx.lineTo(toPx(1), height / 2);
    ctx.stroke();

    for (let i = 0; i <= n; i++) {
      const x = i * h;
      const px = toPx(x);

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = i === 0 || i === n ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(px, height / 2 - 10);
      ctx.lineTo(px, height / 2 + 10);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`x${i}`, px, height / 2 + 25);

      if (i < n) {
        const xL = x;
        const xR = (i + 1) * h;
        const gp1 = 0.5 * (xR - xL) * (-1.0 / Math.sqrt(3)) + 0.5 * (xR + xL);
        const gp2 = 0.5 * (xR - xL) * (1.0 / Math.sqrt(3)) + 0.5 * (xR + xL);

        [gp1, gp2].forEach((gp) => {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(toPx(gp), height / 2, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    }
  }, [n]);

  return (
    <div className="my-10 p-6 bg-black/60 border border-white/10 rounded-2xl font-mono shadow-2xl">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <span className="text-xs text-cyan-400 uppercase tracking-[0.2em] font-black">// 1D Mesh & Gauss Points Visualizer</span>
        </div>
        
        <div className="overflow-x-auto flex justify-center">
          <canvas ref={canvasRef} width={width} height={height} className="bg-slate-950/80 rounded-lg border border-white/5" />
        </div>

        <div className="max-w-md mx-auto w-full space-y-4">
          <div className="flex justify-between text-xs text-cyan-300 uppercase tracking-widest font-bold">
            <span>Elements (n)</span>
            <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{n} Elements</span>
          </div>
          <input 
            type="range" min="2" max="12" step="1" value={n} 
            onChange={(e) => setN(parseInt(e.target.value) || 2)} 
            className="w-full accent-cyan-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" 
          />
          <p className="text-[11px] text-white/40 text-center uppercase tracking-wider leading-relaxed">
            Blue Bars = Node Coordinates (<span className="text-cyan-400">Mesh Boundary</span>) <br />
            Pink Dots = 2-Point Gauss Quadrature Points per element
          </p>
        </div>
      </div>
    </div>
  );
};

// =========================================================
// Safe LaTeX Mathematical Renderers
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
// Python Code Display Block
// =========================================================
const CodeBlock = ({ code }) => (
  <div className="my-8 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-2xl">
    <div className="flex items-center px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
      <span>fem_1d_solver.py</span>
    </div>
    <pre className="p-6 text-[11px] md:text-xs text-cyan-50/80 overflow-x-auto font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

// =========================================================
// Main Content
// =========================================================
const FemLogContent = () => {
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
    <LogLayout title="FEM 1: 1D SELF-ADJOINT SOLVER" category="NUMERICAL_ANALYSIS" date="2026-07-17">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        {/* ========================================= */}
        {/* 💡 新增：文章头部署名 (Guest Author) */}
        {/* ========================================= */}
        <div className="mb-8 flex items-center gap-4 text-cyan-400/80 text-xs tracking-[0.2em] uppercase font-bold border-l-2 border-cyan-500/50 pl-4 bg-cyan-500/5 py-2 rounded-r">
          <span className="w-4 h-[1px] bg-cyan-500/50"></span>
          <span>Data Contributor: BaruchChen</span>
        </div>

        {/* Preface */}
        <section className="space-y-4">
          <p>
            After establishing the theoretical foundation of the 1D Finite Element Method (FEM), we must put our formulas to the numerical test. 
            As the concluding hands-on challenge of Chapter 1, we focus on a classic **1D self-adjoint variable-coefficient boundary value problem**.
            Through systematic weak derivation, element assembly with high-precision quadrature, and raw Python code, we directly observe the aesthetic and mathematical convergence of finite element approximations.
          </p>
        </section>

        {/* 1. Problem Statement */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Problem Statement</h3>
          <p>
            Consider a 1D steady-state thermal conduction equation with a spatially variable conductivity <InlineMath tex="p(x)" katexReady={katexReady} /> 
            and a non-uniform heat source <InlineMath tex="f(x)" katexReady={katexReady} /> over the spatial domain <InlineMath tex="\Omega = (0, 1)" katexReady={katexReady} />:
          </p>
          
          <MathDisplay tex={FORMULAS.strongForm} katexReady={katexReady} />
          
          <p>subjected to the homogeneous Dirichlet boundary conditions:</p>
          <MathDisplay tex={FORMULAS.boundary} katexReady={katexReady} />

          <p>In this specific validation, we define our variable coefficients and source term as:</p>
          <MathDisplay tex={FORMULAS.coefficients} katexReady={katexReady} />

          <p>
            Under this set of physical parameters, the analytical exact solution to the strong system is elegantly given by:
          </p>
          <MathDisplay tex={FORMULAS.exactSol} katexReady={katexReady} />

          <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-lg mt-4">
            <span className="text-xs text-cyan-400 font-bold tracking-widest block mb-2">🎯 CORE OBECTIVES:</span>
            <ul className="list-decimal list-inside space-y-1.5 text-xs text-white/70">
              <li>Derive the Weak Formulation of the variable-coefficient differential system.</li>
              <li>Formulate the discrete system using piecewise linear (Hat) basis functions on a uniform mesh of step size <InlineMath tex="h = 1/n" katexReady={katexReady} />.</li>
              {/* 💡 修复：替换掉了纯文本的 $L^2$ 和 $H^1$ */}
              <li>Construct a complete Python solver, executing exact <InlineMath tex="L^2" katexReady={katexReady} /> and <InlineMath tex="H^1" katexReady={katexReady} /> error convergence audits.</li>
            </ul>
          </div>
        </section>

        {/* 2. Mathematical Solution */}
        <section className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Mathematical Solution</h3>
          
          <h4 className="text-lg font-bold text-cyan-400">2.1 The Weak Formulation</h4>
          <p>
            We introduce the Sobolev subspace <InlineMath tex="V_0 = H^1_0(0,1) = \{ v \in H^1(0,1) \mid v(0)=v(1)=0 \}" katexReady={katexReady} />.
            Multiplying the strong differential equation by a test function <InlineMath tex="v \in V_0" katexReady={katexReady} /> and integrating over the domain yields:
          </p>
          <MathDisplay tex="-\int_0^1 \frac{d}{dx}\left( p(x) \frac{du}{dx} \right) v(x) \, dx + \int_0^1 q(x) u(x) v(x) \, dx = \int_0^1 f(x) v(x) \, dx" katexReady={katexReady} />
          
          <p>Applying Integration by Parts to the higher-order differential operator:</p>
          <MathDisplay tex="-\left[ p(x) \frac{du}{dx} v(x) \right]_0^1 + \int_0^1 p(x) \frac{du}{dx} \frac{dv}{dx} \, dx + \int_0^1 q(x) u(x) v(x) \, dx = \int_0^1 f(x) v(x) \, dx" katexReady={katexReady} />
          
          <p>
            {/* 💡 修复：替换掉了纯文本的 v(0)=v(1)=0 */}
            Because any test function <InlineMath tex="v \in V_0" katexReady={katexReady} /> vanishes at the boundaries (<InlineMath tex="v(0)=v(1)=0" katexReady={katexReady} />), the boundary terms seamlessly vanish. The continuous weak form is then defined as: find <InlineMath tex="u \in V_0" katexReady={katexReady} /> such that:
          </p>
          <MathDisplay tex={FORMULAS.weakForm} katexReady={katexReady} />
          <p>where the bilinear form and linear functional are defined respectively as:</p>
          <MathDisplay tex={FORMULAS.bilinear} katexReady={katexReady} />

          <h4 className="text-lg font-bold text-cyan-400 mt-6">2.2 Finite Element Space Discretization & Assembly</h4>
          <p>
            {/* 💡 修复：替换掉了纯文本的 n */}
            We decompose the domain into <InlineMath tex="n" katexReady={katexReady} /> equal elements with node coordinates <InlineMath tex="x_i = ih" katexReady={katexReady} />.
            Let the finite-dimensional space <InlineMath tex="V_h \subset V_0" katexReady={katexReady} /> be spanned by the continuous piecewise linear basis functions (Hat functions) <InlineMath tex="\{\phi_i(x)\}_{i=1}^{n-1}" katexReady={katexReady} />:
          </p>
          <MathDisplay tex={FORMULAS.discretization} katexReady={katexReady} />
          
          <p>
            Substituting this representation into the weak form leads directly to the discrete matrix system:
          </p>
          <MathDisplay tex={FORMULAS.system} katexReady={katexReady} />
          <p>
            {/* 💡 修复：替换掉了纯文本的 K, M, F */}
            where the stiffness matrix <InlineMath tex="K" katexReady={katexReady} />, mass matrix <InlineMath tex="M" katexReady={katexReady} />, and load vector <InlineMath tex="F" katexReady={katexReady} /> entries are computed locally:
          </p>
          <MathDisplay tex={FORMULAS.matrixK} katexReady={katexReady} />
          <MathDisplay tex={FORMULAS.loadVector} katexReady={katexReady} />
          
          <p>
            Since the variable coefficients <InlineMath tex="p(x)" katexReady={katexReady} /> and <InlineMath tex="q(x)" katexReady={katexReady} /> prevent direct analytical integration on the element domain, we must utilize a **2-point Gaussian quadrature** for high-precision numerical approximation on each local element.
          </p>

          <FemLab />
        </section>

        {/* 3. Programming Implementation */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. Python Solver Implementation</h3>
          <p>
            Below is the complete 1D FEM solver script implementing dynamic local element mapping, Gaussian quadrature, and sparse matrix solving:
          </p>
          <CodeBlock code={PYTHON_CODE} />
        </section>

        {/* 4. Conclusion */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Numerical Convergence Analysis</h3>
          <p>
            {/* 💡 修复：替换掉了纯文本的 n = 4, 8... */}
            Executing numerical error convergence checks on progressively refined meshes (<InlineMath tex="n = 4, 8, 16, 32, 64, 128" katexReady={katexReady} />) reveals the robust precision of the formulation:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs tracking-widest my-6">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded">
              <span className="text-cyan-400 font-black block mb-1">L² NORM CONVERGENCE</span>
              {/* 💡 修复：替换掉了纯文本公式 */}
              The numerical solution <InlineMath tex="u_h" katexReady={katexReady} /> converges to the exact solution at an optimal quadratic rate of <InlineMath tex="\mathcal{O}(h^2)" katexReady={katexReady} /> in the <InlineMath tex="L^2" katexReady={katexReady} />-norm.
            </div>
            <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded">
              <span className="text-pink-400 font-black block mb-1">H¹ SEMI-NORM CONVERGENCE</span>
              {/* 💡 修复：替换掉了纯文本公式 */}
              The derivative error <InlineMath tex="u'_h" katexReady={katexReady} /> converges linearly at a rate of <InlineMath tex="\mathcal{O}(h)" katexReady={katexReady} /> under the energy norm (the <InlineMath tex="H^1" katexReady={katexReady} />-semi-norm).
            </div>
          </div>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-white/5">
            <img 
              src={figure1} 
              alt="FEM Error Convergence Analysis" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Log-Log Error Convergence Plot verifying optimal H¹ and L² scaling.
            </figcaption>
          </figure>

          <p>
            These convergence behaviors seamlessly validate the core predictions of mathematical finite element theory, namely the **Lax-Milgram theorem** and **Céa's Lemma**. 
            Even in heterogeneous materials (variable coefficients), piecewise local polynomial approximations offer flawless stability, mathematical elegance, and guaranteed numerical error bounds.
          </p>
        </section>

        {/* Transmission End */}
        <div className="py-16 border-y border-white/5 text-center space-y-8 mt-16">
          <p className="text-sm text-white/30 tracking-[0.4em] uppercase font-light italic">
            // End_Transmission: FEM Appendix Subsystem Built
          </p>
          
          {/* ========================================= */}
          {/* 💡 新增：文章结尾终端风格署名 */}
          {/* ========================================= */}
          <div className="inline-block px-10 py-5 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.6em] uppercase shadow-[0_0_40px_rgba(34,211,238,0.1)]">
            Finite Element Workspace has been built
          </div>	
          
          <p className="text-xs text-white/40 tracking-[0.3em] uppercase mt-6 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-cyan-500/50 rounded-full animate-ping"></span>
            Signal Originated By: BaruchChen
          </p>
        </div>

        {/* References */}
        <div className="pt-16 text-[10px] text-white/20 tracking-wider space-y-1.5 uppercase font-light">
          <p className="font-bold mb-2 text-white/30 tracking-[0.3em]">References</p>
          <p>The Mathematical Theory of Finite Element Methods (Susanne C. Brenner, L. Ridgway Scott)</p>
          <p>Numerical Solution of Partial Differential Equations by the Finite Element Method (Claes Johnson)</p>
        </div>

      </div>
    </LogLayout>
  );
};

export default function FemLogWrapped() {
  return (
    <ErrorBoundary>
      <FemLogContent />
    </ErrorBoundary>
  );
}