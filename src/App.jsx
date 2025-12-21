import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import * as THREE from "three";
import { 
  Github, 
  Terminal, 
  ChevronDown, 
  Menu, 
  X, 
  ArrowRight, 
  Zap, 
  AlertTriangle 
} from 'lucide-react';

// 导入你的页面组件
import AboutBlog from './pages/AboutBlog';
import { POSTS } from './config/posts';

// 后面直接开始写 export const BlackHoleBackground = ...

/**
 * =================================================================
 * 核心组件：BlackHoleBackground v4.0 (自适应 + 陀螺仪 + 增强视觉)
 * =================================================================
 */
export const BlackHoleBackground = () => {
  const containerRef = useRef(null);
  const pulseState = useRef({ factor: 0.0, active: false });
  const gyroRef = useRef({ x: 0, y: 0 }); // 用于存储陀螺仪实时偏移

  useEffect(() => {
    if (!containerRef.current) return;

    // --- 陀螺仪监听 (默认直接开启) ---
    const handleOrientation = (e) => {
      // beta: 俯仰角 (-180 to 180), gamma: 翻滚角 (-90 to 90)
      const x = (e.beta || 0) / 90; 
      const y = (e.gamma || 0) / 90;
      gyroRef.current = { x: x * 0.4, y: y * 0.4 };
    };
    window.addEventListener('deviceorientation', handleOrientation);

    // --- 初始化 Three.js 环境 ---
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const scene = new THREE.Scene();
    
    // 动态计算初始分布半径
    const getAdaptiveRadius = () => {
      const width = window.innerWidth;
      return Math.max(300, width / 3.5); 
    };

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 4000);
    // 手机端视角略微拉远，获得更好的全景感
    camera.position.set(0, isMobile ? 70 : 50, 250);

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    // 手机端限制像素比以保帧率，PC端全开
    renderer.setPixelRatio(isMobile ? 1.5 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const CONFIG = {
      particleCount: 140000, 
      rs: 3.5, 
      baseSpeed: 0.8,
      diskInner: 15.0,
      diskOuter: getAdaptiveRadius(), 
    };

    // 奇异点（核心黑球）
    const blackHole = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.rs * 2.6, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(blackHole);

    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(CONFIG.particleCount * 3);
    const alphas = new Float32Array(CONFIG.particleCount);
    const uData = { 
      radii: new Float32Array(CONFIG.particleCount), 
      phases: new Float32Array(CONFIG.particleCount),
      yOffsets: new Float32Array(CONFIG.particleCount),
      randomSpeeds: new Float32Array(CONFIG.particleCount) 
    };

    for (let i = 0; i < CONFIG.particleCount; i++) {
      uData.radii[i] = CONFIG.diskInner + Math.pow(Math.random(), 1.5) * CONFIG.diskOuter;
      uData.phases[i] = Math.random() * Math.PI * 2;
      uData.yOffsets[i] = (Math.random() - 0.5) * (uData.radii[i] * (isMobile ? 0.04 : 0.03));
      uData.randomSpeeds[i] = 0.8 + Math.random() * 0.4;
      alphas[i] = Math.random() * 0.5 + 0.1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

	const material = new THREE.ShaderMaterial({
	  uniforms: { 
		rs: { value: CONFIG.rs },
		explosion: { value: 0.0 },
		glowBoost: { value: isMobile ? 0.8 : (window.devicePixelRatio > 1 ? 2.2 : 1.5) } 
	  },
	  vertexShader: `
		uniform float rs;
		uniform float explosion;
		uniform float glowBoost;
		attribute float alpha;
		varying float vAlpha;
		varying vec3 vColor;
		void main() {
		  vec3 p = position;
		  if (explosion > 0.0) {
			p.xyz += normalize(p.xyz) * explosion * 220.0;
		  }
		  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
		  float b = length(mvPosition.xy); 
		  float rsScreen = rs * 12.0; 
		  
		  if (b > 0.1) {
			float deflection = (3.5 * rsScreen / b) + pow(rsScreen / b, 4.0) * 20.0;
			mvPosition.xy += normalize(mvPosition.xy) * deflection;
		  }
		  
		  gl_Position = projectionMatrix * mvPosition;
		  
		  float r = length(position.xz);
		  float baseSize = (0.5 + 2.5 / r) * glowBoost;
		  gl_PointSize = baseSize * (1000.0 / -mvPosition.z);
		  
		  vAlpha = alpha * (1.2 - explosion * 0.7); 
		  vColor = mix(vec3(1.0, 0.5, 0.1), vec3(1.0, 0.95, 0.8), pow(10.0/r, 0.7));
		}
	  `,
	  fragmentShader: `
		varying float vAlpha;
		varying vec3 vColor;
		void main() {
		  float d = length(gl_PointCoord - 0.5);
		  if (d > 0.5) discard;
		  float radial = pow(1.0 - d * 2.0, 1.5);
		  float core = pow(1.0 - d * 2.0, 10.0) * 2.0;
		  gl_FragColor = vec4(vColor, vAlpha * (radial + core));
		}
	  `,
	  blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
	});

    const system = new THREE.Points(geometry, material);
    scene.add(system);

    // --- 窗口自适应逻辑 ---
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const newOuter = getAdaptiveRadius();
      const scaleFactor = newOuter / CONFIG.diskOuter;
      system.scale.set(scaleFactor, 1, scaleFactor);
    };
    window.addEventListener('resize', onWindowResize);

    const handlePulse = () => { pulseState.current.active = true; };
    window.addEventListener('singularity-pulse', handlePulse);

    const clock = new THREE.Clock();
    let frameId;
    let holdTimer = 0; 
    let isHolding = false;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const positions = geometry.attributes.position.array;
      
      // --- 陀螺仪平滑偏移应用 ---
      scene.rotation.x += (gyroRef.current.x - scene.rotation.x) * 0.05;
      scene.rotation.y += (gyroRef.current.y - scene.rotation.y) * 0.05;

      // --- 彩蛋状态机 ---
      if (pulseState.current.active) {
        pulseState.current.factor += (1.0 - pulseState.current.factor) * 0.15;
        if (pulseState.current.factor > 0.96) {
          pulseState.current.factor = 1.0;
          pulseState.current.active = false;
          isHolding = true;
          holdTimer = 0;
        }
      } else if (isHolding) {
        holdTimer += delta;
        if (holdTimer >= 1.0) isHolding = false;
      } else {
        pulseState.current.factor *= 0.88;
      }
      material.uniforms.explosion.value = pulseState.current.factor;

      for (let i = 0; i < CONFIG.particleCount; i++) {
        const i3 = i * 3;
        const speedFactor = CONFIG.baseSpeed * (1.0 - Math.pow(pulseState.current.factor, 0.5) * 0.9);
        uData.phases[i] += Math.sqrt(400.0 / Math.pow(uData.radii[i], 1.5)) * speedFactor * delta * uData.randomSpeeds[i];
        
        positions[i3] = Math.cos(uData.phases[i]) * uData.radii[i];
        positions[i3+1] = uData.yOffsets[i];
        positions[i3+2] = Math.sin(uData.phases[i]) * uData.radii[i];
      }
      
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('singularity-pulse', handlePulse);
      window.removeEventListener('deviceorientation', handleOrientation);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 bg-black z-0 touch-none pointer-events-none" />;
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

  // 路由变化时自动关闭移动端菜单
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
          
          {/* 左侧区域：Logo + 标题 */}
          <div className="flex items-center gap-4 pointer-events-auto select-none">
            {/* 1. Terminal 图标彩蛋 */}
            <div 
              onClick={triggerPulse}
              className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer
                ${isGlowing ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_50px_#22d3ee] scale-110' : 'border-white hover:bg-white hover:text-black'}
              `}
            >
              <Terminal size={20} className={isGlowing ? 'text-black' : ''} />
            </div>
            
            {/* 2. 点击返回首页的标题 */}
            <Link 
              to="/" 
              className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity active:scale-95"
            >
              <span className="text-lg md:text-xl font-bold tracking-widest leading-none uppercase">XiaoBai</span>
              <span className="text-[9px] md:text-[11px] tracking-[0.3em] opacity-60">SAMA</span>
            </Link>
            
            {/* 移动端菜单开关 */}
            <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden ml-2 text-cyan-400 cursor-pointer pointer-events-auto">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </div>

          {/* 右侧区域：桌面端功能菜单 (恢复所有功能) */}
          <div className="hidden md:flex gap-12 text-sm font-mono tracking-widest items-center pointer-events-auto uppercase font-bold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            
            {/* Models 下拉菜单 */}
            <div className="relative group h-full">
              <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">
                Models <ChevronDown size={14} />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[200px] pt-0">
                <div className="bg-black/95 border border-white/10 backdrop-blur-xl flex flex-col p-1 shadow-2xl">
                  <Link to="/models/black-hole" className="px-4 py-4 text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all text-left">
                    // Black_Hole
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/lab" className="hover:text-cyan-400 transition-colors">Lab</Link>
            
            {/* 恢复 GitHub 真实链接 */}
            <a 
              href="https://github.com/Xiaobai1100" 
              target="_blank" 
              rel="noreferrer" 
              className="border border-white/20 px-6 py-2.5 hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <Github size={15} /> Github
            </a>
          </div>
        </div>
      </nav>

      {/* 移动端抽屉菜单 (恢复所有功能) */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className={`absolute top-0 left-0 w-[85%] max-w-[320px] h-full bg-black/80 backdrop-blur-2xl border-r border-white/10 transition-transform duration-500 ease-out flex flex-col p-12 pt-32 gap-10 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[10px] tracking-[0.5em] text-white/40 uppercase mb-4 border-b border-white/10 pb-4 font-mono">Control_Center</div>
          
          <Link to="/" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Home</Link>
          
          <div className="flex flex-col gap-6">
            <button 
              onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)} 
              className="text-xl font-bold tracking-[0.3em] flex items-center gap-3 text-white uppercase text-left"
            >
              Models <ChevronDown size={18} className={isModelsSubMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isModelsSubMenuOpen && (
              <div className="flex flex-col gap-6 pl-5 border-l border-cyan-500/40 py-2">
                <Link to="/models/black-hole" className="text-base font-mono tracking-widest text-cyan-400 uppercase">// Black_Hole</Link>
              </div>
            )}
          </div>
          
          <Link to="/lab" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Lab</Link>
          <a href="https://github.com/Xiaobai1100" target="_blank" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Github</a>
        </div>
      </div>
    </>
  );
};

