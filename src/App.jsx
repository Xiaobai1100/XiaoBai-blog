import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { Github, Terminal, ChevronDown, Menu, X, ArrowRight, Zap, Activity } from 'lucide-react';

/**
 * =================================================================
 * 1. 核心组件：时空曲率黑洞背景 (Warped Spacetime Grid)
 * =================================================================
 */
const BlackHoleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    // 稍微抬高并倾斜相机，以观察被压弯的空间
    camera.position.set(0, 80, 220); 
    camera.lookAt(0, -20, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance", alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const CONFIG = { 
      particleCount: 160000, 
      massScale: 3.0,
      horizonRadius: 9.0, 
      diskInner: 12.0, 
      diskOuter: 140.0,
      gridSegments: 60,
      gridRadius: 200,
      baseSpeed: 0.25 
    };

    // --- A. 黑洞中心 ---
    const blackHole = new THREE.Mesh(
      new THREE.SphereGeometry(8.5, 64, 64), 
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    scene.add(blackHole);

    // --- B. 时空曲率网格 (Spacetime Grid) ---
    // 创建一个径向网格，模拟被球体压弯的空间平面
    const gridGeom = new THREE.BufferGeometry();
    const gridIndices = [];
    const gridPositions = [];
    const gridColors = [];

    const segs = CONFIG.gridSegments;
    const rings = 40;
    for (let r = 0; r <= rings; r++) {
      for (let s = 0; s < segs; s++) {
        const radius = (r / rings) * CONFIG.gridRadius;
        const angle = (s / segs) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // 引力压弯公式：越靠近中心，Y轴下陷越深 (1/r 衰减)
        const depth = radius < CONFIG.horizonRadius ? -40 : -800 / (radius + 10);
        gridPositions.push(x, depth, z);
        
        // 颜色根据深度变化
        const c = new THREE.Color(0x00ffff);
        const intensity = Math.max(0.1, 1.0 - radius / CONFIG.gridRadius);
        gridColors.push(c.r * intensity, c.g * intensity, c.b * intensity);
      }
    }

    // 连线逻辑
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segs; s++) {
        const curr = r * segs + s;
        const next = r * segs + (s + 1) % segs;
        const up = (r + 1) * segs + s;
        gridIndices.push(curr, next, curr, up);
      }
    }

    gridGeom.setIndex(gridIndices);
    gridGeom.setAttribute('position', new THREE.Float32BufferAttribute(gridPositions, 3));
    gridGeom.setAttribute('color', new THREE.Float32BufferAttribute(gridColors, 3));
    
    const gridMaterial = new THREE.LineBasicMaterial({ 
      vertexColors: true, 
      transparent: true, 
      opacity: 0.2, 
      blending: THREE.AdditiveBlending 
    });
    const spacetimeGrid = new THREE.LineSegments(gridGeom, gridMaterial);
    scene.add(spacetimeGrid);

    // --- C. 粒子吸积盘 (修正丝滑感) ---
    const positions = [], colors = [], sizes = [], alphas = [], phases = [], radii = [], yOffsets = [], speeds = [], targetAlpha = [];
    
    for (let i = 0; i < CONFIG.particleCount; i++) {
        const t = Math.random();
        // 极致随机化径向分布，消除“波浪感”
        const r = CONFIG.diskInner + (CONFIG.diskOuter - CONFIG.diskInner) * Math.pow(t, 0.7);
        const angle = Math.random() * Math.PI * 2;
        
        // 粒子也跟随曲率下陷
        const depth = -800 / (r + 10);
        const ySpread = (Math.random() - 0.5) * (0.2 + r * 0.03);

        positions.push(Math.cos(angle) * r, depth + ySpread, Math.sin(angle) * r);
        colors.push(1.0, 0.8, 0.5); 
        sizes.push(Math.random() * 0.5 + 0.3); 
        alphas.push(0.0); 
        targetAlpha.push(Math.random() * 0.5 + 0.2); 
        phases.push(angle); 
        radii.push(r);
        yOffsets.push(depth + ySpread); 
        speeds.push(Math.random() * 0.4 + 0.8); 
    }

    const partGeom = new THREE.BufferGeometry();
    partGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    partGeom.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    partGeom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    partGeom.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const partMat = new THREE.ShaderMaterial({
        uniforms: { massScale: { value: 3.0 }, lensingStrength: { value: 1.2 } },
        vertexShader: `
            uniform float massScale; uniform float lensingStrength;
            attribute float size; attribute float alpha; attribute vec3 customColor;
            varying vec3 vColor; varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vAlpha = alpha; vColor = customColor;
                
                // Doppler & Redshift
                vec3 velObj = normalize(vec3(-position.z, 0.0, position.x));
                vec3 velView = normalize(normalMatrix * velObj);
                float beaming = pow(1.0 + 0.5 * dot(velView, normalize(-mvPosition.xyz)), 2.0);
                vColor *= beaming * 1.5;

                // Lensing (光线追踪扭曲)
                float r = length(mvPosition.xy);
                float distortion = (1500.0 / max(r, 0.1)) * lensingStrength;
                mvPosition.xy += normalize(mvPosition.xy) * distortion;

                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * (1200.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor; varying float vAlpha;
            void main() {
                if (length(gl_PointCoord - 0.5) > 0.5) discard;
                gl_FragColor = vec4(vColor, vAlpha * pow(1.0 - length(gl_PointCoord-0.5)*2.0, 2.0));
            }
        `,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    });
    
    const system = new THREE.Points(partGeom, partMat);
    scene.add(system);

    // --- 动画循环 ---
    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 旋转曲率网格
        spacetimeGrid.rotation.y += delta * 0.05;

        const pos = partGeom.attributes.position.array;
        const alp = partGeom.attributes.alpha.array;
        
        for(let i = 0; i < CONFIG.particleCount; i++) {
            let r = radii[i];
            let phase = phases[i];
            
            // 物理轨道：越近越快
            let v = Math.sqrt(1800.0 / r);
            phase += v * delta * CONFIG.baseSpeed * speeds[i];
            
            // 极慢的径向漂移，消除“一波波吸入”的断层感
            r -= (8.0 / (r + 5.0)) * delta * speeds[i];

            if (r < CONFIG.horizonRadius * 1.1) {
                r = CONFIG.diskOuter;
                alp[i] = 0.0;
            }

            if (alp[i] < targetAlpha[i]) alp[i] += delta * 0.2;

            // 更新位置：结合曲率公式
            const depth = -800 / (r + 10);
            pos[i*3] = Math.cos(phase) * r;
            pos[i*3+1] = depth + (Math.sin(phase + time) * 0.5); // Y轴带微小波动
            pos[i*3+2] = Math.sin(phase) * r;
            
            radii[i] = r;
            phases[i] = phase;
        }
        partGeom.attributes.position.needsUpdate = true;
        partGeom.attributes.alpha.needsUpdate = true;
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
 * 2. 页面组件：Home 首页 (修正语录与布局)
 * =================================================================
 */
