import React, { useState, useEffect, useRef } from 'react';

import LogLayout from '../components/LogLayout';
import figureCh8 from '../assets/Fem_Ch8_SturmLiouville.png';

// =========================================================
// 🛡️ Static Resource Isolation District
// =========================================================
const FORMULAS = {
  generalAdvective: "-\\varepsilon \\frac{d^2 u}{dx^2} + b(x) \\frac{du}{dx} = f(x), \\quad x \\in (a, b)",
  pecletNum: "Pe = \\frac{|b| h}{2\\varepsilon} > 1",
  supgForm: "a_{supg}(u, v) = a(u, v) + \\sum_e \\int_{K_e} \\delta \\left(b \\frac{dv}{dx}\\right) \\left(-\\varepsilon u'' + b u' - f\\right) dx"
};

const PYTHON_CODE_SUPG = [
  "# Assembly for Advection-Diffusion Equation with SUPG Stabilization",
  "Pe = (a * h) / (2.0 * eps)  # Local Element Peclet Number",
  "xi = 1.0 / np.tanh(Pe) - 1.0 / Pe if Pe > 1e-6 else 0.0",
  "delta = (h / (2.0 * a)) * xi  # Optimal SUPG Parameter",
  "",
  "for e in range(n):",
  "    # Standard Diffusion & Advection Matrices",
  "    k_diff = (eps / h) * np.array([[1.0, -1.0], [-1.0, 1.0]])",
  "    k_adv  = (a / 2.0)  * np.array([[-1.0, 1.0], [-1.0, 1.0]])",
  "    ",
  "    # SUPG Artificial Diffusion Modification",
  "    k_supg = (delta * a**2 / h) * np.array([[1.0, -1.0], [-1.0, 1.0]])",
  "    ",
  "    k_elem = k_diff + k_adv + k_supg",
  "    f_elem = np.array([h/2, h/2]) + delta * a * np.array([-1.0, 1.0])",
  "    # Global Assembly onto Sparse Matrix..."
].join('\n');

// =========================================================
// 🛡️ Error Boundary
// =========================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Ch8 Page Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d1117] text-white p-10 flex flex-col items-center justify-center font-mono">
          <div className="bg-red-900/40 border border-red-500/50 p-6 rounded-xl max-w-xl w-full">
            <h2 className="text-xl font-bold text-red-400 mb-2">⚠️ Render Error in Ch.8 Module</h2>
            <p className="text-xs text-red-200">{this.state.error?.toString()}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================
