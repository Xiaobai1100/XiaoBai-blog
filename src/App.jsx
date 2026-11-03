import React, { Suspense, useState, useEffect, useRef } from "react";
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
  LockKeyhole
} from 'lucide-react';

// 导入你的页面组件
import LogsPage from './pages/LogsPage';
import PrivateLibrary from './pages/PrivateLibrary';
import { POSTS } from './config/posts';

/**
 * =================================================================
 * 核心引擎：BlackHoleBackground v5.0 (Gargantua 物理引擎 + 电影级滚动运镜)
 * 融合了你 blackhole.html 中的 ISCO 坠落、引力时间膨胀、多普勒集束与引力透镜
 * =================================================================
 */
export const BlackHoleBackground = ({ interactive = false }) => {
  const containerRef = useRef(null);
  const chargeBarRef = useRef(null);
  const chargeContainerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // 物理常量配置 (源自你的 Gargantua V24)
    const CONFIG = {
      particleCount: isMobile ? 85000 : 260000,
      horizonRadius: 2.0,      // 史瓦西半径 Rs = 2
      iscoRadius: 6.0,         // 最内稳定轨道 ISCO = 3 * Rs
      diskOuterBase: 42.0,
      spawnZoneBase: 22.0,
      baseSpeed: 0.42,
      colAccretion: new THREE.Color(0xffaa33),
    };

    const state = {
      mass: 1.0,
      simSpeed: 1.0,
      lensingTarget: 1.0,
      lensingCurrent: 1.0,
      isExploding: false,
      explosionFactor: 0.0,
      isCharging: false,
      chargeLevel: 0.0,
      gyro: { x: 0, y: 0 },
      mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
      scrollProgress: 0,
      targetScroll: 0
    };

    // --- 初始化 Three.js 场景 ---
    const scene = new THREE.Scene();
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    
    // 根据屏幕宽高比动态计算基准距离，彻底解决不同分辨率偏位或裁剪问题
    const getResponsiveDistance = () => {
      const aspect = window.innerWidth / window.innerHeight;
      if (aspect < 0.7) return 310; // 手机竖屏拉远，保证吸积盘完整
      if (aspect < 1.2) return 240; // 平板/方屏
      return 185;                   // 桌面宽屏，极具压迫感的近景
    };

    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, 
      powerPreference: "high-performance",
      alpha: true
    });
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // 1. 事件视界核心 (纯黑球体 + 微弱光子环背光)
    const blackHole = new THREE.Mesh(
      new THREE.SphereGeometry(2.92, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    universeGroup.add(blackHole);

    // 2. 初始化相对论流体粒子系统
    const count = CONFIG.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    
    const uData = {
      phases: new Float32Array(count),
      radii: new Float32Array(count),
      yOffsets: new Float32Array(count),
      speeds: new Float32Array(count),
      infallMod: new Float32Array(count),
      count
    };

    const currentRs = CONFIG.horizonRadius * state.mass;
    const isco = currentRs * 3.0;
    const spawnRadius = CONFIG.diskOuterBase * state.mass;
    const spawnZone = CONFIG.spawnZoneBase * state.mass;

    // 预热初始化：让粒子一开始就分布在吸积盘上，无需等待漫长的生成
    for (let i = 0; i < count; i++) {
      // 使用指数分布让内圈(ISCO附近)更密集，还原流体吸积密度
      const randomRatio = Math.pow(Math.random(), 1.35);
      const r = currentRs * 1.05 + (spawnRadius + spawnZone - currentRs) * randomRatio;
      const angle = Math.random() * Math.PI * 2;
      
      uData.radii[i] = r;
      uData.phases[i] = angle;
      // 流体盘厚度随半径向外微张，加入螺旋波纹扰动
      const spiralWave = Math.sin(angle * 3.0 - r * 0.25) * 0.15;
      uData.yOffsets[i] = ((Math.random() - 0.5) * 0.038 + spiralWave * 0.01) * r;
      uData.speeds[i] = Math.random() * 0.2 + 0.9;
      uData.infallMod[i] = 0.8 + Math.random() * 0.4;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = uData.yOffsets[i];
      positions[i * 3 + 2] = Math.sin(angle) * r;

      colors[i * 3] = CONFIG.colAccretion.r;
      colors[i * 3 + 1] = CONFIG.colAccretion.g;
      colors[i * 3 + 2] = CONFIG.colAccretion.b;

      sizes[i] = Math.random() * 0.55 + 0.45;
      alphas[i] = 0.0; // 开场渐显
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    // 3. 电影级相对论着色器 (升级版 Gargantua Shader)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        massScale: { value: 1.0 },
        lensingStrength: { value: 1.0 }
      },
      vertexShader: `
        #ifdef GL_ES
        precision mediump float;
        #endif

        uniform float massScale;
        uniform float lensingStrength;

        attribute float size;
        attribute float alpha;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float rPhys = length(position.xyz);
          float rsPhys = massScale * 3.0;

          // 引力时间膨胀因子 gFactor
          float gFactor = sqrt(clamp(1.0 - rsPhys / (rPhys + 0.001), 0.0, 1.0));

          // 相对论多普勒集束效应 (Relativistic Doppler Beaming)
          vec3 velDir = normalize(vec3(-position.z, 0.0, position.x));
          vec3 velView = normalize(normalMatrix * velDir);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float dopplerDot = dot(velView, viewDir);
          float beaming = pow(1.0 + 0.52 * dopplerDot, 3.2);

          // 电影级黑体辐射色谱：内圈极热白金，中圈琥珀橙，外圈深邃暗红，蓝移端泛轻微高能青白光
          vec3 hotCore = vec3(1.0, 0.96, 0.88);
          vec3 midGold = customColor;
          vec3 deepRed = vec3(0.55, 0.03, 0.01);
          vec3 blueShiftTint = vec3(0.85, 0.95, 1.0);

          float radialTemp = clamp((rPhys - 6.0) / 36.0, 0.0, 1.0);
          vec3 baseTempColor = mix(hotCore, midGold, pow(radialTemp, 0.45));
          baseTempColor = mix(baseTempColor, deepRed, pow(radialTemp, 1.4));

          // 叠加引力红移与多普勒蓝移色偏
          float colorShift = pow(1.0 - gFactor, 2.5);
          vec3 diskColor = mix(baseTempColor, deepRed, colorShift * 0.7);
          if (dopplerDot > 0.0) {
            diskColor = mix(diskColor, blueShiftTint, pow(dopplerDot, 2.0) * 0.35);
          }

          vColor = diskColor * beaming * (gFactor + 0.15);
          vAlpha = alpha;

          // 爱因斯坦引力透镜偏折 (Einstein Gravitational Lensing)
          if (lensingStrength > 0.01) {
            float r = length(mvPosition.xy);
            float rs = massScale * 12.0; 
            float b = max(r, 0.1);
            float deflection = (2.0 * rs / b) + (15.0 * rs * rs / (b * b));
            mvPosition.xy += normalize(mvPosition.xy) * deflection * lensingStrength;
          }

          gl_Position = projectionMatrix * mvPosition;
          #ifdef GL_ES
          gl_PointSize = size * (1.15 + massScale * 0.1) * (900.0 / -mvPosition.z);
          #else
          gl_PointSize = size * (1.0 + massScale * 0.1) * (900.0 / -mvPosition.z);
          #endif
        }
      `,
      fragmentShader: `
        #ifdef GL_ES
        precision mediump float;
        #endif
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float strength = 1.0 - (dist * 2.0);
          strength = pow(strength, 2.4);

          gl_FragColor = vec4(vColor, vAlpha * strength);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    const system = new THREE.Points(geometry, material);
    universeGroup.add(system);

    // SSD 盘发射率分布: ε(r) ∝ r^-3 * (1 - sqrt(isco/r))
    const getEmissivity = (r, iscoVal) => {
      if (r < iscoVal) return 0;
      const term = 1.0 - Math.sqrt(iscoVal / r);
      const intensity = 450.0 * (1.0 + state.mass * 0.4);
      return term * Math.pow(iscoVal / r, 3.0) * intensity;
    };

    // --- 交互与传感器监听 ---
    // 1. 鼠标流体视差运镜
    const onMouseMove = (e) => {
      state.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2.0;
      state.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2.0;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // 2. 滚动驱动的电影运镜 (Scroll-Driven Camera Rig)
    const onScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.85, 1);
      state.targetScroll = Math.min(window.scrollY / maxScroll, 1.5);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 3. 陀螺仪监听
    const onDeviceOrientation = (e) => {
      if (!e.beta && !e.gamma) return;
      const x = Math.max(-30, Math.min(30, e.beta || 0));
      const y = Math.max(-30, Math.min(30, e.gamma || 0));
      state.gyro.x = x * 0.015;
      state.gyro.y = y * 0.015;
    };
    window.addEventListener('deviceorientation', onDeviceOrientation);

    // 4. 彩蛋：Singularity Pulse / Breach 爆发逻辑
    let breachTimeout = null;
    const triggerBreach = () => {
      state.isExploding = true;
      state.lensingTarget = 0.15; // 爆发时引力透镜短暂失效坍缩
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
      if (breachTimeout) clearTimeout(breachTimeout);
      breachTimeout = setTimeout(() => {
        state.isExploding = false;
        state.lensingTarget = 1.0;
      }, 1600);
    };
    window.addEventListener('singularity-pulse', triggerBreach);

    // 5. 长按背景蓄力触发 Breach 彩蛋 (保留自你的 blackhole.html)
    let chargeInterval = null;
    const startCharge = (e) => {
      if (!interactive || e.target.closest('a, button')) return;
      state.isCharging = true;
      state.chargeLevel = 0;
      if (chargeContainerRef.current) chargeContainerRef.current.style.opacity = '1';
      if (chargeInterval) clearInterval(chargeInterval);
      chargeInterval = setInterval(() => {
        if (!state.isCharging) return;
        state.chargeLevel += 0.03;
        if (chargeBarRef.current) {
          chargeBarRef.current.style.width = `${Math.min(100, state.chargeLevel * 100)}%`;
        }
        if (state.chargeLevel >= 1.0) {
          clearInterval(chargeInterval);
          if (chargeContainerRef.current) chargeContainerRef.current.style.opacity = '0';
          window.dispatchEvent(new CustomEvent("singularity-pulse"));
        }
      }, 25);
    };

    const stopCharge = () => {
      state.isCharging = false;
      if (chargeInterval) clearInterval(chargeInterval);
      if (chargeContainerRef.current) chargeContainerRef.current.style.opacity = '0';
      if (chargeBarRef.current) chargeBarRef.current.style.width = '0%';
    };

    if (interactive) {
      window.addEventListener('mousedown', startCharge);
      window.addEventListener('mouseup', stopCharge);
      window.addEventListener('touchstart', startCharge, { passive: true });
      window.addEventListener('touchend', stopCharge);
    }

    // 6. 窗口大小自适应
    let baseDist = getResponsiveDistance();
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      baseDist = getResponsiveDistance();
    };
    window.addEventListener('resize', onWindowResize);

    // --- 动画主循环 ---
    const clock = new THREE.Clock();
    let frameId;
    let isDisposed = false;
    let introProgress = 0.0; // 入场运镜推进因子

    const baseCol = CONFIG.colAccretion;
    const greyCol = new THREE.Color(0x778899);
    const tempCol = new THREE.Color();

    const animate = () => {
      if (isDisposed) return;
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      // A. 电影级复合运镜 (入场缓动 + 滚动轨道拉升 + 鼠标阻尼视差)
      introProgress += (1.0 - introProgress) * 0.025;
      state.scrollProgress += (state.targetScroll - state.scrollProgress) * 0.06;
      state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.04;
      state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.04;

      const s = state.scrollProgress;
      // 刚进入页面时从极低角度(8)缓动升至标准卡冈图雅视角(24)，向下滚动看Logs时拉高到俯瞰视角(85)
      const camY = THREE.MathUtils.lerp(8, 24, introProgress) + s * 62 - state.mouse.y * 14;
      // 距离随滚动略微拉远，展现吸积盘全貌
      const camZ = THREE.MathUtils.lerp(baseDist * 1.25, baseDist, introProgress) + s * 55;
      const camX = state.mouse.x * 22 + Math.sin(s * Math.PI * 0.5) * 18;

      camera.position.set(camX, camY, camZ);
      // 往下滚动时，视线焦点略微下移，让黑洞优雅地托起上方的文章列表
      camera.lookAt(0, -s * 12, 0);

      // 赋予黑洞宇宙极具高级感的电影级倾斜角 (Cinematic Dutch Angle)，随滚动与鼠标微微摆动
      const targetRoll = -0.16 + s * 0.22 + state.mouse.x * 0.05 + state.gyro.y;
      const targetPitch = state.gyro.x + state.mouse.y * 0.04;
      universeGroup.rotation.z += (targetRoll - universeGroup.rotation.z) * 0.08;
      universeGroup.rotation.x += (targetPitch - universeGroup.rotation.x) * 0.08;

      // B. Breach 爆发状态机
      if (state.isExploding) {
        state.explosionFactor += (1.0 - state.explosionFactor) * 0.08;
      } else {
        state.explosionFactor += (0.0 - state.explosionFactor) * 0.08;
      }

      state.lensingCurrent += (state.lensingTarget - state.lensingCurrent) * 0.08;
      material.uniforms.lensingStrength.value = state.lensingCurrent;
      material.uniforms.massScale.value = state.mass;
      blackHole.scale.setScalar(currentRs / 1.05);

      // C. 30万粒子相对论物理积分
      const pos = geometry.attributes.position.array;
      const alph = geometry.attributes.alpha.array;
      const cols = geometry.attributes.customColor.array;
      const G_const = 500.0 * state.mass;

      tempCol.copy(baseCol).lerp(greyCol, state.explosionFactor);
      const rCol = tempCol.r, gCol = tempCol.g, bCol = tempCol.b;

      const visualBoost = 3.5;
      const effectiveTime = delta * state.simSpeed * visualBoost;

      for (let i = 0; i < uData.count; i++) {
        const i3 = i * 3;
        let r = uData.radii[i];
        let phase = uData.phases[i];

        const isConsumed = r < currentRs * 1.0001;
        const isEscaped = r > 2200.0 && !state.isExploding;

        if (isConsumed || isEscaped) {
          const randomRatio = Math.sqrt(Math.random());
          r = currentRs + (spawnRadius + spawnZone - currentRs) * randomRatio;
          phase = Math.random() * Math.PI * 2;
          uData.yOffsets[i] = (Math.random() - 0.5) * (r * 0.04);
          alph[i] = 0.0;
        }

        // 史瓦西时间膨胀因子
        const dilation = (r > currentRs) ? Math.sqrt(1.0 - (currentRs / r)) : 0.0;

        if (state.isExploding) {
          // 视界突破：无视时间膨胀向外爆发
          const noise = Math.sin(i * 0.5 + clock.elapsedTime);
          r += (110.0 + noise * 55.0) * state.explosionFactor * delta;
        } else {
          // 开普勒角速度 + ISCO 内侧自由落体骤降 (Plunge)
          const vOrbital = Math.sqrt(G_const / r) * 1.2;
          phase += vOrbital * Math.max(dilation, 0.15) * CONFIG.baseSpeed * uData.speeds[i] * effectiveTime * 0.2;
          const vr = (r > isco) 
            ? -5.0 * (state.mass / Math.sqrt(r)) 
            : -Math.sqrt(2.0 * G_const * (1.0 / r - 1.0 / isco)) - 150.0;
          r += vr * (dilation * dilation) * effectiveTime * uData.infallMod[i];
        }

        cols[i3] = rCol;
        cols[i3 + 1] = gCol;
        cols[i3 + 2] = bCol;

        // 亮度计算：Shakura-Sunyaev 辐射强度 + 能量堆积
        const emiss = getEmissivity(r, isco);
        const energyStack = 1.0 / (dilation + 0.1);
        const brightnessComp = 280.0 * (1.0 + Math.pow(state.mass, 0.75));
        const finalTarget = Math.min(emiss * energyStack * brightnessComp, 1.0);
        const horizonFade = THREE.MathUtils.smoothstep(r, currentRs * 1.0, currentRs * 1.02);

        alph[i] = THREE.MathUtils.lerp(alph[i], finalTarget * horizonFade, 0.04);

        pos[i3] = Math.cos(phase) * r;
        pos[i3 + 1] = uData.yOffsets[i];
        pos[i3 + 2] = Math.sin(phase) * r;

        uData.radii[i] = r;
        uData.phases[i] = phase;
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.alpha.needsUpdate = true;
      geometry.attributes.customColor.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      if (breachTimeout) clearTimeout(breachTimeout);
      if (chargeInterval) clearInterval(chargeInterval);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('singularity-pulse', triggerBreach);
      if (interactive) {
        window.removeEventListener('mousedown', startCharge);
        window.removeEventListener('mouseup', stopCharge);
        window.removeEventListener('touchstart', startCharge);
        window.removeEventListener('touchend', stopCharge);
      }
      geometry.dispose();
      material.dispose();
      blackHole.geometry.dispose();
      blackHole.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [interactive]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-black z-0 touch-none pointer-events-none">
      {/* 长按蓄力进度条 (暗藏彩蛋反馈) */}
      <div 
        ref={chargeContainerRef}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/10 overflow-hidden opacity-0 transition-opacity duration-300 pointer-events-none z-50"
      >
        <div ref={chargeBarRef} className="w-0 h-full bg-cyan-400 shadow-[0_0_15px_#22d3ee]" />
      </div>
    </div>
  );
};

/**
 * =================================================================
 * 2. 页面组件：Home 首页 (保留全部经典元素 + 滚动电影运镜展开)
 * =================================================================
 */
const Home = () => {
  const [glitchState, setGlitchState] = useState('stable');
  const [scrollRatio, setScrollRatio] = useState(0);
  const logsSectionRef = useRef(null);

  useEffect(() => {
    const timers = [];
    const onPulse = () => {
      setGlitchState('shaking');
      timers.push(window.setTimeout(() => setGlitchState('abnormal'), 450));
      timers.push(window.setTimeout(() => setGlitchState('stable'), 1600));
    };
    window.addEventListener('singularity-pulse', onPulse);
    
    const handleScroll = () => {
      const ratio = Math.min(window.scrollY / (window.innerHeight * 0.65), 1);
      setScrollRatio(ratio);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('singularity-pulse', onPulse);
      window.removeEventListener('scroll', handleScroll);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const scrollToLogs = () => {
    logsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 内部 ArticleCard 组件：保持你的原版结构，升级高级毛玻璃光感
  const ArticleCard = ({ title, category, date }) => (
    <div className="group relative bg-[#05080f]/60 border border-white/10 p-8 hover:border-cyan-400/50 hover:bg-white/[0.07] transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-cyan-400"><Zap size={18} /></div>
      <div className="text-cyan-400/80 text-[10px] font-mono tracking-[0.25em] mb-3 uppercase">{category}</div>
      <h3 className="text-xl md:text-2xl font-bold text-white mb-4 leading-snug group-hover:text-cyan-100 transition-colors uppercase">{title}</h3>
      <div className="text-white/40 text-xs font-mono flex items-center gap-3">
        <span>{date}</span>
        <span className="w-6 h-[1px] bg-white/20 group-hover:w-10 group-hover:bg-cyan-400/60 transition-all duration-300" />
        <span className="group-hover:text-white/80 transition-colors">READ_LOG</span>
      </div>
    </div>
  );

  // 首屏文字随向下滚动平滑淡出并微缩，把视觉中心完全交给运镜中的卡冈图雅黑洞
  const heroOpacity = Math.max(0, 1 - scrollRatio * 1.35);
  const heroTranslateY = scrollRatio * -60;
  const heroScale = 1 - scrollRatio * 0.06;

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden text-white select-none">
      <style>{`
        @keyframes fragment-shake {
          0% { transform: translate(0); clip-path: inset(0 0 0 0); }
          15% { transform: translate(-25px, 3px); clip-path: inset(12% 0 75% 0); filter: hue-rotate(90deg); }
          30% { transform: translate(20px, -3px); clip-path: inset(65% 0 8% 0); }
          45% { transform: translate(-8px, 4px); clip-path: inset(38% 0 42% 0); }
          60% { transform: translate(0); clip-path: inset(0 0 0 0); filter: none; }
          100% { transform: translate(0); }
        }
        .shaking-active { animation: fragment-shake 0.38s cubic-bezier(.25,.46,.45,.94) infinite; }
      `}</style>

      {/* 1. 全局固定 WebGL 视界引擎层 */}
      <div className={`fixed inset-0 z-0 ${glitchState === 'shaking' ? 'shaking-active' : ''}`}>
        <BlackHoleBackground interactive={true} />
        {/* 电影暗角，确保四周文字在任何分辨率下都清晰可读 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none" />
      </div>

      {/* 2. 首屏核心寄语区 (随滚动运镜优雅退场) */}
      <main 
        style={{ 
          opacity: heroOpacity, 
          transform: `translate3d(0, ${heroTranslateY}px, 0) scale(${heroScale})` 
        }}
        className={`relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none will-change-transform ${glitchState !== 'stable' ? 'opacity-80' : ''}`}
      >
        <div className={`flex flex-col items-start pointer-events-auto ${glitchState === 'shaking' ? 'shaking-active' : ''}`}>
          
          {/* 状态指示器 (点击或长按屏幕也可触发 Breach 彩蛋) */}
          <div 
            onClick={() => window.dispatchEvent(new CustomEvent("singularity-pulse"))}
            title="Click or Hold Screen to Breach Event Horizon"
            className={`mb-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] border-l-2 pl-4 py-1.5 pr-4 rounded-r uppercase transition-all duration-500 cursor-pointer
              ${glitchState !== 'stable' 
                ? 'text-red-400 border-red-500 bg-red-500/15 shadow-[0_0_25px_rgba(239,68,68,0.3)]' 
                : 'text-cyan-400 border-cyan-500 bg-black/40 backdrop-blur-md hover:bg-white/10'}
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${glitchState !== 'stable' ? 'bg-red-500 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
            {glitchState !== 'stable' ? 'Alert: Critical_Horizon_Breach' : 'Status: Singularity_Stable'}
          </div>
          
          {/* 主标题 */}
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black mb-8 leading-[0.88] tracking-tighter mix-blend-exclusion opacity-95 uppercase">
            Explore<br />The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-cyan-300 to-purple-400">Unseen</span>
          </h1>
          
          {/* 你的原版寄语 —— 原封不动保留 */}
          <div className="max-w-full text-white/90 text-xs sm:text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-white/25 pl-5 md:pl-6 backdrop-blur-md bg-black/35 p-4 md:p-5 rounded-r-lg shadow-2xl">
            <p className="mb-2">This is <strong>XiaoBai SAMA</strong>.</p>
            <p className=" lg:whitespace-nowrap tracking-tight opacity-85">
              It remains that, from the same principles, I now demonstrate the frame of the System of the World. —— Issac Newton
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link 
              to="/logs" 
              className="px-10 py-4 border border-white/80 bg-black/20 backdrop-blur-sm text-white tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all duration-500 font-black text-xs md:text-sm"
            >
              Start Reading	
            </Link>
            
            <button 
              onClick={scrollToLogs}
              className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors flex items-center gap-2 py-4 px-2"
            >
              <span>Scroll_To_Orbit</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          </div>
        </div>
      </main>
      
      {/* 3. 运镜展开后的 Logs 矩阵区域 */}
      <section 
        ref={logsSectionRef}
        className="relative z-10 bg-gradient-to-b from-transparent via-black/65 to-black/90 backdrop-blur-md py-32 px-6 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase opacity-80">Logs</h2>
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">
              Total_Records: {POSTS.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
 * 3. 页面组件：BlackHoleModel (保留你的独立实验室页面)
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

  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (isMenuOpen) {
        setIsVisible(true);
        return;
      }
      if (currentScrollY < 20) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsMenuOpen(false));
    return () => window.cancelAnimationFrame(frameId);
  }, [location]);

  const triggerPulse = () => {
    setIsGlowing(true);
    window.dispatchEvent(new CustomEvent("singularity-pulse"));
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().catch(console.error);
    }
    setTimeout(() => setIsGlowing(false), 1200);
  };

  if (location.pathname === '/library') return null;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full p-6 md:p-8 z-[100] text-white mix-blend-difference pointer-events-none 
          transition-all duration-500 ease-in-out
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto font-mono uppercase">
          
          {/* 左侧：Logo & Title (点击终端图标触发视界突破彩蛋) */}
          <div className="flex items-center gap-4 pointer-events-auto select-none">
            <div 
              onClick={triggerPulse}
              title="Trigger Singularity Pulse"
              className={`w-10 h-10 flex items-center justify-center border transition-all duration-300 cursor-pointer
                ${isGlowing ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_30px_#22d3ee]' : 'border-white hover:bg-white hover:text-black'}
              `}
            >
              <Terminal size={20} className={isGlowing ? 'text-black' : ''} />
            </div>
            
            <Link to="/" className="flex flex-col group active:scale-95 transition-transform">
              <span className="text-xl md:text-2xl tracking-[0.2em] leading-none font-black">XiaoBai</span>
              <span className="text-[10px] tracking-[0.3em] opacity-40">SAMA</span>
            </Link>
            
            <div 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="md:hidden ml-1 text-white cursor-pointer pointer-events-auto p-2"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </div>
          </div>

          {/* 右侧：桌面端菜单 */}
          <div className="hidden md:flex gap-10 items-center pointer-events-auto text-sm tracking-[0.3em] font-bold">
            <Link to="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-cyan-400 transition-colors py-4">
                Models <ChevronDown size={14} />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:block min-w-[160px] pt-2">
                <div className="bg-black/95 border border-white/10 backdrop-blur-xl flex flex-col p-1">
                  <Link to="/models/black-hole" className="px-4 py-3 text-[11px] text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all text-center">
                    Black_Hole
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/lab" className="hover:text-cyan-400 transition-colors">Lab</Link>

            <Link to="/library" className="hover:text-cyan-400 transition-colors flex items-center gap-2"><LockKeyhole size={14} /> Library</Link>
            
            <a 
              href="https://github.com/Xiaobai1100" 
              target="_blank" 
              rel="noreferrer" 
              className="border border-white/30 px-5 py-1.5 hover:bg-white hover:text-black transition-all flex items-center gap-2"
            >
              <Github size={16} /> Github
            </a>
          </div>
        </div>
      </nav>

      {/* 移动端抽屉 */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div className={`absolute top-0 left-0 w-[70%] max-w-[260px] h-full bg-black/95 backdrop-blur-2xl border-r border-white/5 transition-transform duration-500 ease-out flex flex-col p-8 pt-24 gap-6 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[8px] tracking-[0.4em] text-white/20 uppercase mb-2 border-b border-white/5 pb-3 font-mono">Navigation</div>
          
          <Link to="/" className="text-sm tracking-[0.2em] text-white uppercase font-black">Home</Link>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setIsModelsSubMenuOpen(!isModelsSubMenuOpen)} 
              className="text-sm tracking-[0.2em] flex items-center gap-2 text-white uppercase text-left font-black"
            >
              Models <ChevronDown size={14} className={isModelsSubMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isModelsSubMenuOpen && (
              <div className="flex flex-col gap-4 pl-4 border-l border-white/10 py-1">
                <Link to="/models/black-hole" className="text-[11px] tracking-[0.2em] text-cyan-400/80 uppercase">Black_Hole</Link>
              </div>
            )}
          </div>
          
          <Link to="/lab" className="text-sm tracking-[0.2em] text-white uppercase font-black">Lab</Link>
          <Link to="/library" className="text-sm tracking-[0.2em] text-white uppercase font-black flex items-center gap-2"><LockKeyhole size={14} /> Library</Link>
          <a href="https://github.com/Xiaobai1100" target="_blank" rel="noreferrer" className="text-sm tracking-[0.2em] text-white uppercase font-black">Github</a>
        </div>
      </div>
    </>
  );
};

/**
 * =================================================================
 * 5. 页面组件：404 Signal_Lost 
 * =================================================================
 */
const NotFound = () => {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center text-white font-mono">
      <div className="absolute inset-0 z-0 opacity-40 grayscale-[100%] contrast-[150%] brightness-[70%] blur-[3px]">
        <div className="w-full h-full">
          <BlackHoleBackground />
        </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03] md:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_3px] md:bg-[length:100%_4px]"></div>

      <div className="relative z-20 text-center px-8 w-full max-w-lg">
        <div className="inline-block border border-white/20 bg-white/5 px-3 py-1 mb-6 md:mb-10 rounded-sm">
          <span className="text-white/40 text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] uppercase">
            Signal_Interrupted // 404
          </span>
        </div>
        
        <h1 className="text-4xl md:text-8xl font-light mb-6 md:mb-8 tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/90 leading-none">
          Void <span className="opacity-20 block md:inline mt-2 md:mt-0">Space</span>
        </h1>
        
        <div className="space-y-2 md:space-y-3 font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em] uppercase text-white/30 mb-10 md:mb-12">
          <p className="truncate">Target: Beyond_Observation</p>
          <p>Sync_Status: Null_Response</p>
        </div>

        <Link 
          to="/" 
          className="inline-flex items-center gap-3 border border-white/20 px-8 md:px-10 py-3 md:py-4 text-white/80 text-xs md:text-sm font-bold tracking-[0.2em] hover:bg-white hover:text-black transition-all uppercase active:scale-95"
        >
          Reset_Connection <ArrowRight size={16} />
        </Link>
      </div>

      <div className="absolute bottom-6 md:bottom-8 w-full flex justify-between px-6 md:px-10 text-[7px] md:text-[8px] tracking-[0.3em] md:tracking-[0.5em] text-white/10 uppercase font-bold">
        <span>Sector: ERR_UNKN</span>
        <span>Reality_Sync: FAIL</span>
      </div>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <Router>
    <ScrollToTop /> 
    <NavBar />
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/logs" element={<LogsPage backgroundComponent={BlackHoleBackground} />} />
        <Route path="/models/black-hole" element={<BlackHoleModel />} />
        <Route path="/library" element={<PrivateLibrary />} />

        {POSTS.map(post => (
          <Route key={post.id} path={`/logs/${post.id}`} element={<post.component />} />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </Router>
);

export default App;