const Home = () => {
  const ArticleCard = ({ title, category, date }) => (
    <div className="group relative bg-black/30 border border-white/10 p-8 hover:border-cyan-500/50 hover:bg-black/50 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md">
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
      <div className="fixed inset-0 z-0">
        <BlackHoleBackground />
        {/* 精细化噪点，提升电影感 */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
      </div>

      <main className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none">
        <div className="flex flex-col items-start pointer-events-auto">
          <div className="mb-8 flex items-center gap-4 text-cyan-400 font-mono text-[10px] tracking-[0.3em] border-l-2 border-cyan-500 pl-4 bg-black/20 backdrop-blur-md py-1 pr-4 rounded-r uppercase">
            Status: Spacetime_Curvature_Active
          </div>
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-95 uppercase">
            Visualize<br />The <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">Unseen</span>
          </h1>
          
          <div className="max-w-full text-white/90 text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/20 pl-6 backdrop-blur-sm bg-black/20 p-5 rounded-r-lg">
            <p className="mb-2">This is <strong>XiaoBai SAMA</strong>.</p>
            <p className="md:whitespace-nowrap tracking-tight opacity-80">
              It remains that, from the same principles, I now demonstrate the frame of the System of the World. —— Issac Newton
            </p>
          </div>

          <button className="flex items-center gap-2 bg-white text-black px-10 py-4 font-mono font-bold tracking-[0.2em] hover:bg-cyan-300 transition-all hover:scale-105 group">
            START READING <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>
      
      <section className="relative z-10 bg-black/60 backdrop-blur-2xl py-32 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <h2 className="text-4xl font-bold tracking-tighter uppercase opacity-80">Transmission_Logs</h2>
            <div className="text-xs font-mono text-cyan-500 mb-2 tracking-widest">2025 // PROTOCOL_01</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ArticleCard title="模拟卡冈图雅：引力透镜实战" category="Physics" date="DEC 20" />
            <ArticleCard title="三体运动：混沌系统与JS算力" category="Simulation" date="DEC 15" />
            <ArticleCard title="Shader 魔法：手写时空网格" category="WebGL" date="NOV 28" />
          </div>
        </div>
      </section>
    </div>
  );
};

/**
 * =================================================================
 * 3. 页面组件：BlackHoleModel (iframe 保持原生)
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
  const location = useLocation();

  useEffect(() => setIsMenuOpen(false), [location]);

  return (
    <>
      <nav className="fixed top-0 left-0 w-full p-8 z-[100] text-white mix-blend-difference pointer-events-none">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }} className="flex items-center gap-3 cursor-pointer group pointer-events-auto select-none">
            <div className="w-9 h-9 flex items-center justify-center border border-white group-hover:bg-white group-hover:text-black transition-all">
              <Terminal size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-widest leading-none uppercase">XiaoBai</span>
              <span className="text-[11px] tracking-[0.3em] opacity-60">SAMA</span>
            </div>
            <div className="md:hidden ml-2 text-cyan-400">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </div>
          </div>

          <div className="hidden md:flex gap-10 text-sm font-mono tracking-widest items-center pointer-events-auto uppercase font-bold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <div className="relative group h-full">
              <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">Models <ChevronDown size={14} /></button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[200px] pt-0">
                <div className="bg-black/95 border border-white/10 backdrop-blur-xl flex flex-col p-1 shadow-2xl">
                  <Link to="/models/black-hole" className="px-4 py-4 text-white/70 hover:text-cyan-400 hover:bg-white/5 transition-all text-left">// Black_Hole</Link>
                  <div className="px-4 py-4 text-white/10 cursor-not-allowed text-left">// Three_Body</div>
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

      {/* 移动端侧边抽屉 */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className={`absolute top-0 left-0 w-[85%] max-w-[320px] h-full bg-black/80 backdrop-blur-2xl border-r border-white/10 transition-transform duration-500 ease-out flex flex-col p-12 pt-32 gap-10 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[10px] tracking-[0.5em] text-white/40 uppercase mb-4 border-b border-white/10 pb-4 font-mono">Terminal_Control</div>
          <Link to="/" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Home</Link>
          <div className="flex flex-col gap-6">
            <button onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)} className="text-xl font-bold tracking-[0.3em] flex items-center gap-3 text-white uppercase">
              Models <ChevronDown size={18} className={isModelsSubMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isModelsSubMenuOpen && (
              <div className="flex flex-col gap-6 pl-5 border-l border-cyan-500/40 py-2">
                <Link to="/models/black-hole" className="text-base font-mono tracking-widest text-cyan-400 uppercase">// Black_Hole</Link>
              </div>
            )}
          </div>
          <Link to="/lab" className="text-xl font-bold tracking-[0.3em] text-white hover:text-cyan-400 uppercase">Lab</Link>
          <div className="mt-auto pt-10 border-t border-white/10 opacity-50 flex items-center gap-4">
             <Github size={20} /> <span className="text-[10px] font-mono tracking-[0.2em] uppercase">Auth_Secure</span>
          </div>
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
      <Route path="*" element={<div className="h-screen bg-black text-white flex items-center justify-center font-mono uppercase tracking-widest">404: Orbit_Lost</div>} />
    </Routes>
  </Router>
);

export default App;