/**
 * =================================================================
 * 5. 页面组件：404 Signal_Lost (时空崩溃界面)
 * =================================================================
 */

/**
 * =================================================================
 * 5. 页面组件：404 Signal_Lost (手机端自适应版)
 * =================================================================
 */
const NotFound = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center text-white font-mono">
      
      {/* 1. 背景层：黑白去色 + 手机端模糊度微调 */}
      <div className="absolute inset-0 z-0 opacity-40 grayscale-[100%] contrast-[150%] brightness-[70%] blur-[3px]">
        {/* scale-150: 在手机窄屏上放大黑洞，确保吸积盘横向铺满 */}
        <div className="w-full h-full transform -translate-y-[5%] scale-[1.8] md:scale-125">
          <BlackHoleBackground />
        </div>
      </div>

      {/* 2. 干扰层：针对手机端降低噪点强度，防止屏幕显得脏 */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] md:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      
      {/* 扫描线：手机端间距调细 */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_3px] md:bg-[length:100%_4px]"></div>

      {/* 3. 核心内容容器 */}
      <div className="relative z-20 text-center px-8 w-full max-w-lg">
        {/* 错误标签 */}
        <div className="inline-block border border-white/20 bg-white/5 px-3 py-1 mb-6 md:mb-10 rounded-sm">
          <span className="text-white/40 text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] uppercase">
            Signal_Interrupted // 404
          </span>
        </div>
        
        {/* 响应式标题：手机端 4xl, 电脑端 8xl */}
        <h1 className="text-4xl md:text-8xl font-light mb-6 md:mb-8 tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/90 leading-none">
          Void <span className="opacity-20 block md:inline mt-2 md:mt-0">Space</span>
        </h1>
        
        {/* 响应式描述：调小字号防止折行难看 */}
        <div className="space-y-2 md:space-y-3 font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/30 mb-10 md:mb-12">
          <p className="truncate">Target: Beyond_Observation</p>
          <p>Sync_Status: Null_Response</p>
        </div>

        {/* 响应式按钮：手机端缩减高度 */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-3 border border-white/20 px-8 md:px-10 py-3 md:py-4 text-white/80 text-xs md:text-sm font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all uppercase active:scale-95"
        >
          Reset_Connection <ArrowRight size={16} />
        </Link>
      </div>

      {/* 4. 底部状态栏：在小屏幕上隐藏部分信息或调小字号 */}
      <div className="absolute bottom-6 md:bottom-8 w-full flex justify-between px-6 md:px-10 text-[7px] md:text-[8px] tracking-[0.3em] md:tracking-[0.5em] text-white/10 uppercase font-bold">
        <span>Sector: ERR_UNKN</span>
        <span>Reality_Sync: FAIL</span>
      </div>
    </div>
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
      // App.jsx 底部
      <Route path="*" element={<NotFound />} />
	</Routes>
  </Router>
);
export default App;