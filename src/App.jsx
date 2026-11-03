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
 * 核心引擎：BlackHoleBackground v6.0 (纯连续相对论流体着色器 + 史诗开场运镜)
 * 彻底告别散点颗粒！采用 GLSL 连续开普勒湍流噪声场 + 爱因斯坦引力透镜 + 多普勒集束
 * =================================================================
 */
export const BlackHoleBackground = ({ mode = "home" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.25) : Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 运镜与物理状态机
    const state = {
      time: 0,
      intro: 0.0,            // 0 -> 1 开场运镜进度
      scroll: 0.0,           // 滚动运镜
      targetScroll: 0.0,
      overdrive: 0.0,        // 彩蛋：相对论超频/时间膨胀模式 (0: 正常琥珀金, 1: 高能切伦科夫蓝移)
      overdriveActive: false,
      mouse: { x: 0, y: 0, tx: 0, ty: 0 }
    };

    const uniforms = {
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3(0, 1.2, 11.0) },
      uCamTarget: { value: new THREE.Vector3(0, 0, 0) },
      uCamRoll: { value: -0.15 },
      uOverdrive: { value: 0.0 },
      uDimmer: { value: mode === "home" ? 1.0 : mode === "archive" ? 0.72 : 0.35 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform vec3 uCamPos;
        uniform vec3 uCamTarget;
        uniform float uCamRoll;
        uniform float uOverdrive;
        uniform float uDimmer;

        // 连续平滑哈希与 2D 价值噪声 (用于生成丝滑连续的等离子体流线)
        float hash21(vec2 p) {
          p = fract(p * vec2(234.34, 435.345));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash21(i);
          float b = hash21(i + vec2(1.0, 0.0));
          float c = hash21(i + vec2(0.0, 1.0));
          float d = hash21(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // 连续流体分形布朗运动 (FBM)
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.02 + vec2(1.7, 9.2);
            a *= 0.5;
          }
          return v;
        }

        // 计算连续吸积盘在交点 p 处的辐射亮度与色彩
        vec4 sampleAccretionDisk(vec3 p, vec3 rd, float r) {
          float rIn = 1.65;
          float rOut = 9.5;
          if (r < rIn || r > rOut) return vec4(0.0);

          // 径向软边界包络 (内圈陡峭如刀切，外圈自然弥散入深空)
          float innerFade = smoothstep(rIn, rIn + 0.45, r);
          float outerFade = 1.0 - smoothstep(rIn + 1.2, rOut, r);
          float radialProfile = innerFade * pow(outerFade, 1.55);

          // 开普勒剪切角速度：越靠近内圈转得越快，拉出完全连续的螺旋丝带
          float angle = atan(p.z, p.x);
          float speed = (1.1 + uOverdrive * 1.4) * uTime;
          float shearPhase = angle + speed * (3.6 / pow(r, 1.15)) - r * 2.2;

          // 使用无缝周期三角坐标采样连续流体噪声，彻底消除接缝与颗粒感
          vec2 flowCoord = vec2(cos(shearPhase), sin(shearPhase)) * (1.8 + r * 0.35) + vec2(r * 1.6, uTime * 0.15);
          float stream1 = fbm(flowCoord);
          float stream2 = fbm(flowCoord * 2.1 - vec2(uTime * 0.25));
          
          // 连续同心高密度等离子流环
          float rings = 0.65 + 0.35 * sin(r * 7.5 - stream1 * 4.5 + uTime * 0.8);
          float fluidDensity = mix(stream1, stream2, 0.5) * rings;
          fluidDensity = smoothstep(0.12, 0.88, fluidDensity);

          // 相对论多普勒集束效应 (Relativistic Doppler Beaming)
          vec3 velDir = normalize(vec3(-p.z, 0.0, p.x));
          float doppler = dot(velDir, -rd);
          float beaming = pow(clamp(1.0 + 0.55 * doppler, 0.22, 2.2), 2.8);

          // 经典《星际穿越》卡冈图雅黑体辐射色谱
          float temp = clamp((r - rIn) / (rOut - rIn), 0.0, 1.0);
          vec3 coreWhite = vec3(1.0, 0.98, 0.92);
          vec3 midAmber  = vec3(1.0, 0.58, 0.14);
          vec3 outerRed  = vec3(0.52, 0.06, 0.01);
          vec3 blueTint  = vec3(0.75, 0.92, 1.0);

          vec3 col = mix(coreWhite, midAmber, pow(temp, 0.42));
          col = mix(col, outerRed, pow(temp, 1.35));
          // 朝向观察者一侧产生高能蓝移提亮
          if (doppler > 0.0) {
            col = mix(col, blueTint, pow(doppler, 1.8) * 0.32);
          }

          // 彩蛋：Time Dilation Overdrive (高能天体物理光谱切换：等离子青蓝 + 极光紫)
          vec3 odCore = vec3(0.95, 1.0, 1.0);
          vec3 odMid  = vec3(0.12, 0.82, 1.0);
          vec3 odOut  = vec3(0.38, 0.10, 0.85);
          vec3 colOverdrive = mix(odCore, odMid, pow(temp, 0.45));
          colOverdrive = mix(colOverdrive, odOut, pow(temp, 1.3));

          col = mix(col, colOverdrive, uOverdrive);

          float intensity = radialProfile * (0.25 + 1.35 * fluidDensity) * beaming * (1.5 / (pow(temp, 0.8) + 0.35));
          return vec4(col * intensity, clamp(radialProfile * fluidDensity * 1.2, 0.0, 1.0));
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

          // 构造摄像机正交基与滚转角 (Dutch Roll)
          vec3 forward = normalize(uCamTarget - uCamPos);
          vec3 worldUp = vec3(sin(uCamRoll), cos(uCamRoll), 0.0);
          vec3 right = normalize(cross(forward, worldUp));
          vec3 up = cross(right, forward);

          vec3 ro = uCamPos;
          vec3 rd = normalize(uv.x * right + uv.y * up + 1.35 * forward);

          // 史瓦西引力场光线步进 (Continuous Geodesic Raymarching)
          vec3 pos = ro;
          vec3 accumColor = vec3(0.0);
          float trans = 1.0;
          float minR = 1000.0;
          bool swallowed = false;

          float rs = 1.0; // 事件视界半径

          for (int i = 0; i < 96; i++) {
            float r = length(pos);
            minR = min(minR, r);

            if (r < rs) {
              swallowed = true;
              break;
            }
            if (r > 22.0) break;

            // 自适应步长：靠近黑洞或靠近吸积盘赤道面 (y=0) 时加密步长，确保丝滑无噪点
            float stepSize = max(0.035, min(r * 0.07, abs(pos.y) * 0.45 + 0.04));

            // 广义相对论光线弯曲加速度 (与 1/r^3 成正比的光子球偏折)
            float bendForce = (1.65 + uOverdrive * 0.25) / (r * r * r + 0.02);
            rd = normalize(rd - pos * bendForce * stepSize);

            vec3 nextPos = pos + rd * stepSize;

            // 检测光线是否穿过赤道吸积盘平面 (y = 0) —— 这自然产生了前景盘与引力透镜折回的上下主光环！
            if (pos.y * nextPos.y <= 0.0) {
              float tCross = abs(pos.y) / (abs(pos.y - nextPos.y) + 1e-5);
              vec3 hitPos = mix(pos, nextPos, tCross);
              float hitR = length(hitPos.xz);
              vec4 diskSample = sampleAccretionDisk(hitPos, rd, hitR);
              accumColor += diskSample.rgb * trans;
              trans *= (1.0 - diskSample.a * 0.45);
            }

            // 连续体积辉光雾 (Volumetric Accretion Corona)：让吸积盘具备温润的流体厚度感
            float diskDist = abs(pos.y);
            if (diskDist < 0.55 && r > 1.55 && r < 8.5) {
              float vWeight = exp(-diskDist * 8.5) * smoothstep(8.5, 2.0, r) * smoothstep(1.55, 1.9, r);
              vec3 coronaCol = mix(vec3(1.0, 0.48, 0.12), vec3(0.2, 0.85, 1.0), uOverdrive);
              accumColor += coronaCol * vWeight * stepSize * 0.42 * trans;
            }

            pos = nextPos;
          }

          // 光子球极亮细环 (Photon Sphere Ring at r ≈ 1.5 Rs)
          float photonRing = exp(-pow((minR - 1.48) * 14.0, 2.0)) * 1.35;
          if (!swallowed) {
            photonRing += exp(-pow((minR - 1.52) * 5.0, 2.0)) * 0.35;
          }
          vec3 ringColor = mix(vec3(1.0, 0.82, 0.55), vec3(0.75, 0.96, 1.0), uOverdrive);
          accumColor += ringColor * photonRing * trans;

          // ACES 电影级色调映射 (Tone Mapping)，保证高光过曝处柔美不刺眼
          accumColor *= uDimmer;
          accumColor = (accumColor * (2.51 * accumColor + 0.03)) / (accumColor * (2.43 * accumColor + 0.59) + 0.14);
          accumColor = pow(clamp(accumColor, 0.0, 1.0), vec3(0.92));

          gl_FragColor = vec4(accumColor, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false
    });

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    // 鼠标视差与滚动监听
    const onMouseMove = (e) => {
      state.mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2.0;
      state.mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2.0;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onScroll = () => {
      const maxScroll = Math.max(window.innerHeight * 0.9, 1);
      state.targetScroll = Math.min(window.scrollY / maxScroll, 1.5);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 新彩蛋：Time Dilation Overdrive (切换相对论蓝移超频模式，无误触、随时可逆)
    const handlePulse = () => {
      state.overdriveActive = !state.overdriveActive;
      window.dispatchEvent(new CustomEvent("overdrive-state", { detail: state.overdriveActive }));
    };
    window.addEventListener('singularity-pulse', handlePulse);

    const onWindowResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);

    const clock = new THREE.Clock();
    let frameId;
    let isDisposed = false;

    const animate = () => {
      if (isDisposed) return;
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      state.time += delta;

      // 1. 电影级开场运镜 (Cinematic Intro Sweep: 0 -> 1 耗时约 3.2 秒)
      if (state.intro < 1.0) {
        state.intro = Math.min(1.0, state.intro + delta * 0.34);
      }
      // 五次平滑缓动曲线 (Quintic Ease-Out)
      const easeIntro = 1.0 - Math.pow(1.0 - state.intro, 4.0);

      state.scroll += (state.targetScroll - state.scroll) * 0.06;
      state.mouse.x += (state.mouse.tx - state.mouse.x) * 0.045;
      state.mouse.y += (state.mouse.ty - state.mouse.y) * 0.045;

      // 彩蛋平滑插值
      const targetOd = state.overdriveActive ? 1.0 : 0.0;
      state.overdrive += (targetOd - state.overdrive) * 0.05;

      const aspect = window.innerWidth / window.innerHeight;
      const mobileDistBoost = aspect < 0.8 ? 3.5 : 0.0;

      if (mode === "home") {
        const s = state.scroll;
        // 开场时从极近掠射角 (x: -4.8, y: 0.18, z: 6.2) 旋转拉升至标准卡冈图雅远景 (0, 1.15, 11.2)
        const baseX = THREE.MathUtils.lerp(-4.8, 0.0, easeIntro);
        const baseY = THREE.MathUtils.lerp(0.18, 1.15, easeIntro);
        const baseZ = THREE.MathUtils.lerp(6.2, 11.2 + mobileDistBoost, easeIntro);

        // 结合向下滚动的俯仰拉升与鼠标微视差
        const camX = baseX + state.mouse.x * 1.1 + Math.sin(s * 1.5) * 1.4;
        const camY = baseY + s * 3.2 - state.mouse.y * 0.65;
        const camZ = baseZ + s * 2.8;

        uniforms.uCamPos.value.set(camX, camY, camZ);
        uniforms.uCamTarget.value.set(0.0, -s * 0.65, 0.0);
        uniforms.uCamRoll.value = THREE.MathUtils.lerp(-0.48, -0.16, easeIntro) + s * 0.18 + state.mouse.x * 0.04;
      } else if (mode === "archive") {
        // 在 /logs 目录页：把黑洞优雅地构图在右上角远景，形成深空天体观测站背景，绝不显脏
        uniforms.uCamPos.value.set(-2.6 + state.mouse.x * 0.6, 2.2 - state.mouse.y * 0.4, 13.5 + mobileDistBoost);
        uniforms.uCamTarget.value.set(-1.2, -0.35, 0.0);
        uniforms.uCamRoll.value = -0.22 + state.mouse.x * 0.03;
      } else {
        // 文章阅读页底层微光
        uniforms.uCamPos.value.set(state.mouse.x * 0.5, 1.8, 14.0 + mobileDistBoost);
        uniforms.uCamTarget.value.set(0.0, 0.0, 0.0);
        uniforms.uCamRoll.value = -0.15;
      }

      uniforms.uTime.value = state.time;
      uniforms.uOverdrive.value = state.overdrive;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('singularity-pulse', handlePulse);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode]);

  return <div ref={containerRef} className="absolute inset-0 bg-black z-0 pointer-events-none" />;
};

/**
 * =================================================================
 * 2. 页面组件：Home 首页 (开场电影运镜 + 吸积盘流体融合卡片 + 蓝移超频彩蛋)
 * =================================================================
 */
const Home = () => {
  const [overdrive, setOverdrive] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const logsSectionRef = useRef(null);

  useEffect(() => {
    const onOverdrive = (e) => setOverdrive(Boolean(e.detail));
    window.addEventListener('overdrive-state', onOverdrive);
    
    const handleScroll = () => {
      const ratio = Math.min(window.scrollY / (window.innerHeight * 0.65), 1);
      setScrollRatio(ratio);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('overdrive-state', onOverdrive);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToLogs = () => {
    logsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 深度融合黑洞吸积盘流体元素的 ArticleCard 小方块
  const ArticleCard = ({ title, category, date, index }) => {
    const cardRef = useRef(null);

    const handleCardMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      cardRef.current.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      cardRef.current.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };

    return (
      <div
        ref={cardRef}
        onMouseMove={handleCardMouseMove}
        style={{ '--mx': '50%', '--my': '50%' }}
        className="accretion-card group relative bg-[#04070e]/75 border border-white/10 p-8 transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-xl pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.75)] hover:-translate-y-1.5 hover:border-amber-400/50"
      >
        {/* 1. 鼠标跟随的吸积盘多普勒热流光晕 (Accretion Thermal Spotlight) */}
        <div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: overdrive
              ? 'radial-gradient(380px circle at var(--mx) var(--my), rgba(34,211,238,0.16), rgba(124,58,237,0.06) 45%, transparent 75%)'
              : 'radial-gradient(380px circle at var(--mx) var(--my), rgba(245,158,11,0.18), rgba(56,189,248,0.08) 45%, transparent 75%)'
          }}
        />

        {/* 2. 顶部流线型吸积盘多普勒光谱细线 (左端高能蓝移 -> 右端琥珀红移) */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-300 via-amber-400 to-red-700 opacity-30 group-hover:opacity-100 transition-opacity duration-500" />

        {/* 3. 右上角微型引力透镜光环微缩景观 (Mini Gravitational Lensing Halo) */}
        <div className="absolute -right-6 -top-6 w-24 h-24 pointer-events-none opacity-20 group-hover:opacity-75 transition-all duration-700 group-hover:scale-110 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border border-amber-400/50 group-hover:border-cyan-300/70 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-spin-slow" />
          <div className="absolute w-16 h-4 rounded-full border-t border-b border-amber-300/70 -rotate-12" />
          <div className="absolute w-6 h-6 rounded-full bg-black shadow-[0_0_12px_#f59e0b]" />
        </div>

        {/* 4. 卡片正文内容 */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-400/90 group-hover:text-cyan-300 transition-colors text-[10px] font-mono tracking-[0.25em] uppercase">
              {category}
            </span>
            <span className="text-[9px] font-mono text-white/20 group-hover:text-amber-300/60 transition-colors">
              ORBIT_0{index + 1}
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white mb-6 leading-snug group-hover:text-amber-50 transition-colors uppercase line-clamp-2 min-h-[3.5rem]">
            {title}
          </h3>

          <div className="text-white/40 text-xs font-mono flex items-center justify-between pt-4 border-t border-white/5">
            <span>{date}</span>
            <div className="flex items-center gap-2 text-amber-400/70 group-hover:text-cyan-300 transition-colors">
              <span className="text-[10px] tracking-[0.2em]">ENTER_HORIZON</span>
              <ArrowRight size={13} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 首屏文字随向下滚动平滑淡出并微缩
  const heroOpacity = Math.max(0, 1 - scrollRatio * 1.35);
  const heroTranslateY = scrollRatio * -60;
  const heroScale = 1 - scrollRatio * 0.06;

  return (
    <div className="relative w-full min-h-screen bg-black overflow-x-hidden text-white select-none">
      <style>{`
        @keyframes cinematic-reveal {
          0% { opacity: 0; transform: translateY(28px); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .intro-fade-1 { animation: cinematic-reveal 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.4s backwards; }
        .intro-fade-2 { animation: cinematic-reveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.75s backwards; }
        .intro-fade-3 { animation: cinematic-reveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.1s backwards; }
        .intro-fade-4 { animation: cinematic-reveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1.4s backwards; }
      `}</style>

      {/* 1. 全局固定连续流体黑洞层 */}
      <div className="fixed inset-0 z-0">
        <BlackHoleBackground mode="home" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.82)_100%)] pointer-events-none" />
      </div>

      {/* 2. 首屏核心寄语区 (配合开场运镜分步浮现) */}
      <main 
        style={{ 
          opacity: heroOpacity, 
          transform: `translate3d(0, ${heroTranslateY}px, 0) scale(${heroScale})` 
        }}
        className="relative z-10 flex flex-col justify-center min-h-screen px-6 md:px-20 max-w-7xl mx-auto pt-20 pointer-events-none will-change-transform"
      >
        <div className="flex flex-col items-start pointer-events-auto">
          
          {/* 状态指示器：点击可丝滑切换「相对论蓝移超频模式」彩蛋，无震动崩溃，随时可逆 */}
          <div 
            onClick={() => window.dispatchEvent(new CustomEvent("singularity-pulse"))}
            title="Click to toggle Relativistic Blueshift Overdrive"
            className={`intro-fade-1 mb-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.3em] border-l-2 pl-4 py-1.5 pr-4 rounded-r uppercase transition-all duration-500 cursor-pointer
              ${overdrive 
                ? 'text-cyan-300 border-cyan-400 bg-cyan-500/15 shadow-[0_0_25px_rgba(34,211,238,0.25)]' 
                : 'text-amber-300/90 border-amber-500 bg-black/45 backdrop-blur-md hover:bg-white/10'}
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${overdrive ? 'bg-cyan-300 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
            {overdrive ? 'Mode: Relativistic_Blueshift_Overdrive' : 'Status: Singularity_Stable'}
          </div>
          
          {/* 主标题 */}
          <h1 className="intro-fade-2 text-5xl sm:text-7xl md:text-9xl font-black mb-8 leading-[0.88] tracking-tighter mix-blend-exclusion opacity-95 uppercase">
            Explore<br />The <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-cyan-300 to-purple-400">Unseen</span>
          </h1>
          
          {/* 原版牛顿寄语 */}
          <div className="intro-fade-3 max-w-full text-white/90 text-xs sm:text-sm md:text-base leading-relaxed mb-12 font-mono border-l border-amber-400/40 pl-5 md:pl-6 backdrop-blur-md bg-black/40 p-4 md:p-5 rounded-r-lg shadow-2xl">
            <p className="mb-2">This is <strong>XiaoBai SAMA</strong>.</p>
            <p className="lg:whitespace-nowrap tracking-tight opacity-85">
              It remains that, from the same principles, I now demonstrate the frame of the System of the World. —— Issac Newton
            </p>
          </div>

          <div className="intro-fade-4 flex flex-wrap items-center gap-6">
            <Link 
              to="/logs" 
              className="px-10 py-4 border border-white/80 bg-black/25 backdrop-blur-sm text-white tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-all duration-500 font-black text-xs md:text-sm"
            >
              Start Reading	
            </Link>
            
            <button 
              onClick={scrollToLogs}
              className="text-[10px] font-mono tracking-[0.3em] uppercase text-white/50 hover:text-amber-300 transition-colors flex items-center gap-2 py-4 px-2"
            >
              <span>Scroll_To_Accretion_Disk</span>
              <ChevronDown size={14} className="animate-bounce" />
            </button>
          </div>
        </div>
      </main>
      
      {/* 3. 运镜展开后的 Logs 矩阵区域 */}
      <section 
        ref={logsSectionRef}
        className="relative z-10 bg-gradient-to-b from-transparent via-black/70 to-black/95 backdrop-blur-md py-32 px-6 border-t border-amber-500/15"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 border-b border-white/10 pb-6">
            <div>
              <div className="text-[10px] font-mono tracking-[0.35em] text-amber-400/80 uppercase mb-2">
                // EVENT_HORIZON_TELEMETRY
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter uppercase opacity-90">Logs</h2>
            </div>
            <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 uppercase">
              Total_Records: {POSTS.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POSTS.map((post, idx) => (
              <Link 
                key={post.id} 
                to={`/logs/${post.id}`} 
                className="pointer-events-auto block"
              >
                <ArticleCard 
                  index={idx}
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