// Safe LaTeX Renderers
// =========================================================
const MathDisplay = ({ tex, katexReady }) => {
  const container = useRef(null);
  useEffect(() => {
    if (katexReady && window.katex && container.current) {
      try { window.katex.render(tex, container.current, { throwOnError: false, displayMode: true }); }
      catch (e) { console.error("KaTeX Error:", e); }
    }
  }, [tex, katexReady]);
  return <div ref={container} className="my-6 py-4 bg-white/[0.02] rounded-lg border border-white/5 overflow-x-auto text-center"></div>;
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
// Main Content
// =========================================================
const FemCh8LogContent = () => {
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
    <LogLayout title="FEM 2: CRITICAL ISSUES IN 1D & STABILITY" category="NUMERICAL_ANALYSIS" date="2026-07-22">
      <div className="space-y-12 font-mono text-white/80 text-sm md:text-base leading-relaxed max-w-5xl mx-auto pb-20">
        
        {/* Executive Summary */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">0. Purpose of Chapter 8</h3>
          <p>
            While Chapter 1 established the basic Galerkin formulation for simple Poisson problems, <strong>Chapter 8 tackles the numerical bottlenecks encountered in realistic 1D continuous models</strong>.
          </p>
          <p>
            Rather than lingering on standard Sturm–Liouville extensions, this post focuses on the two most critical milestones of 1D Finite Element Analysis: **Higher-Order Elements (§8.3)** and **Advection-Dominated Instabilities & SUPG Stabilization (§8.4 - §8.5)**.
          </p>
        </section>

        {/* 1. Quick Recap of Sturm-Liouville & Robin BCs */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">1. Condensed Brief: Variable Coefficients & Boundary Integrals</h3>
          <p>
            Generalizing to variable conductivity <InlineMath tex="p(x)" katexReady={katexReady} /> and mixed Robin boundary conditions (<InlineMath tex="p(b)u'(b) + \gamma u(b) = g_R" katexReady={katexReady} />) requires two main additions to our code:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-white/70 pl-2">
            <li><strong>Numerical Quadrature:</strong> Evaluating <InlineMath tex="\int p(x) \phi_i' \phi_j' dx" katexReady={katexReady} /> via 2-point Gauss rules.</li>
            <li><strong>Boundary Contributions:</strong> Appending <InlineMath tex="\gamma" katexReady={katexReady} /> directly to the last diagonal stiffness entry <InlineMath tex="A_{nn}" katexReady={katexReady} /> while preserving symmetry.</li>
          </ul>
        </section>

        {/* 2. Higher-Order Elements */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">2. Higher-Order Elements ($P_2$ Quadratic FE)</h3>
          <p>
            Standard linear elements (<InlineMath tex="P_1" katexReady={katexReady} />) yield <InlineMath tex="\mathcal{O}(h^2)" katexReady={katexReady} /> convergence in <InlineMath tex="L^2" katexReady={katexReady} />. To achieve higher accuracy without excessive mesh refinement, Chapter 8.3 introduces quadratic Lagrange elements (<InlineMath tex="P_2" katexReady={katexReady} />) with mid-side nodes:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs">
            <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
              <span className="text-cyan-400 font-bold block mb-1">P1 Linear Elements</span>
              Interpolation Error: <InlineMath tex="\|u - u_h\|_{L^2} = \mathcal{O}(h^2)" katexReady={katexReady} />
              <br />2 degrees of freedom per element.
            </div>
            <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded-lg">
              <span className="text-pink-400 font-bold block mb-1">P2 Quadratic Elements</span>
              Interpolation Error: <InlineMath tex="\|u - u_h\|_{L^2} = \mathcal{O}(h^3)" katexReady={katexReady} />
              <br />3 degrees of freedom per element (Includes mid-node).
            </div>
          </div>
        </section>

        {/* 3. The Central Bottleneck: Advection-Diffusion Equations */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">3. The Core Bottleneck: Advection-Dominated Transport</h3>
          <p>
            When an first-order advection term <InlineMath tex="b(x) u'" katexReady={katexReady} /> is introduced into the diffusion equation:
          </p>

          <MathDisplay tex={FORMULAS.generalAdvective} katexReady={katexReady} />

          <p>
            The resulting bilinear form becomes **asymmetric** (<InlineMath tex="a(u,v) \neq a(v,u)" katexReady={katexReady} />). 
            When diffusion is very small (<InlineMath tex="\varepsilon \ll 1" katexReady={katexReady} />), the system is advection-dominated, characterized by a high **Element Peclet Number**:
          </p>

          <MathDisplay tex={FORMULAS.pecletNum} katexReady={katexReady} />

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs leading-relaxed text-red-200">
            <span className="text-red-400 font-bold block mb-1">⚠️ GALERKIN BREAKDOWN:</span>
            Standard Galerkin FEM uses symmetric test spaces (<InlineMath tex="v \in V_h" katexReady={katexReady} />). In the presence of strong boundary layers, standard Galerkin produces severe, non-physical <strong>node-to-node spurious oscillations</strong> across the entire domain!
          </div>
        </section>

        {/* 4. SUPG Stabilization */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">4. Petrov-Galerkin Stabilization (SUPG Method)</h3>
          <p>
            To restore stability, the **Streamline Upwind / Petrov-Galerkin (SUPG)** method biases the test space along the flow direction by replacing test functions <InlineMath tex="v" katexReady={katexReady} /> with <InlineMath tex="v + \delta b \frac{dv}{dx}" katexReady={katexReady} />:
          </p>

          <MathDisplay tex={FORMULAS.supgForm} katexReady={katexReady} />

          <p>
            This effectively adds optimal <strong>artificial diffusion</strong> along streamlines without sacrificing consistency.
          </p>

          <div className="my-6 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117]">
            <div className="px-4 py-2 bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">
              supg_stabilization_core.py
            </div>
            <pre className="p-6 text-[11px] md:text-xs text-cyan-50/80 overflow-x-auto font-mono">
              <code>{PYTHON_CODE_SUPG}</code>
            </pre>
          </div>

          <figure className="my-8 overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
            <img 
              src={figureCh8} 
              alt="Advection Diffusion SUPG Stabilization Comparison" 
              className="w-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            />
            <figcaption className="p-4 text-center text-[10px] text-white/40 uppercase tracking-widest font-bold border-t border-white/5">
              Fig 1. Advection-Dominated Transport (\epsilon = 0.008): Standard Galerkin Oscillations (Pink) vs. SUPG Upwind Stabilization (Cyan).
            </figcaption>
          </figure>
        </section>

        {/* Conclusion */}
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">5. Chapter 8 Summary & 2D Outlook</h3>
          <p>
            Chapter 8 transforms FEM from an academic tool for self-adjoint Poisson problems into a robust framework capable of handling:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs md:text-sm text-white/70 pl-2">
            <li>Mixed Robin boundary integration without losing matrix symmetry.</li>
            <li>Higher-order $P_2$ elements for quadratic accuracy.</li>
            <li>SUPG stabilization to eliminate advective spurious oscillations.</li>
          </ul>
          <p className="mt-4">
            With 1D edge cases, high-order elements, and advective stabilization fully solved, we are ready to step into **Part II: 2D Finite Element Formulations**.
          </p>
        </section>

        {/* Outro */}
        <div className="py-16 border-y border-white/5 text-center space-y-6 mt-16">
          <p className="text-sm text-white/30 tracking-[0.4em] uppercase font-light italic">
            // End_Transmission: Chapter 8 Subsystem Integrated
          </p>
          <div className="inline-block px-8 py-4 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 text-[11px] tracking-[0.5em] uppercase shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            FE Method in One Space Dimension Finalized
          </div>	
        </div>

      </div>
    </LogLayout>
  );
};

export default function FemCh8LogWrapped() {
  return (
    <ErrorBoundary>
      <FemCh8LogContent />
    </ErrorBoundary>
  );
}