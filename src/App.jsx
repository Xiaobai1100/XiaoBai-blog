// 1. 所有的 import 放在最上面
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Github, Terminal, ChevronDown, Menu, X, ArrowRight, Zap } from 'lucide-react';
import AboutBlog from './pages/AboutBlog';
import { POSTS } from './config/posts';

/**
 * =================================================================
 * 1. 核心组件：BlackHoleBackground v2.0 (物理复刻 Gargantua)
 * =================================================================
 */
export const BlackHoleBackground = () => {
  const containerRef = useRef(null);
  const stateRef = useRef({ mass: 1.0, simSpeed: 1.0, gyro: { x: 0, y: 0 } });

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 40, 180); // 调整视角，稍微俯视更能看清环

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const CONFIG = {
      particleCount: 120000,
      rs: 3.0,          // 史瓦西半径
      diskInner: 9.0,   // 吸积盘内径 (3 * rs)
      diskOuter: 100.0,
    };

    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(CONFIG.particleCount * 3);
    const uData = { radii: new Float32Array(CONFIG.particleCount), phases: new Float32Array(CONFIG.particleCount) };

    for (let i = 0; i < CONFIG.particleCount; i++) {
      uData.radii[i] = CONFIG.diskInner + Math.pow(Math.random(), 1.5) * (CONFIG.diskOuter - CONFIG.diskInner);
      uData.phases[i] = Math.random() * Math.PI * 2;
      pos[i*3] = Math.cos(uData.phases[i]) * uData.radii[i];
      pos[i*3+1] = (Math.random() - 0.5) * 0.5; // 吸积盘非常薄
      pos[i*3+2] = Math.sin(uData.phases[i]) * uData.radii[i];
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, rs: { value: CONFIG.rs } },
      vertexShader: `
        uniform float rs;
        varying float vOpacity;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float r = length(position.xz);
            
            // --- 引力透镜核心逻辑 ---
            // b 是光线通过的冲击参数，这里简化模拟
            float b = length(mvPosition.xy); 
            float rsScreen = rs * 10.0; // 屏幕空间的投影半径
            
            // 爱因斯坦环偏转公式简化：越接近 rsScreen，偏移越大
            // 产生环绕黑洞的“二次成像”效果
            if (b > 0.1) {
                float deflection = (2.0 * rsScreen / b) + pow(rsScreen / b, 3.0) * 20.0;
                mvPosition.xy += normalize(mvPosition.xy) * deflection;
            }
            
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = (r < 15.0 ? 2.5 : 1.5) * (800.0 / -mvPosition.z);
            
            // 多普勒效应模拟：左侧亮，右侧暗 (假设逆时针旋转)
            float doppler = dot(normalize(vec3(-position.z, 0.0, position.x)), vec3(1,0,0));
            vOpacity = clamp(0.3 + doppler * 0.5, 0.1, 1.0);
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            // 边缘羽化，模拟热辐射粒子
            gl_FragColor = vec4(1.0, 0.7, 0.3, vOpacity * pow(1.0 - d*2.0, 2.0));
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });

    const system = new THREE.Points(geometry, material);
    scene.add(system);

    // 核心黑体
    const singulairty = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.rs * 2.8, 32, 32), 
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(singulairty);

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const positions = geometry.attributes.position.array;
      for (let i = 0; i < CONFIG.particleCount; i++) {
        // 物理轨道速度：越近越快
        uData.phases[i] += Math.sqrt(200.0 / Math.pow(uData.radii[i], 1.5)) * delta;
        positions[i*3] = Math.cos(uData.phases[i]) * uData.radii[i];
        positions[i*3+2] = Math.sin(uData.phases[i]) * uData.radii[i];
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <div ref={containerRef} className="absolute inset-0 bg-black z-0" />;
};

/**
 * =================================================================
 * 2. 页面组件：Home 首页
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

  // 内部 ArticleCard 组件保持不变
  const ArticleCard = ({ title, category, date }) => (
    <div className="group relative bg-white/5 border border-white/10 p-8 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md pointer-events-auto">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-cyan-500"><Zap size={20} /></div>
      <div className="text-cyan-500/80 text-[10px] font-mono tracking-widest mb-3 uppercase">{category}</div>
      <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-cyan-100 transition-colors uppercase">{title}</h3>
      <div className="text-white/40 text-xs font-mono flex items-center gap-2">
        <span>{date}</span><span className="w-4 h-[1px] bg-white/20" /><span>READ_LOG</span>
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
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      </div>

      <main className={`relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none transition-all duration-300 ${glitchState !== 'stable' ? 'opacity-80' : 'opacity-100'}`}>
        <div className={`flex flex-col items-start pointer-events-auto ${glitchState === 'shaking' ? 'shaking-active' : ''}`}>
          <div className={`mb-8 flex items-center gap-4 font-mono text-[10px] tracking-[0.3em] border-l-2 pl-4 py-1 pr-4 rounded-r uppercase transition-all duration-500
            ${glitchState !== 'stable' ? 'text-red-500 border-red-500 bg-red-500/10' : 'text-cyan-400 border-cyan-500 bg-black/20 backdrop-blur-md'}
          `}>
            {glitchState !== 'stable' ? 'Alert: Pulse_Detected' : 'Status: Singularity_Stable'}
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-95 uppercase">
            Explore<br />The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">Unseen</span>
          </h1>
          
          <div className="max-w-full text-white/90 text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/20 pl-6 backdrop-blur-sm bg-black/20 p-5 rounded-r-lg">
            <p className="mb-2">This is <strong>XiaoBai SAMA</strong>.</p>
            <p className="md:whitespace-nowrap tracking-tight opacity-80">
              It remains that, from the same principles, I now demonstrate the frame of the System of the World. —— Issac Newton
            </p>
          </div>

          <button className="flex items-center gap-2 bg-white text-black px-10 py-4 font-mono font-bold tracking-[0.2em] hover:bg-cyan-300 transition-all group uppercase">
            Start Reading <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
      
      {/* 自动生成的 Logs 区域 */}
      <section className="relative z-10 bg-black/30 backdrop-blur-xl py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold tracking-tighter uppercase opacity-60 mb-16">Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 核心改动：循环遍历 POSTS 数组 */}
            {POSTS.map((post) => (
              <Link 
                key={post.id} 
                to={`/logs/${post.id}`} 
                className="pointer-events-auto block"
              >
                <ArticleCard 
                  title={post.title} 
                  category={post.category} 
                  date={post.date} 
                />
              </Link>
            ))}

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
  <Router>
    <NavBar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/models/black-hole" element={<BlackHoleModel />} />
      
      {POSTS.map(post => (
        <Route key={post.id} path={`/logs/${post.id}`} element={<post.component />} />
      ))}
      
      <Route path="*" element={<div className="h-screen bg-black text-white flex ...">404: Signal_Lost</div>} />
    </Routes>
  </Router>
);
export default App;