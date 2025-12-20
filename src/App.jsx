import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Github, Terminal, ChevronDown, Menu, X, ArrowRight, Zap } from 'lucide-react';

/**
 * =================================================================
 * 1. 核心组件：首页黑洞背景 (V25 Supermassive)
 * =================================================================
 */
const BlackHoleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 60, 200); 

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const CONFIG = { particleCount: 180000, horizonRadius: 9.0, diskInner: 12.0, diskOuterBase: 120.0, spawnZoneBase: 50.0, baseSpeed: 0.3, infallRate: 60.0 };
    const blackHole = new THREE.Mesh(new THREE.SphereGeometry(8.5, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    scene.add(blackHole);

    const positions = [], alphas = [], phases = [], radii = [], yOffsets = [], speeds = [], originalY = [], targetAlpha = [], infallMod = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const r = CONFIG.diskInner + (170.0 - CONFIG.diskInner) * Math.pow(Math.random(), 0.8);
        const angle = Math.random() * Math.PI * 2;
        const spread = (Math.random() - 0.5) * (0.3 + r * 0.02);
        positions.push(Math.cos(angle) * r, spread, Math.sin(angle) * r);
        alphas.push(0.0); targetAlpha.push(Math.random() * 0.6 + 0.4); phases.push(angle); radii.push(r);
        yOffsets.push(spread); originalY.push(spread); speeds.push(Math.random() * 0.2 + 0.9); infallMod.push(0.8 + Math.random() * 0.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { massScale: { value: 3.0 }, lensingStrength: { value: 1.0 } },
        vertexShader: `
            uniform float massScale; uniform float lensingStrength;
            attribute float alpha;
            varying float vAlpha;
            varying vec3 vColor;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vAlpha = alpha;
                vColor = vec3(1.0, 0.85, 0.6);
                float r = length(mvPosition.xy);
                float rs = massScale * 12.0;
                mvPosition.xy += normalize(mvPosition.xy) * ((rs * rs) / max(r, 0.1)) * lensingStrength;
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = (1300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying float vAlpha; varying vec3 vColor;
            void main() {
                if (length(gl_PointCoord - 0.5) > 0.5) discard;
                gl_FragColor = vec4(vColor, vAlpha * pow(1.0 - length(gl_PointCoord - 0.5) * 2.0, 2.0));
            }
        `,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    });
    
    const system = new THREE.Points(geometry, material);
    scene.add(system);

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const pos = geometry.attributes.position.array;
        const alp = geometry.attributes.alpha.array;
        for(let i=0; i<CONFIG.particleCount; i++) {
            let r = radii[i]; let phase = phases[i];
            let dilation = r > CONFIG.horizonRadius ? Math.sqrt(1.0 - (CONFIG.horizonRadius / r)) : 0;
            phase += (Math.sqrt(1500.0 / r) * dilation * delta * 0.06 * speeds[i]);
            r -= (60.0 / Math.sqrt(r)) * (dilation * dilation) * delta * 0.3 * infallMod[i];
            if (r < CONFIG.horizonRadius * 1.01) {
                r = 120.0 + Math.random() * 50.0;
                alp[i] = 0.0;
            }
            if (alp[i] < targetAlpha[i]) alp[i] += delta * 0.5;
            pos[i*3] = Math.cos(phase) * r; pos[i*3+1] = yOffsets[i]; pos[i*3+2] = Math.sin(phase) * r;
            radii[i] = r; phases[i] = phase;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.alpha.needsUpdate = true;
        renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', handleResize);
        if (containerRef.current) containerRef.current.innerHTML = '';
        renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute top-0 left-0 w-full h-full bg-black z-0" />;
};

/**
 * =================================================================
 * 2. 页面组件：Home 首页
 * =================================================================
 */
const Home = () => {
  const ArticleCard = ({ title, category, date }) => (
    <div className="group relative bg-black/20 border border-white/10 p-8 hover:border-cyan-500/50 hover:bg-black/40 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-cyan-500"><Zap size={20} /></div>
      <div className="text-cyan-500/80 text-[10px] font-mono tracking-widest mb-3 uppercase">{category}</div>
      <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-cyan-100 transition-colors">{title}</h3>
      <div className="text-white/40 text-xs font-mono flex items-center gap-2">
        <span>{date}</span><span className="w-4 h-[1px] bg-white/20" /><span>READ_LOG</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden text-white">
      <div className="fixed inset-0 z-0"><BlackHoleBackground /></div>
      <main className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none">
        <div className="flex flex-col items-start pointer-events-auto">
          <div className="mb-8 flex items-center gap-4 text-cyan-400 font-mono text-[10px] tracking-[0.3em] border-l-2 border-cyan-500 pl-4 bg-black/20 backdrop-blur-md py-1 pr-4 rounded-r">
            STATUS: ONLINE // 3.0 M☉
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-90 uppercase">
            Explore<br />THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">UNSEEN</span>
          </h1>
          
          {/* 修正：移除了移动端的强制单行显示，增加 md:whitespace-nowrap */}
          <div className="max-w-full text-white/90 text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/20 pl-6 backdrop-blur-sm bg-black/10 p-4 rounded-r-lg overflow-x-visible">
            <p className="mb-1">This is <strong>XiaoBai SAMA</strong>.</p>
            <p className="md:whitespace-nowrap tracking-tight">
              It remains that, from the same principles, I now demonstrate the frame of the System of the World.——Issac Newton
            </p>
          </div>

          <button className="flex items-center gap-2 bg-white text-black px-8 py-3 font-mono font-bold tracking-widest hover:bg-cyan-300 transition-colors">START READING <ArrowRight size={16} /></button>
        </div>
      </main>
      
      <section className="relative z-10 bg-black/40 backdrop-blur-lg py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold tracking-[0.2em] mb-16 text-white/80 uppercase">Latest_Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ArticleCard title="模拟卡冈图雅" category="PHYSICS" date="DEC 20" />
            <ArticleCard title="三体问题的混沌边缘" category="CHAOS" date="DEC 15" />
            <ArticleCard title="Shader 魔法" category="WEBGL" date="NOV 28" />
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * =================================================================
 * 3. 页面组件：BlackHoleModel
 * =================================================================
 */
const BlackHoleModel = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden pt-20 md:pt-0">
      <iframe src="/blackhole.html" title="Black Hole Simulation" className="w-full h-full border-0 block" />
    </div>
  );
};

/**
 * =================================================================
 * 4. 全局导航栏组件 (NavBar)
 * =================================================================
 */
const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelsSubMenuOpen, setIsModelsSubMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full p-6 z-[100] text-white mix-blend-difference pointer-events-none">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo 区域 */}
          <div onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="flex items-center gap-3 cursor-pointer group no-underline pointer-events-auto select-none">
            <div className="w-8 h-8 flex items-center justify-center border border-white group-hover:bg-white group-hover:text-black transition-colors">
              <Terminal size={16} />
            </div>
            <div className="flex flex-col text-white">
              <span className="text-lg font-bold tracking-widest leading-none">XIAOBAI</span>
              <span className="text-[10px] tracking-[0.3em] opacity-70">SAMA</span>
            </div>
            <div className="md:hidden ml-2 text-cyan-400">
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </div>
          </div>

          {/* 修正：桌面端导航字体放大 (text-sm), 间距微调 (gap-10) */}
          <div className="hidden md:flex gap-10 text-sm font-mono tracking-widest items-center pointer-events-auto uppercase font-semibold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <div className="relative group h-full">
              <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">Models <ChevronDown size={14} /></button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[180px] pt-0">
                <div className="bg-black/90 border border-white/10 backdrop-blur-xl flex flex-col p-1 shadow-2xl">
                  <Link to="/models/black-hole" className="px-4 py-3 text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all">// Black_Hole</Link>
                </div>
              </div>
            </div>
            <Link to="/lab" className="hover:text-cyan-400 transition-colors">Lab</Link>
            {/* GitHub 按钮文字也随之同步放大 */}
            <a href="https://github.com/Xiaobai1100" target="_blank" rel="noreferrer" className="border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition-all flex items-center gap-2">
              <Github size={14} /> Github
            </a>
          </div>
        </div>
      </nav>

      {/* 移动端抽屉 */}
      <div className={`fixed inset-0 z-[90] transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className={`absolute top-0 left-0 w-[80%] max-w-[300px] h-full bg-black/70 backdrop-blur-2xl border-r border-white/10 transition-transform duration-500 ease-out flex flex-col p-10 pt-32 gap-8 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-4 border-b border-white/10 pb-2 font-mono">Navigation_Menu</div>
          <Link to="/" className="text-lg font-bold tracking-[0.2em] text-white hover:text-cyan-400">HOME</Link>
          <div className="flex flex-col gap-4">
            <button onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)} className="text-lg font-bold tracking-[0.2em] flex items-center gap-2 text-white">
              MODELS <ChevronDown size={16} className={`transition-transform duration-300 ${isModelsSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isModelsSubMenuOpen && (
              <div className="flex flex-col gap-5 pl-4 border-l border-cyan-500/30 py-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <Link to="/models/black-hole" className="text-sm font-mono tracking-widest text-cyan-400">// BLACK_HOLE</Link>
              </div>
            )}
          </div>
          <Link to="/lab" className="text-lg font-bold tracking-[0.2em] text-white hover:text-cyan-400">LAB</Link>
        </div>
      </div>
    </>
  );
};

/**
 * =================================================================
 * 5. App 根组件
 * =================================================================
 */
const App = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models/black-hole" element={<BlackHoleModel />} />
        <Route path="*" element={<div className="h-screen bg-black text-white flex items-center justify-center font-mono uppercase tracking-widest">404: Orbit_Lost</div>} />
      </Routes>
    </Router>
  );
};

export default App;