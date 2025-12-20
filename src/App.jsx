import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Github, Terminal, ChevronDown, FlaskConical, Boxes, Menu, X, ArrowRight, Zap, ArrowLeft } from 'lucide-react';

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

    const positions = [], colors = [], sizes = [], alphas = [], phases = [], radii = [], yOffsets = [], speeds = [], originalY = [], targetAlpha = [], infallMod = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const r = CONFIG.diskInner + (CONFIG.diskOuterBase + CONFIG.spawnZoneBase - CONFIG.diskInner) * Math.pow(Math.random(), 0.8);
        const angle = Math.random() * Math.PI * 2;
        const spread = (Math.random() - 0.5) * (0.3 + (r * 0.02));
        positions.push(Math.cos(angle) * r, spread, Math.sin(angle) * r);
        colors.push(1.0, 0.85, 0.6); sizes.push(Math.random() * 0.5 + 0.5); alphas.push(0.0);
        targetAlpha.push(Math.random() * 0.6 + 0.4); phases.push(angle); radii.push(r);
        yOffsets.push(spread); originalY.push(spread); speeds.push(Math.random() * 0.2 + 0.9); infallMod.push(0.8 + Math.random() * 0.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { massScale: { value: 3.0 }, lensingStrength: { value: 1.0 } },
        vertexShader: `
            uniform float massScale; uniform float lensingStrength;
            attribute float size; attribute float alpha; attribute vec3 customColor;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vec3 velObj = normalize(vec3(-position.z, 0.0, position.x));
                vec3 velView = normalize(normalMatrix * velObj);
                vec3 viewDir = normalize(-mvPosition.xyz);
                float doppler = dot(velView, viewDir);
                float beaming = pow(1.0 + 0.6 * doppler, 2.0); 
                float rsPhys = massScale * 3.0; float rPhys = length(position.xyz);
                float gShift = sqrt(clamp(1.0 - (rsPhys / (rPhys + 0.1)), 0.0, 1.0));
                vec3 redshiftedColor = customColor;
                redshiftedColor.g *= smoothstep(0.0, 0.4, gShift); redshiftedColor.b *= smoothstep(0.0, 0.4, gShift);
                vColor = redshiftedColor * beaming * gShift * 1.5; vAlpha = alpha;
                float r = length(mvPosition.xy); float rs = massScale * 12.0; 
                float distortionFactor = ((rs * rs) / max(r, 0.1)) * lensingStrength;
                mvPosition.xy += normalize(mvPosition.xy) * distortionFactor;
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * (1300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor; varying float vAlpha;
            void main() {
                float dist = length(gl_PointCoord - 0.5);
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, vAlpha * pow(1.0 - (dist * 2.0), 2.0));
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
        system.rotation.y += delta * 0.02;
        const pos = geometry.attributes.position.array;
        const alp = geometry.attributes.alpha.array;
        let simDelta = delta * CONFIG.baseSpeed;

        for(let i=0; i<CONFIG.particleCount; i++) {
            let r = radii[i]; let phase = phases[i];
            let dilation = r > CONFIG.horizonRadius ? Math.sqrt(1.0 - (CONFIG.horizonRadius / r)) : 0.0;
            phase += (Math.sqrt(1500.0 / r) * dilation * simDelta * 0.2 * speeds[i]);
            let plungeRegion = CONFIG.horizonRadius * 3.0;
            let infallBase = (CONFIG.infallRate / Math.sqrt(r)) * (r < plungeRegion ? (1.0 + 2.0 * (1.0 - (r - CONFIG.horizonRadius) / (plungeRegion - CONFIG.horizonRadius))) : 1.0);
            r -= infallBase * (dilation * dilation) * simDelta * infallMod[i];
            if (r < CONFIG.horizonRadius * 1.01) {
                r = CONFIG.diskOuterBase + Math.random() * CONFIG.spawnZoneBase;
                alp[i] = 0.0; yOffsets[i] = (Math.random() - 0.5) * (0.3 + r * 0.02); originalY[i] = yOffsets[i];
            }
            yOffsets[i] += (originalY[i] - yOffsets[i]) * 0.05;
            if (r > CONFIG.diskOuterBase) {
                let opacity = Math.max(0, 1.0 - ((r - CONFIG.diskOuterBase) / CONFIG.spawnZoneBase));
                alp[i] = Math.min(alp[i] + delta * 0.5, opacity);
            } else {
                if (alp[i] < targetAlpha[i]) alp[i] += delta * 0.5;
            }
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
        geometry.dispose(); material.dispose();
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
        <span>{date}</span><span className="w-4 h-[1px] bg-white/20" /><span className="group-hover:translate-x-1 transition-transform duration-300">READ_LOG</span>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden text-white">
      <div className="fixed inset-0 z-0"><BlackHoleBackground /></div>
      <main className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none">
        <div className="flex flex-col items-start pointer-events-auto">
          <div className="mb-8 flex items-center gap-4 text-cyan-400 font-mono text-xs tracking-widest border-l-2 border-cyan-500 pl-4 bg-black/20 backdrop-blur-md py-1 pr-4 rounded-r">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>
            STATUS: ONLINE // 3.0 M☉
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-90">VISUALIZE<br />THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">UNSEEN</span></h1>
          <p className="max-w-xl text-white/90 text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/20 pl-6 backdrop-blur-sm bg-black/10 p-4 rounded-r-lg">我是 <strong>XiaoBai SAMA</strong>。<br />用 WebGL 重构宇宙。</p>
          <button className="flex items-center gap-2 bg-white text-black px-8 py-3 font-mono font-bold tracking-widest hover:bg-cyan-300 transition-colors">START READING <ArrowRight size={16} /></button>
        </div>
      </main>
      <section className="relative z-10 bg-black/30 backdrop-blur-md py-24 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16"><h2 className="text-4xl font-bold tracking-tighter mix-blend-overlay text-white opacity-90">LATEST LOGS</h2><div className="text-sm font-mono text-cyan-400">2025.12.20</div></div>
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
 * 3. 页面组件：BlackHoleModel 独立模型页
 * =================================================================
 */
const BlackHoleModel = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 这里的 iframe 加载你 public/blackhole.html 中 1:1 的原生代码 */}
      <iframe src="/blackhole.html" title="Black Hole Simulation" className="w-full h-full border-0 block" style={{ backgroundColor: 'black' }} />
    </div>
  );
};

/**
 * =================================================================
 * 4. 全局导航栏组件 (NavBar) - 适配移动端点击标题展开
 * =================================================================
 */
const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelsSubMenuOpen, setIsModelsSubMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => { setIsMenuOpen(false); setIsModelsSubMenuOpen(false); };

  return (
    <nav className="fixed top-0 left-0 w-full p-6 z-[100] text-white mix-blend-difference pointer-events-none">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        
        {/* Logo 区域：在手机端点击此区域即展开下拉 */}
        <div 
          onClick={toggleMenu}
          className="flex items-center gap-3 cursor-pointer group no-underline pointer-events-auto select-none"
        >
          <div className="w-8 h-8 flex items-center justify-center border border-white group-hover:bg-white group-hover:text-black transition-colors">
            <Terminal size={16} />
          </div>
          <div className="flex flex-col text-white">
            <span className="text-lg font-bold tracking-widest leading-none">XIAOBAI</span>
            <span className="text-[10px] tracking-[0.3em] opacity-70">SAMA</span>
          </div>
          {/* 手机端指示器：菜单关闭时显示 Menu 图标，开启时显示 X */}
          <div className="md:hidden ml-2 text-cyan-400">
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </div>
        </div>

        {/* 桌面端导航 */}
        <div className="hidden md:flex gap-12 text-xs font-mono tracking-widest items-center pointer-events-auto">
          <Link to="/" className="hover:text-cyan-400 transition-colors">HOME</Link>
          <div className="relative group h-full">
            <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">MODELS <ChevronDown size={12} /></button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[200px] pt-0">
              <div className="bg-black/90 border border-white/20 backdrop-blur-xl flex flex-col p-1">
                <Link to="/models/black-hole" className="px-4 py-3 text-white/80 hover:text-cyan-300 hover:bg-white/10 transition-colors text-left">// BLACK HOLE</Link>
                <div className="px-4 py-3 text-white/30 cursor-not-allowed text-left">// THREE BODY (WIP)</div>
              </div>
            </div>
          </div>
          <Link to="/lab" className="hover:text-cyan-400 transition-colors">LAB</Link>
          <a href="https://github.com/Xiaobai1100" target="_blank" rel="noreferrer" className="border border-white/30 px-6 py-2 text-[10px] tracking-[0.2em] hover:bg-white hover:text-black transition-all flex items-center gap-2"><Github size={14} /> GITHUB</a>
        </div>

        {/* 移动端全屏下拉菜单面板 */}
        <div className={`
          fixed inset-0 bg-black/95 backdrop-blur-2xl z-[90] transition-all duration-500 ease-in-out flex flex-col items-center justify-center gap-10 pointer-events-auto
          ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}
          md:hidden
        `}>
          <Link to="/" onClick={closeMenu} className="text-3xl font-bold tracking-[0.4em] hover:text-cyan-400 transition-colors">HOME</Link>
          
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)}
              className="text-3xl font-bold tracking-[0.4em] flex items-center gap-3"
            >
              MODELS <ChevronDown size={24} className={`transition-transform duration-300 ${isModelsSubMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModelsSubMenuOpen && (
              <div className="flex flex-col items-center gap-6 mt-4 p-6 bg-white/5 border border-white/10 rounded-xl animate-in fade-in slide-in-from-top-4">
                <Link to="/models/black-hole" onClick={closeMenu} className="text-cyan-400 font-mono text-lg tracking-widest">// BLACK HOLE</Link>
                <span className="text-white/20 font-mono text-lg tracking-widest">// THREE BODY (WIP)</span>
              </div>
            )}
          </div>

          <Link to="/lab" onClick={closeMenu} className="text-3xl font-bold tracking-[0.4em] hover:text-cyan-400 transition-colors">LAB</Link>
          
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-12 h-[1px] bg-white/20"></div>
            <a href="https://github.com/Xiaobai1100" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-white/50 font-mono text-sm tracking-widest hover:text-white transition-colors">
              <Github size={20} /> GITHUB_TERMINAL
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * =================================================================
 * 5. App 根组件 (单文件配置)
 * =================================================================
 */
const App = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models/black-hole" element={<BlackHoleModel />} />
        <Route path="*" element={
          <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center font-mono">
            <h1 className="text-6xl font-bold text-red-500 mb-4 animate-pulse">404</h1>
            <p className="text-white/40 tracking-widest text-sm uppercase">Event Horizon Reached // Signal Lost</p>
            <Link to="/" className="mt-12 border border-white/20 px-8 py-3 hover:bg-white hover:text-black transition-all tracking-widest">RETURN_TO_BASE</Link>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;