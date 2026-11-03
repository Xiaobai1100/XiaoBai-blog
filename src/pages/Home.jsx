import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ChevronRight, Activity, Cpu } from 'lucide-react';

// =========================================================================
// 🌌 核心物理引擎：3D 流体吸积盘与相对论多普勒渲染器
// =========================================================================
const CinematicBlackHole = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // Retina 高清适配
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // =========================================
    // 摄像机与运镜 (Cinematic Camera)
    // =========================================
    const camera = {
      pitch: 0.05,       // 起始：几乎平视吸积盘 (极具压迫感)
      targetPitch: 0.45, // 目标：抬高视角
      distance: 200,     // 起始：极近特写
      targetDistance: width < 768 ? 900 : 700, // 目标：拉远全景
      fov: 400           // 视野深度
    };

    // =========================================
    // 物理模型参数
    // =========================================
    const bhRadius = 80; // 事件视界半径
    const diskInner = bhRadius * 1.5;
    const diskOuter = diskInner * 4.5;
    const particleCount = width < 768 ? 2000 : 5000;
    
    // 生成流体粒子
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      // 粒子在吸积盘内呈指数分布，越靠近内圈越密集
      const rRatio = Math.pow(Math.random(), 1.5);
      const r = diskInner + rRatio * (diskOuter - diskInner);
      const theta = Math.random() * Math.PI * 2;
      
      // 流体厚度：内圈极薄，外圈略厚
      const thickness = (r - diskInner) * 0.15;
      const y = (Math.random() - 0.5) * thickness * (Math.random() * 2);

      particles.push({
        r, theta, y,
        baseSpeed: 15 / Math.sqrt(r), // 开普勒轨道速度 (v ∝ 1/√r)
        noisePhase: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5 + 0.5
      });
    }

    let time = 0;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e) => {
      const cx = width / 2;
      const cy = height / 2;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || cx;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || cy;
      // 将鼠标坐标标准化到 [-1, 1] 区间
      mouse.targetX = (clientX - cx) / cx;
      mouse.targetY = (clientY - cy) / cy;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleMouseMove);

    // =========================================
    // 主渲染循环
    // =========================================
    const animate = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;

      // 1. 摄像机缓动运镜 (Cinematic Ease)
      camera.pitch += (camera.targetPitch - camera.pitch) * 0.015;
      camera.distance += (camera.targetDistance - camera.distance) * 0.015;
      
      // 鼠标微妙的视差交互 (Parallax)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      const currentPitch = camera.pitch + mouse.y * 0.1;
      const yaw = mouse.x * 0.2 + time * 0.1; // 整体缓慢自转 + 鼠标摇摄

      const projected = [];

      // 2. 物理与 3D 投影
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.theta -= p.baseSpeed; // 逆时针旋转
        
        // 流体力学扰动 (Turbulence)
        const turbulence = Math.sin(p.theta * 4 + time + p.noisePhase) * (p.r * 0.02);
        const y3d = p.y + turbulence;

        // 极坐标转 3D 笛卡尔坐标
        const x3d = p.r * Math.cos(p.theta);
        const z3d = p.r * Math.sin(p.theta);

        // 应用 Yaw 旋转 (绕 Y 轴)
        const x_yaw = x3d * Math.cos(yaw) - z3d * Math.sin(yaw);
        const z_yaw = x3d * Math.sin(yaw) + z3d * Math.cos(yaw);

        // 应用 Pitch 旋转 (绕 X 轴，形成俯视)
        const y_pitch = y3d * Math.cos(currentPitch) - z_yaw * Math.sin(currentPitch);
        const z_pitch = y3d * Math.sin(currentPitch) + z_yaw * Math.cos(currentPitch);

        // 透视投影缩放
        const scale = camera.fov / (camera.fov + z_pitch + camera.distance);
        const sx = cx + x_yaw * scale;
        const sy = cy - y_pitch * scale;

        // 🚀 相对论多普勒效应 (Doppler Beaming)
        // x_yaw 表示切向速度投影。负值表示朝向相机运动（蓝移增强），正值表示远离相机（红移减弱）
        const doppler = Math.max(0.1, Math.min(2.0, 1 - (x_yaw / p.r) * 0.8));

        projected.push({ sx, sy, scale, z: z_pitch, doppler, p });
      }

      // 3. 深度排序 (Painters Algorithm: 从远到近绘制)
      projected.sort((a, b) => b.z - a.z);

      // 分离背景层和前景层（以 z=0 也就是黑洞中心为界）
      const backParticles = [];
      const frontParticles = [];
      for (let i = 0; i < projected.length; i++) {
        if (projected[i].z > 0) backParticles.push(projected[i]);
        else frontParticles.push(projected[i]);
      }

      // === 渲染层 1：深空背景 ===
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, width, height);

      // === 渲染层 2：光晕融合模式 ===
      ctx.globalCompositeOperation = 'screen';

      const drawParticles = (pts) => {
        for (let i = 0; i < pts.length; i++) {
          const { sx, sy, scale, doppler, p } = pts[i];
          
          // 剔除屏幕外的粒子以优化性能
          if (sx < 0 || sx > width || sy < 0 || sy > height) continue;

          const size = p.size * scale;
          
          // 基于多普勒效应计算颜色
          let r, g, b, alpha;
          if (doppler > 1) {
            const intensity = (doppler - 1); 
            r = Math.floor(150 + 105 * intensity);
            g = Math.floor(200 + 55 * intensity);
            b = 255;
            alpha = Math.min(1, 0.4 * doppler * scale);
          } else {
            r = Math.floor(255 * doppler);
            g = Math.floor(100 * doppler);
            b = Math.floor(50 * doppler);
            alpha = Math.max(0.05, 0.3 * doppler * scale);
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // 绘制黑洞后方的吸积盘
      drawParticles(backParticles);

      // === 渲染层 3：事件视界 (纯黑) ===
      ctx.globalCompositeOperation = 'source-over';
      const bhScale = camera.fov / (camera.fov + camera.distance);
      const projectedBhRadius = bhRadius * bhScale;
      
      // 光子球发光边缘 (Photon Ring Glow)
      const glowGrad = ctx.createRadialGradient(cx, cy, projectedBhRadius * 0.8, cx, cy, projectedBhRadius * 1.5);
      glowGrad.addColorStop(0, 'rgba(0,0,0,1)');
      glowGrad.addColorStop(0.7, 'rgba(0,0,0,1)');
      glowGrad.addColorStop(0.9, 'rgba(234, 88, 12, 0.3)'); // 暗橙色光晕
      glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, projectedBhRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // === 渲染层 4：黑洞前方的吸积盘 ===
      ctx.globalCompositeOperation = 'screen';
      drawParticles(frontParticles);
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      camera.targetDistance = width < 768 ? 900 : 700;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-auto cursor-crosshair" />;
};


// =========================================================================
// 🚀 顶层 UI：高级全息视窗设计
// =========================================================================
const Home = () => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-transparent text-white font-mono overflow-hidden selection:bg-cyan-500/30">
      
      {/* 1. 3D 流体黑洞引擎层 */}
      <CinematicBlackHole />

      {/* 2. 环境纹理：胶片噪点与极淡的扫描线 */}
      <div className="fixed inset-0 z-10 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="fixed inset-0 z-10 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

      {/* 3.  UI 前景层 */}
      <div className="relative z-20 w-full min-h-screen flex flex-col justify-between p-6 md:p-12 pointer-events-none">
        
        {/* 顶部状态栏 */}
        <header className="flex justify-between items-start animate-fade-in-down">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-white/10 bg-black/20 backdrop-blur-md rounded-sm flex items-center justify-center shadow-2xl">
                <Terminal className="text-white/80" size={18} />
              </div>
              <div className="text-[10px] md:text-xs text-white/50 tracking-[0.4em] uppercase font-bold">
                XIAOBAI<br/><span className="text-cyan-400">SAMA</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end gap-1 text-[9px] tracking-widest font-bold uppercase text-white/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              STATUS: SYSTEM_ONLINE
            </div>
            <div>{time}</div>
          </div>
        </header>

        {/* 中央排版区 - 视觉极简，充满呼吸感 */}
        <main className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in-up">
          
          {/* 大标题：极简追踪字体 */}
          <div className="space-y-4 pointer-events-auto">
             <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-[-0.02em] uppercase text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/10 drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] select-none mix-blend-screen">
               OBSERVATION
               <br />
               <span className="italic font-light tracking-tighter opacity-80">TERMINAL</span>
             </h1>
          </div>

          {/* 副标题 */}
          <p className="max-w-xl text-[10px] md:text-xs text-white/40 leading-[2.5] tracking-[0.3em] uppercase mix-blend-screen">
            A digital nexus exploring the elegant intersection of <span className="text-cyan-400/80 font-bold">Non-linear Dynamics</span>, <span className="text-orange-400/80 font-bold">Astrophysics</span>, and the curvature of Spacetime.
          </p>

          {/* 行动号召按钮 (Call to Action) */}
          <div className="pt-10 pointer-events-auto">
            <Link 
              to="/logs" 
              className="group relative inline-flex items-center gap-6 px-10 py-4 bg-white/[0.02] backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-700 overflow-hidden rounded-sm shadow-2xl"
            >
              {/* 悬停微光背景 */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="relative flex items-center gap-4 text-[10px] tracking-[0.4em] font-bold uppercase text-white/60 group-hover:text-white transition-colors">
                Initialize_Archive
              </div>
              
              <div className="relative w-8 h-8 rounded-full border border-white/10 group-hover:border-white/50 flex items-center justify-center group-hover:bg-white/10 transition-all duration-700 transform group-hover:translate-x-2">
                <ChevronRight size={14} className="text-white/40 group-hover:text-white transition-colors" />
              </div>
            </Link>
          </div>
        </main>

        {/* 底部装饰数据 */}
        <footer className="flex justify-between items-end animate-fade-in-up opacity-60">
          <div className="space-y-2 text-[8px] md:text-[9px] tracking-[0.5em] uppercase text-white/30 font-bold">
            <p className="flex items-center gap-2"><Activity size={10} className="text-orange-500/80" /> DOPPLER_RENDERER_ACTIVE</p>
            <p>EVENT_HORIZON_LOCKED</p>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
             <div className="text-[8px] tracking-[0.5em] text-white/20 uppercase font-bold">Telemetry</div>
             <div className="flex space-x-1">
               <div className="w-1 h-3 bg-white/20" />
               <div className="w-1 h-4 bg-white/20" />
               <div className="w-1 h-2 bg-white/20" />
               <div className="w-1 h-5 bg-cyan-500/60 animate-pulse" />
             </div>
          </div>
        </footer>

      </div>
      
      {/* 补充：自定义入场动画，确保无需外部依赖 */}
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .animate-fade-in-down { animation: fadeInDown 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-up { animation: fadeInUp 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Home;