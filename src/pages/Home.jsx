import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowRight, Activity, Zap } from 'lucide-react';

/**
 * 核心背景：V25 Supermassive Black Hole (移植到 Home 页)
 */
const BlackHoleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 60, 200); 

    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      powerPreference: "high-performance",
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const container = containerRef.current;
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);

    // V25 物理参数
    const CONFIG = {
        particleCount: 180000, 
        horizonRadius: 9.0,     
        diskInner: 12.0,        
        diskOuterBase: 120.0,   
        spawnZoneBase: 50.0,    
        baseSpeed: 0.3,         
        infallRate: 60.0        
    };

    const blackHoleGeo = new THREE.SphereGeometry(8.5, 64, 64);
    const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blackHole = new THREE.Mesh(blackHoleGeo, blackHoleMat);
    scene.add(blackHole);

    const positions = [];
    const colors = [];
    const sizes = [];
    const alphas = [];
    const phases = [];
    const radii = [];
    const yOffsets = [];
    const speeds = [];
    const originalY = [];
    const targetAlpha = [];
    const infallMod = [];

    for (let i = 0; i < CONFIG.particleCount; i++) {
        const t = Math.random();
        const bias = Math.pow(t, 0.8);
        const maxInitRadius = CONFIG.diskOuterBase + CONFIG.spawnZoneBase;
        const r = CONFIG.diskInner + (maxInitRadius - CONFIG.diskInner) * bias;
        const angle = Math.random() * Math.PI * 2;
        let thickness = 0.3 + (r * 0.02);
        const spread = (Math.random() - 0.5) * thickness;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = spread;
        positions.push(x, y, z);
        colors.push(1.0, 0.85, 0.6); 
        sizes.push(Math.random() * 0.5 + 0.5);
        alphas.push(0.0);
        targetAlpha.push(Math.random() * 0.6 + 0.4);
        phases.push(angle);
        radii.push(r);
        yOffsets.push(y);
        originalY.push(y);
        speeds.push(Math.random() * 0.2 + 0.9);
        infallMod.push(0.8 + Math.random() * 0.4);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.Float32BufferAttribute(alphas, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { massScale: { value: 3.0 }, lensingStrength: { value: 1.0 } },
        vertexShader: `
            uniform float massScale;
            uniform float lensingStrength;
            attribute float size;
            attribute float alpha;
            attribute vec3 customColor;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vec3 velObj = normalize(vec3(-position.z, 0.0, position.x));
                vec3 velView = normalize(normalMatrix * velObj);
                vec3 viewDir = normalize(-mvPosition.xyz);
                float doppler = dot(velView, viewDir);
                float beaming = pow(1.0 + 0.6 * doppler, 2.0); 
                float rsPhys = massScale * 3.0; 
                float rPhys = length(position.xyz);
                float gShift = sqrt(clamp(1.0 - (rsPhys / (rPhys + 0.1)), 0.0, 1.0));
                vec3 redshiftedColor = customColor;
                redshiftedColor.g *= smoothstep(0.0, 0.4, gShift);
                redshiftedColor.b *= smoothstep(0.0, 0.4, gShift);
                vec3 finalColor = redshiftedColor * beaming * gShift * 1.5; 
                vColor = finalColor;
                vAlpha = alpha;
                float r = length(mvPosition.xy);
                float rs = massScale * 12.0; 
                float rsSq = rs * rs;
                float rClamped = max(r, 0.1);
                float distortionFactor = (rsSq / rClamped) * lensingStrength;
                vec2 offset = normalize(mvPosition.xy) * distortionFactor;
                mvPosition.xy += offset;
                gl_Position = projectionMatrix * mvPosition;
                gl_PointSize = size * (1300.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
                vec2 center = gl_PointCoord - 0.5;
                float dist = length(center);
                if (dist > 0.5) discard;
                float strength = 1.0 - (dist * 2.0);
                strength = pow(strength, 2.0); 
                gl_FragColor = vec4(vColor, vAlpha * strength);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
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
        const G = 500.0 * 3.0; 
        let simDelta = delta * CONFIG.baseSpeed;

        for(let i=0; i<CONFIG.particleCount; i++) {
            let r = radii[i];
            let phase = phases[i];
            let dilation = 1.0;
            if (r > CONFIG.horizonRadius) {
                dilation = Math.sqrt(1.0 - (CONFIG.horizonRadius / r));
            } else {
                dilation = 0.0;
            }
            let vOrbital = Math.sqrt(G / r);
            phase += (vOrbital * dilation * simDelta * 0.2 * speeds[i]);
            let plungeRegion = CONFIG.horizonRadius * 3.0;
            let infallBase = CONFIG.infallRate / Math.sqrt(r);
            if (r < plungeRegion) {
                let plungeFactor = 1.0 + 2.0 * (1.0 - (r - CONFIG.horizonRadius) / (plungeRegion - CONFIG.horizonRadius));
                infallBase *= plungeFactor;
            }
            let infall = infallBase * (dilation * dilation) * simDelta * infallMod[i];
            r -= infall;
            if (r < CONFIG.horizonRadius * 1.01) {
                r = CONFIG.diskOuterBase + Math.random() * CONFIG.spawnZoneBase;
                alp[i] = 0.0;
                yOffsets[i] = (Math.random() - 0.5) * (0.3 + r * 0.02);
                originalY[i] = yOffsets[i];
            }
            yOffsets[i] += (originalY[i] - yOffsets[i]) * 0.05;
            if (r > CONFIG.diskOuterBase) {
                let opacity = 1.0 - ((r - CONFIG.diskOuterBase) / CONFIG.spawnZoneBase);
                opacity = Math.max(0, opacity);
                if (alp[i] < opacity) alp[i] += delta * 0.5;
                if (alp[i] > opacity) alp[i] = opacity;
            } else {
                if (alp[i] < targetAlpha[i]) alp[i] += delta * 0.5;
            }
            const x = Math.cos(phase) * r;
            const z = Math.sin(phase) * r;
            const y = yOffsets[i];
            const i3 = i * 3;
            pos[i3] = x;
            pos[i3+1] = y;
            pos[i3+2] = z;
            radii[i] = r;
            phases[i] = phase;
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
        if (container) container.innerHTML = '';
        geometry.dispose();
        material.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute top-0 left-0 w-full h-full bg-black z-0" />;
};

// 辅助组件：文章卡片
const ArticleCard = ({ title, category, date }) => (
  <div className="group relative bg-black/20 border border-white/10 p-8 hover:border-cyan-500/50 hover:bg-black/40 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm">
    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-cyan-500">
      <Zap size={20} />
    </div>
    <div className="text-cyan-500/80 text-[10px] font-mono tracking-widest mb-3 uppercase">{category}</div>
    <h3 className="text-2xl font-bold text-white mb-4 leading-tight group-hover:text-cyan-100 transition-colors">{title}</h3>
    <div className="text-white/40 text-xs font-mono flex items-center gap-2">
      <span>{date}</span>
      <span className="w-4 h-[1px] bg-white/20" />
      <span className="group-hover:translate-x-1 transition-transform duration-300">READ_LOG</span>
    </div>
  </div>
);

// 主页组件
const Home = () => {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden font-sans text-white">
      {/* 3D 背景 */}
      <div className="fixed inset-0 z-0">
        <BlackHoleBackground />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* 内容区域 (NavBar 由 App.jsx 处理，这里只放内容) */}
      <main className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none">
        <div className="flex flex-col items-start pointer-events-auto">
          <div className="mb-8 flex items-center gap-4 text-cyan-400 font-mono text-xs tracking-widest border-l-2 border-cyan-500 pl-4 bg-black/20 backdrop-blur-md py-1 pr-4 rounded-r">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            STATUS: ONLINE // 3.0 M☉
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter mix-blend-exclusion opacity-90">
            VISUALIZE<br />
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400">UNSEEN</span>
          </h1>
          
          <p className="max-w-xl text-white/90 text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/20 pl-6 backdrop-blur-sm bg-black/10 p-4 rounded-r-lg">
            我是 <strong>XiaoBai SAMA</strong>。<br />
            用 WebGL 重构宇宙。
          </p>

          <button className="flex items-center gap-2 bg-white text-black px-8 py-3 font-mono font-bold tracking-widest hover:bg-cyan-300 transition-colors">
            START READING <ArrowRight size={16} />
          </button>
        </div>
      </main>

      {/* 文章列表 */}
      <section className="relative z-10 bg-black/30 backdrop-blur-md py-24 px-6 border-t border-white/10 pointer-events-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <h2 className="text-4xl font-bold tracking-tighter mix-blend-overlay text-white opacity-90">LATEST LOGS</h2>
            <div className="text-sm font-mono text-cyan-400">2025.12.20</div>
          </div>
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

export default Home;