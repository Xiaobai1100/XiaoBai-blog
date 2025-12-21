import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Github, Terminal, ChevronDown, Menu, X, ArrowRight, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
// 1. 导入 Lyket
import { Provider, LikeButton } from '@lyket/react';
/**
 * =================================================================
 * 1. 核心组件：1:1 物理复刻版黑洞 (带崩解逻辑)
 * =================================================================
 */
const BlackHoleBackground = () => {
  const containerRef = useRef(null);
  const pulseRef = useRef({ active: false, startTime: 0, phase: 'idle' });
  const gyroRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 60, 220); 

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const CONFIG = { 
      particleCount: 160000, 
      horizonRadius: 9.0, 
      diskInner: 12.0, 
      diskOuter: 140.0,
      spawnZone: 60.0,
      baseSpeed: 0.12,
      infallRate: 15.0,
      massScale: 3.0
    };

    const blackHole = new THREE.Mesh(
      new THREE.SphereGeometry(8.8, 64, 64), 
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    universeGroup.add(blackHole);

    const positions = [], colors = [], sizes = [], alphas = [], phases = [], radii = [], yOffsets = [], speeds = [], targetAlpha = [], infallMod = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const t = Math.random();
        const r = CONFIG.diskInner + (CONFIG.diskOuter - CONFIG.diskInner) * Math.pow(t, 0.8);
        const angle = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * (0.3 + r * 0.02);
        positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r);
        colors.push(1.0, 0.8, 0.5); sizes.push(Math.random() * 0.6 + 0.4); alphas.push(0.0); targetAlpha.push(Math.random() * 0.6 + 0.3); 
        phases.push(angle); radii.push(r); yOffsets.push(y); speeds.push(Math.random() * 0.2 + 0.9); infallMod.push(0.8 + Math.random() * 0.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { massScale: { value: CONFIG.massScale }, lensingStrength: { value: 1.0 } },
        vertexShader: `
            uniform float massScale; uniform float lensingStrength;
            attribute float size; attribute float alpha; attribute vec3 customColor;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vAlpha = alpha; vColor = customColor;
                float rs = massScale * 3.0; float rPhys = length(position.xyz);
                float gShift = sqrt(clamp(1.0 - (rs / (rPhys + 0.1)), 0.0, 1.0));
                vec3 velObj = normalize(vec3(-position.z, 0.0, position.x));
                vec3 velView = normalize(normalMatrix * velObj);
                float beaming = pow(1.0 + 0.5 * dot(velView, normalize(-mvPosition.xyz)), 2.0);
                vColor *= beaming * gShift * 1.5;
                float rScreen = length(mvPosition.xy);
                float rsScreen = massScale * 12.0; 
                float distortion = ((rsScreen * rsScreen) / max(rScreen, 0.1)) * lensingStrength;
                mvPosition.xy += normalize(mvPosition.xy) * distortion;
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * (1200.0 / -mvPosition.z);
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
    universeGroup.add(system);

    const handlePulse = () => { 
      pulseRef.current = { active: true, startTime: clock.getElapsedTime() }; 
    };
    window.addEventListener('singularity-pulse', handlePulse);

    const handleGyro = (e) => {
      if (!e.beta || !e.gamma) return;
      gyroRef.current.x = e.beta * 0.005;
      gyroRef.current.y = e.gamma * 0.005;
    };
    window.addEventListener('deviceorientation', handleGyro);

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        const pulseElapsed = time - pulseRef.current.startTime;

        universeGroup.rotation.x += (gyroRef.current.x - universeGroup.rotation.x) * 0.05;
        universeGroup.rotation.y += (gyroRef.current.y - universeGroup.rotation.y) * 0.05;

        const pos = geometry.attributes.position.array;
        const alp = geometry.attributes.alpha.array;
        
        const isAbnormal = pulseRef.current.active && pulseElapsed < 1.5;
        const disintegrationFactor = isAbnormal ? Math.pow(1.0 - pulseElapsed / 1.5, 2) * 200 : 0;
        const overspeed = isAbnormal ? 8.0 : 1.0; 

        for(let i = 0; i < CONFIG.particleCount; i++) {
            let r = radii[i];
            let phase = phases[i];
            let dilation = r > CONFIG.horizonRadius ? Math.sqrt(1.0 - (CONFIG.horizonRadius / r)) : 0;
            phase += (Math.sqrt(1800.0 / r) * dilation * delta * CONFIG.baseSpeed * speeds[i] * overspeed);
            r -= (CONFIG.infallRate / Math.sqrt(r)) * (dilation * dilation) * delta * infallMod[i] * overspeed;

            if (r < CONFIG.horizonRadius * 1.05) { r = CONFIG.diskOuter + Math.random() * CONFIG.spawnZone; alp[i] = 0.0; }
            if (alp[i] < targetAlpha[i]) alp[i] += delta * 0.3;

            const currentR = r + disintegrationFactor * speeds[i];
            pos[i*3] = Math.cos(phase) * currentR;
            pos[i*3+1] = yOffsets[i] + (Math.sin(phase + time) * 0.3);
            pos[i*3+2] = Math.sin(phase) * currentR;
            radii[i] = r; phases[i] = phase;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.alpha.needsUpdate = true;
        renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('singularity-pulse', handlePulse);
      window.removeEventListener('deviceorientation', handleGyro);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute top-0 left-0 w-full h-full bg-black z-0" />;
};
/**
 * =================================================================
 * 2. 页面组件：Home 首页 (已加入计数器和升级卡片)
 * =================================================================
 */
const Home = () => {
  const [glitchState, setGlitchState] = useState('stable');

  useEffect(() => {
    const onPulse = () => {
      setGlitchState('shaking');
      setTimeout(() => setGlitchState('abnormal'), 500);
      setTimeout(() => setGlitchState('stable'), 1500);
    };
    window.addEventListener('singularity-pulse', onPulse);
    return () => window.removeEventListener('singularity-pulse', onPulse);
  }, []);

  // 升级后的文章卡片，包含点赞功能
  const ArticleCard = ({ id, title, category, date }) => (
    <div className="group relative bg-white/5 border border-white/10 p-8 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-cyan-500"><Zap size={20} /></div>
      <div className="text-cyan-500/80 text-[10px] font-mono tracking-widest mb-3 uppercase">{category}</div>
      <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-cyan-100 transition-colors uppercase">{title}</h3>
      
      <div className="text-white/40 text-xs font-mono flex items-center gap-2 mb-6">
        <span>{date}</span><span className="w-4 h-[1px] bg-white/20" /><span>READ_LOG</span>
      </div>

      {/* 点赞/点踩 按钮区域 */}
      <div className="flex gap-6 border-t border-white/10 pt-4 mt-2 pointer-events-auto">
        <div className="flex items-center gap-2 group/btn">
          <LikeButton
            namespace="blog-posts"
            id={`${id}-like`}
            component={({ handlePress, totalLikes, userLiked }) => (
              <button onClick={handlePress} className={`flex items-center gap-2 font-mono text-[10px] transition-colors ${userLiked ? 'text-cyan-400' : 'text-white/40 hover:text-white'}`}>
                <ThumbsUp size={14} /> {totalLikes}
              </button>
            )}
          />
        </div>
        <div className="flex items-center gap-2 group/btn">
          <LikeButton
            namespace="blog-posts"
            id={`${id}-dislike`}
            type="dislike"
            component={({ handlePress, totalLikes, userLiked }) => (
              <button onClick={handlePress} className={`flex items-center gap-2 font-mono text-[10px] transition-colors ${userLiked ? 'text-red-400' : 'text-white/40 hover:text-white'}`}>
                <ThumbsDown size={14} /> {totalLikes}
              </button>
            )}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden text-white">
      <style>{`
        @keyframes fragment-shake {
          0% { transform: translate(0); clip-path: inset(0 0 0 0); }
          10% { transform: translate(-30px, 2px); clip-path: inset(10% 0 80% 0); filter: hue-rotate(90deg); }
          20% { transform: translate(25px, -2px); clip-path: inset(70% 0 5% 0); }
          30% { transform: translate(-10px, 4px); clip-path: inset(40% 0 40% 0); }
          40% { transform: translate(0); clip-path: inset(0 0 0 0); filter: none; }
          100% { transform: translate(0); }
        }
        .shaking-active { animation: fragment-shake 0.4s cubic-bezier(.25,.46,.45,.94) infinite; }
      `}</style>

      <div className={`fixed inset-0 z-0 ${glitchState === 'shaking' ? 'shaking-active' : ''}`}>
        <BlackHoleBackground />
      </div>

      <main className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none">
        <div className="flex flex-col items-start pointer-events-auto">
          {/* ... 保持原有 Hero 标题内容 ... */}
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-95 uppercase">
            Explore<br />The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">Unseen</span>
          </h1>
          <button className="flex items-center gap-2 bg-white text-black px-10 py-4 font-mono font-bold tracking-[0.2em] hover:bg-cyan-300 transition-all group uppercase">
            Start Reading <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
      
      <section className="relative z-10 bg-black/30 backdrop-blur-xl py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl font-bold tracking-tighter uppercase opacity-60">Transmission_Logs</h2>
            
            {/* 访问计数器 UI */}
            <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-500/60 text-right uppercase">
              <span id="busuanzi_container_site_uv" style={{display: 'none'}}>
                Unique_Visitors: <span id="busuanzi_value_site_uv">0</span>
              </span>
              <br />
              <span id="busuanzi_container_site_pv" style={{display: 'none'}}>
                Data_Flow: <span id="busuanzi_value_site_pv">0</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ArticleCard id="article-1" title="The visualization of black hole" category="Simulation" date="DEC 20" />
            <ArticleCard id="article-2" title="About this blog" category="WebGL" date="DEC 20" />
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
const BlackHoleModel = () => (
  <div className="relative w-full h-screen bg-black overflow-hidden pt-20 md:pt-0">
    <iframe src="/blackhole.html" title="Black Hole Simulation" className="w-full h-full border-0 block" />
  </div>
);

/**
 * =================================================================
 * 4. 全局导航栏组件 (NavBar)
 * =================================================================
 */
const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModelsSubMenuOpen, setIsModelsSubMenuOpen] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const location = useLocation();

  useEffect(() => setIsMenuOpen(false), [location]);

  const triggerPulse = () => {
    setIsGlowing(true);
    window.dispatchEvent(new CustomEvent('singularity-pulse'));
    setTimeout(() => setIsGlowing(false), 1200);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full p-8 z-[100] text-white mix-blend-difference pointer-events-none">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4 cursor-pointer group pointer-events-auto select-none">
            <div 
              onClick={triggerPulse}
              className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 
                ${isGlowing ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_50px_#22d3ee] scale-110' : 'border-white group-hover:bg-white group-hover:text-black'}
              `}
            >
              <Terminal size={20} className={isGlowing ? 'text-black' : ''} />
            </div>
            
            {/* 针对手机端微调标题尺寸 */}
            <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex flex-col">
              <span className="text-lg md:text-xl font-bold tracking-widest leading-none uppercase">XiaoBai</span>
              <span className="text-[9px] md:text-[11px] tracking-[0.3em] opacity-60">SAMA</span>
            </div>
            
            <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden ml-2 text-cyan-400">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </div>

          <div className="hidden md:flex gap-12 text-sm font-mono tracking-widest items-center pointer-events-auto uppercase font-bold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <div className="relative group h-full">
              <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">Models <ChevronDown size={14} /></button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[200px] pt-0">
                <div className="bg-black/95 border border-white/10 backdrop-blur-xl flex flex-col p-1 shadow-2xl">
                  <Link to="/models/black-hole" className="px-4 py-4 text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all text-left">// Black_Hole</Link>
                </div>
              </div>
            </div>
            <Link to="/lab" className="hover:text-cyan-400 transition-colors">Lab</Link>
            <a href="https://github.com/Xiaobai1100" target="_blank" rel="noreferrer" className="border border-white/20 px-6 py-2.5 hover:bg-white hover:text-black transition-all flex items-center gap-2">
              <Github size={15} /> Github
            </a>
          </div>
        </div>
      </nav>

      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className={`absolute top-0 left-0 w-[85%] max-w-[320px] h-full bg-black/80 backdrop-blur-2xl border-r border-white/10 transition-transform duration-500 ease-out flex flex-col p-12 pt-32 gap-10 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[10px] tracking-[0.5em] text-white/40 uppercase mb-4 border-b border-white/10 pb-4 font-mono">Control_Center</div>
          <Link to="/" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Home</Link>
          <div className="flex flex-col gap-6">
            <button onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)} className="text-xl font-bold tracking-[0.3em] flex items-center gap-3 text-white uppercase text-left">
              Models <ChevronDown size={18} className={isModelsSubMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isModelsSubMenuOpen && (
              <div className="flex flex-col gap-6 pl-5 border-l border-cyan-500/40 py-2">
                <Link to="/models/black-hole" className="text-base font-mono tracking-widest text-cyan-400 uppercase">// Black_Hole</Link>
              </div>
            )}
          </div>
          <Link to="/lab" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Lab</Link>
        </div>
      </div>
    </>
  );
};
const App = () => (
  // 2. 用 Provider 包裹整个应用，apiKey 可以去 lyket.io 申请免费的，
  // 或者先用这个测试 ID (pt_6476b7e67175908e018659550b3341)
  <Provider apiKey="pt_6476b7e67175908e018659550b3341">
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/models/black-hole" element={<BlackHoleModel />} />
        <Route path="*" element={<div className="h-screen bg-black text-white flex items-center justify-center font-mono uppercase tracking-widest">404: Signal_Lost</div>} />
      </Routes>
    </Router>
  </Provider>
);

export default App;