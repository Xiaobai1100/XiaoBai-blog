import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';
import {
  Lock,
  Unlock,
  Folder,
  BookOpen,
  FileText,
  Search,
  ArrowLeft,
  Download,
  Eye,
  Sparkles,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import LibraryPdfReader from '../components/LibraryPdfReader';
import './PrivateLibrary.css';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// 内存级 PDF 封面缓存，避免重复请求同一本书的第 1 页
const coverDataUrlCache = new Map();

/**
 * 1. 真实 PDF 封面渲染组件 (利用 Range 分片流式截取 PDF 第一页作为立体书封)
 */
const PdfCoverPreview = ({ item }) => {
  const [coverSrc, setCoverSrc] = useState(
    () => coverDataUrlCache.get(item?.id) || item?.coverUrl || item?.thumbnailUrl || ''
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return undefined;

    const cached = coverDataUrlCache.get(item.id);
    if (cached) {
      setCoverSrc(cached);
      setLoading(false);
      return undefined;
    }

    if (item.coverUrl || item.thumbnailUrl) {
      setCoverSrc(item.coverUrl || item.thumbnailUrl);
      setLoading(false);
      return undefined;
    }

    if (!item.isPdf || !item.fileUrl) {
      setCoverSrc('');
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setCoverSrc('');

    const loadingTask = getDocument({
      url: item.fileUrl,
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      wasmUrl: '/pdfjs/wasm/',
      withCredentials: true,
      disableAutoFetch: true,
      disableStream: true,
      rangeChunkSize: 256 * 1024
    });

    loadingTask.promise
      .then((pdfDoc) => pdfDoc.getPage(1))
      .then((page) => {
        if (!active) return;
        const baseVp = page.getViewport({ scale: 1 });
        const targetWidth = 340;
        const scale = targetWidth / baseVp.width;
        const viewport = page.getViewport({ scale });

        const offCanvas = document.createElement('canvas');
        offCanvas.width = Math.floor(viewport.width);
        offCanvas.height = Math.floor(viewport.height);
        const ctx = offCanvas.getContext('2d', { alpha: false });

        return page.render({ canvasContext: ctx, viewport }).promise.then(() => {
          if (!active) return;
          const dataUrl = offCanvas.toDataURL('image/jpeg', 0.86);
          coverDataUrlCache.set(item.id, dataUrl);
          setCoverSrc(dataUrl);
          setLoading(false);
        });
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      loadingTask.destroy();
    };
  }, [item]);

  return (
    <div className="inspector-3d-showcase">
      <div className="showcase-book-3d">
        <div className="showcase-book-spine-side" />
        <div className="showcase-book-pages-edge" />

        {coverSrc ? (
          <img
            src={coverSrc}
            alt={item?.title}
            className="showcase-cover-img"
          />
        ) : (
          <div className="showcase-fallback-cover">
            <div className="text-[9px] font-mono tracking-[0.22em] text-amber-300/80 uppercase">
              {item?.folder}
            </div>
            <div className="font-bold text-sm text-amber-50 leading-snug line-clamp-5 my-auto">
              {item?.title}
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-amber-400/80 border-t border-amber-500/25 pt-2">
              <span>{item?.ext}</span>
              <span>{loading ? 'SCANNING_COVER...' : 'ARCHIVE_VOL'}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="showcase-scan-overlay">
            <div className="showcase-scan-beam" />
            <span>RENDERING_COVER...</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 生成《星际穿越》剧照同款的「五维条纹时间拉伸光板纹理」(Striated Time-Extrusion Texture)
 * 还原参考图中由无数书页与书缝拉长形成的木纹状金黄/香槟白/胡桃木/暗红细密条纹
 */
function createStriatedTimeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#18130b';
  ctx.fillRect(0, 0, 1024, 512);

  // 绘制数百条平行的高精度五维时间细丝 (沿 U 方向无限延伸的条纹)
  let y = 0;
  let seed = 17;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  while (y < 512) {
    const h = 1 + Math.floor(rand() * 5);
    const r = rand();
    if (r > 0.91) {
      // 炽白/香槟金高光书缝光束
      ctx.fillStyle = `rgba(255, 250, 224, ${0.65 + rand() * 0.35})`;
    } else if (r > 0.72) {
      // 橄榄金/暖黄铜条纹
      ctx.fillStyle = `rgba(198, 168, 104, ${0.45 + rand() * 0.35})`;
    } else if (r > 0.45) {
      // 琥珀棕木质拉丝
      ctx.fillStyle = `rgba(112, 84, 44, ${0.5 + rand() * 0.3})`;
    } else if (r > 0.41) {
      // 偶发的暗红/铁锈色时间引力弦 (参考图右侧细节)
      ctx.fillStyle = 'rgba(165, 48, 30, 0.65)';
    } else {
      // 深胡桃木暗部阴影条
      ctx.fillStyle = `rgba(24, 18, 11, ${0.75 + rand() * 0.25})`;
    }
    ctx.fillRect(0, y, 1024, h);
    y += h;
  }

  // 叠加垂直方向的超立方体刻度横节与明暗光晕渐变
  const grad = ctx.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, 'rgba(255, 248, 220, 0.38)');
  grad.addColorStop(0.18, 'rgba(210, 175, 110, 0.08)');
  grad.addColorStop(0.5, 'rgba(10, 8, 5, 0.35)');
  grad.addColorStop(0.82, 'rgba(210, 175, 110, 0.08)');
  grad.addColorStop(1, 'rgba(255, 248, 220, 0.38)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  for (let x = 0; x < 1024; x += 64) {
    ctx.fillStyle = x % 256 === 0 ? 'rgba(255, 245, 210, 0.28)' : 'rgba(0, 0, 0, 0.32)';
    ctx.fillRect(x, 0, 2, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * 生成《星际穿越》「书架背面透光书缝纹理」(Backlit Bookshelf Bay Texture)
 * 还原参考图中每个书架格子里深色的成排书本剪影，以及从书缝间射出的强烈白金光芒
 */
function createBacklitShelfTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 背景为强烈的暖白/香槟金背光光源
  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#fff7dc');
  bg.addColorStop(0.5, '#e8c882');
  bg.addColorStop(1, '#fff5d0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 512);

  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const tiers = 3;
  const tierH = 512 / tiers;

  for (let t = 0; t < tiers; t++) {
    const baseY = (t + 1) * tierH;

    // 每一层书架顶部的暗部遮光檐
    ctx.fillStyle = '#1a130b';
    ctx.fillRect(0, t * tierH, 512, 14);

    // 成排的深色书本剪影，留出狭窄但极其明亮的透光书缝
    let x = 12;
    while (x < 496) {
      const bookW = 14 + Math.floor(rand() * 28);
      const bookH = tierH * (0.62 + rand() * 0.24);
      const gap = rand() > 0.72 ? 5 + Math.floor(rand() * 8) : 1 + Math.floor(rand() * 2);

      // 书本本体剪影 (深胡桃色/炭黑色，带微弱侧面反光)
      ctx.fillStyle = rand() > 0.5 ? '#16110b' : '#211910';
      ctx.fillRect(x, baseY - 12 - bookH, bookW, bookH);

      // 书本顶部微弱受光边
      ctx.fillStyle = 'rgba(235, 205, 145, 0.35)';
      ctx.fillRect(x, baseY - 12 - bookH, bookW, 2);

      x += bookW + gap;
    }

    // 厚实的书架横隔板 + 亮金前缘反光条
    ctx.fillStyle = '#120d07';
    ctx.fillRect(0, baseY - 12, 512, 12);
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(0, baseY - 12, 512, 2);
  }

  // 左右书架立柱边框
  ctx.fillStyle = '#161009';
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(498, 0, 14, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

/**
 * 2. 《星际穿越》五维超立方体 3D 建筑矩阵引擎 (还原 image_5ca167.png 剧照结构)
 */
const TesseractScene3D = ({ stage, onDiveComplete }) => {
  const mountRef = useRef(null);
  const stageRef = useRef(stage);
  const diveCallbackRef = useRef(onDiveComplete);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    diveCallbackRef.current = onDiveComplete;
  }, [onDiveComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x120e09);
    scene.fog = new THREE.FogExp2(0x120e09, 0.0062);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.5,
      420
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 生成程序化五维条纹纹理与背光书架纹理
    const striatedTex = createStriatedTimeTexture();
    const shelfBayTex = createBacklitShelfTexture();

    // 材质 1：五维条纹时间拉伸板材质（自带自发光纹理，无需担心变黑）
    const timeSlabMat = new THREE.MeshBasicMaterial({
      map: striatedTex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide
    });

    // 材质 2：书架背面透光书缝材质
    const shelfBayMat = new THREE.MeshBasicMaterial({
      map: shelfBayTex,
      side: THREE.DoubleSide
    });

    // 材质 3：书架前方的立体深色书群块材质（产生真实的近景书本遮挡视差）
    const bookBlockMat = new THREE.MeshStandardMaterial({
      color: 0x241b11,
      roughness: 0.45,
      metalness: 0.3
    });

    // 材质 4：交界处的炽白/香槟金高光灯带材质（还原参考图中刺眼夺目的白色光缝）
    const lightBarMat = new THREE.MeshBasicMaterial({
      color: 0xfffaed
    });

    // 环境光与跟随摄像机的暖金点光源（照亮近景立体书块与横梁）
    const ambientLight = new THREE.AmbientLight(0xf5e1b5, 1.4);
    scene.add(ambientLight);

    const camLight = new THREE.PointLight(0xfff0c2, 3.5, 140, 1.2);
    scene.add(camLight);

    // 构建无限四维正交书架井道矩阵
    const tesseractWorld = new THREE.Group();
    scene.add(tesseractWorld);

    const CELL = 26;
    const GRID_X = 5; // -2..2
    const GRID_Y = 5; // -2..2
    const GRID_Z = 6; // -3..2
    const maxCells = GRID_X * GRID_Y * GRID_Z;

    // 1. 书架舱背板 InstancedMesh
    const bayGeo = new THREE.BoxGeometry(16, 16, 0.8);
    const bayInst = new THREE.InstancedMesh(bayGeo, shelfBayMat, maxCells * 2);

    // 2. 沿 X / Y / Z 三个正交方向无限延伸的「条纹时间拉伸长板」InstancedMesh
    const slabGeo = new THREE.BoxGeometry(16, 0.35, 24);
    const slabInst = new THREE.InstancedMesh(slabGeo, timeSlabMat, maxCells * 6);

    // 3. 书架内部的 3D 凸出书本群块 InstancedMesh
    const bookClusterGeo = new THREE.BoxGeometry(2.2, 3.8, 3.2);
    const bookClusterInst = new THREE.InstancedMesh(
      bookClusterGeo,
      bookBlockMat,
      maxCells * 8
    );

    // 4. 书架边缘的高亮香槟白光缝条 InstancedMesh
    const lightBarGeo = new THREE.BoxGeometry(15.6, 0.22, 0.45);
    const lightBarInst = new THREE.InstancedMesh(
      lightBarGeo,
      lightBarMat,
      maxCells * 4
    );

    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    let bayCount = 0;
    let slabCount = 0;
    let bookCount = 0;
    let barCount = 0;

    for (let ix = -2; ix <= 2; ix++) {
      for (let iy = -2; iy <= 2; iy++) {
        for (let iz = -3; iz <= 2; iz++) {
          // 留出摄像机所在的中心观测井道
          if (ix === 0 && iy === 0 && Math.abs(iz) <= 1) continue;

          const cx = ix * CELL;
          const cy = iy * CELL;
          const cz = iz * CELL;

          // A. 放置正交方向的背光书架舱 (正面与侧面交错，构成四维立方体迷宫)
          dummy.position.set(cx, cy, cz - 8);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          bayInst.setMatrixAt(bayCount++, dummy.matrix);

          if ((ix + iy + iz) % 2 === 0) {
            dummy.position.set(cx - 8, cy, cz);
            dummy.rotation.set(0, Math.PI * 0.5, 0);
            dummy.updateMatrix();
            bayInst.setMatrixAt(bayCount++, dummy.matrix);
          }

          // B. 从书架每一层向外垂直延伸的「条纹时间拉伸光板」(复刻参考图最核心的条纹长廊结构)
          for (let tier = -1; tier <= 1; tier++) {
            const ty = cy + tier * 5.2;

            // 水平方向延伸的条纹时间板
            dummy.position.set(cx, ty, cz);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            tint.setHSL(0.1 + ((ix + tier) % 3) * 0.012, 0.35, 0.72 + (tier + 1) * 0.08);
            slabInst.setMatrixAt(slabCount, dummy.matrix);
            slabInst.setColorAt(slabCount, tint);
            slabCount++;

            // 垂直方向正交延伸的条纹时间墙
            dummy.position.set(cx + tier * 5.2, cy, cz);
            dummy.rotation.set(0, 0, Math.PI * 0.5);
            dummy.updateMatrix();
            slabInst.setMatrixAt(slabCount, dummy.matrix);
            slabInst.setColorAt(slabCount, tint);
            slabCount++;

            // 书架隔板前缘的高亮香槟白光条
            dummy.position.set(cx, ty + 0.25, cz - 7.4);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            lightBarInst.setMatrixAt(barCount++, dummy.matrix);
          }

          // C. 在书架格子里排布凸出的 3D 深色书块（形成前景深色书脊、后景明亮光缝的强烈对比）
          for (let b = 0; b < 6; b++) {
            const tier = (b % 3) - 1;
            const bx = cx - 5.8 + ((b * 3.1 + Math.abs(iz) * 1.7) % 11.6);
            const by = cy + tier * 5.2 + 2.1;
            const bz = cz - 6.6;

            dummy.position.set(bx, by, bz);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(
              0.7 + ((b + ix) % 3) * 0.35,
              0.85 + ((b + iy) % 2) * 0.2,
              1 + (b % 2) * 0.4
            );
            dummy.updateMatrix();
            bookClusterInst.setMatrixAt(bookCount++, dummy.matrix);
          }
        }
      }
    }

    bayInst.count = bayCount;
    slabInst.count = slabCount;
    bookClusterInst.count = bookCount;
    lightBarInst.count = barCount;

    bayInst.instanceMatrix.needsUpdate = true;
    slabInst.instanceMatrix.needsUpdate = true;
    if (slabInst.instanceColor) slabInst.instanceColor.needsUpdate = true;
    bookClusterInst.instanceMatrix.needsUpdate = true;
    lightBarInst.instanceMatrix.needsUpdate = true;

    tesseractWorld.add(bayInst);
    tesseractWorld.add(slabInst);
    tesseractWorld.add(bookClusterInst);
    tesseractWorld.add(lightBarInst);

    // D. 贯穿五维空间的金色引力世界线细丝
    const linePts = [];
    const SPAN = CELL * 3;
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const u = i * (CELL * 0.33);
        const v = j * (CELL * 0.33);
        linePts.push(-SPAN, u, v, SPAN, u, v);
        linePts.push(u, -SPAN, v, u, SPAN, v);
        linePts.push(u, v, -SPAN, u, v, SPAN);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xe6cf9c,
      transparent: true,
      opacity: 0.28
    });
    tesseractWorld.add(new THREE.LineSegments(lineGeo, lineMat));

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouseMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onResize);

    let animId;
    let diveProgress = 0;
    let diveCompleted = false;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // 让条纹时间纹理缓慢流动，产生时间维度的光影呼吸感
      striatedTex.offset.x = elapsed * 0.03;

      const currentStage = stageRef.current;

      if (currentStage === 'locked') {
        diveProgress = 0;
        diveCompleted = false;

        // 阶段一：复刻《星际穿越》剧照 (image_5ca167.png) 的对角俯仰透视与多维轨道漂移运镜
        const camX = 11 + Math.sin(elapsed * 0.24) * 8 + mouse.x * 7;
        const camY = 9 + Math.cos(elapsed * 0.19) * 6 - mouse.y * 6;
        const camZ = 14 + Math.sin(elapsed * 0.15) * 9;

        camera.position.set(camX, camY, camZ);
        camLight.position.set(camX, camY, camZ + 4);

        // 视线斜向穿过层层叠叠的书架井道与条纹时间板
        const lookX = -8 + Math.cos(elapsed * 0.16) * 6 - mouse.x * 4;
        const lookY = -6 + Math.sin(elapsed * 0.14) * 5 + mouse.y * 4;
        const lookZ = -28 + Math.cos(elapsed * 0.12) * 8;

        // 35° 斜角倾侧 (完美对齐参考图中的对角线超立方体构图)
        const roll = -0.56 + Math.sin(elapsed * 0.18) * 0.08;
        camera.up.set(Math.sin(roll), Math.cos(roll), 0.12).normalize();
        camera.lookAt(lookX, lookY, lookZ);
      } else if (currentStage === 'diving') {
        // 阶段二：输入密码解锁瞬间 —— 摄像机从五维对角倾侧平滑回正，并推入正前方的书架舱室
        diveProgress = Math.min(1, diveProgress + dt * 0.55);
        const ease =
          diveProgress < 0.5
            ? 4 * diveProgress * diveProgress * diveProgress
            : 1 - Math.pow(-2 * diveProgress + 2, 3) / 2;

        striatedTex.offset.x += dt * 0.8 * Math.sin(diveProgress * Math.PI);

        const camX = THREE.MathUtils.lerp(11, 0, ease);
        const camY = THREE.MathUtils.lerp(9, 0, ease);
        const camZ = THREE.MathUtils.lerp(14, 6, ease);
        camera.position.set(camX, camY, camZ);
        camLight.position.set(camX, camY, camZ + 4);

        const roll = THREE.MathUtils.lerp(-0.56, 0, ease);
        camera.up.set(Math.sin(roll), Math.cos(roll), 0).normalize();
        camera.lookAt(
          THREE.MathUtils.lerp(-8, 0, ease),
          THREE.MathUtils.lerp(-6, 0, ease),
          -32
        );

        if (diveProgress >= 0.98 && !diveCompleted) {
          diveCompleted = true;
          if (diveCallbackRef.current) diveCallbackRef.current();
        }
      } else {
        // 阶段三：进入书架内部，五维环境保持柔和视差响应
        camera.position.set(mouse.x * 3.5, -mouse.y * 2.5, 6);
        camLight.position.set(mouse.x * 3.5, -mouse.y * 2.5, 10);
        camera.up.set(0, 1, 0);
        camera.lookAt(mouse.x * 1.5, -mouse.y * 1.2, -32);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      striatedTex.dispose();
      shelfBayTex.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="tesseract-webgl-stage" />;
};

/**
 * 3. 精准解析 `/api/library-index` 中的全部 60 本 PDF
 */
function normalizeLibraryData(payload) {
  if (!payload) return { items: [], folders: [], notes: [] };

  const rawFiles = [];
  const folderSet = new Set();

  const extractFromTree = (nodes, parentFolder = '') => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (!node || typeof node !== 'object') return;
      const children =
        node.items || node.files || node.books || node.children || node.entries;
      if (Array.isArray(children)) {
        const nextFolder =
          node.path || node.name || node.title || node.folder || parentFolder;
        if (nextFolder) folderSet.add(nextFolder);
        extractFromTree(children, nextFolder);
        return;
      }
      if (
        node.type === 'folder' ||
        node.type === 'directory' ||
        node.isDirectory === true ||
        (typeof node.count === 'number' &&
          !node.fileUrl &&
          !node.extension &&
          !node.format)
      ) {
        const dirName = node.path || node.name || node.title;
        if (dirName) folderSet.add(dirName);
        return;
      }
      rawFiles.push({ ...node, _inferredFolder: parentFolder });
    });
  };

  const primaryArray =
    (Array.isArray(payload) && payload) ||
    payload.items ||
    payload.books ||
    payload.files ||
    payload.documents ||
    payload.entries ||
    payload.catalog?.items ||
    payload.catalog?.books ||
    payload.catalog?.files ||
    payload.data?.items ||
    null;

  if (Array.isArray(primaryArray) && primaryArray.length > 0) {
    extractFromTree(primaryArray);
  } else {
    extractFromTree(
      payload.tree || payload.catalog?.tree || payload.folders || payload.categories
    );
  }

  const explicitFolders =
    payload.folders || payload.categories || payload.catalog?.folders || [];
  if (Array.isArray(explicitFolders)) {
    explicitFolders.forEach((f) => {
      const name = typeof f === 'string' ? f : f?.path || f?.name || f?.title;
      if (name) folderSet.add(name);
    });
  }

  const seen = new Set();
  const items = [];

  rawFiles.forEach((raw, idx) => {
    const rawPath =
      raw.path ||
      raw.relativePath ||
      raw.filePath ||
      raw.blobPath ||
      raw.key ||
      raw.id ||
      raw.name ||
      '';
    const dedupeKey = raw.id || rawPath || `${raw.title}-${idx}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const parts = String(rawPath).split('/').filter(Boolean);
    const fileName =
      raw.fileName ||
      raw.name ||
      parts[parts.length - 1] ||
      raw.title ||
      `Volume_${idx + 1}`;
    const inferredFolder =
      raw.folder ||
      raw.folderPath ||
      raw.category ||
      raw.collection ||
      raw._inferredFolder ||
      (parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'GENERAL');

    if (inferredFolder) folderSet.add(inferredFolder);

    const ext = (
      raw.extension ||
      raw.format ||
      (fileName.includes('.') ? fileName.split('.').pop() : 'pdf')
    )
      .replace(/^\./, '')
      .toUpperCase();

    const encodedPath = encodeURIComponent(rawPath || fileName);
    const encodedId = encodeURIComponent(raw.id || rawPath || fileName);
    const fileUrl =
      raw.fileUrl ||
      raw.streamUrl ||
      raw.readUrl ||
      raw.url ||
      `/api/library-file?path=${encodedPath}&id=${encodedId}`;
    const downloadUrl =
      raw.downloadUrl ||
      `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=1`;

    items.push({
      id: raw.id || rawPath || `item-${idx}`,
      title: (raw.title || fileName.replace(/\.[^/.]+$/, '')).replace(/_/g, ' '),
      rawName: fileName,
      path: rawPath,
      folder: inferredFolder,
      ext,
      size: raw.size || raw.sizeBytes || raw.fileSize || 0,
      sizeLabel: raw.sizeLabel || '',
      updatedAt: raw.updatedAt || raw.mtime || raw.date || '',
      note: raw.note || raw.notes || raw.description || raw.summary || '',
      coverUrl: raw.coverUrl || raw.thumbnailUrl || '',
      fileUrl,
      downloadUrl,
      isPdf: ext === 'PDF' || raw.readable === true
    });
  });

  return {
    items,
    folders: Array.from(folderSet),
    notes: Array.isArray(payload.notes) ? payload.notes : []
  };
}

function formatBytes(bytes, sizeLabel) {
  if (sizeLabel) return sizeLabel;
  if (!bytes || Number.isNaN(Number(bytes))) return 'PDF_VOLUME';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getBookVisuals(book, idx) {
  const str = `${book.title || ''}-${idx}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const tones = ['mahogany', 'obsidian', 'navy', 'emerald', 'ochre', 'slate'];
  const tone = tones[hash % tones.length];
  const height = 205 + (hash % 32);
  const width = 44 + ((hash >> 3) % 14);
  const callNum = `${String.fromCharCode(65 + (hash % 18))}${100 + (hash % 899)}`;
  return { tone, height, width, callNum };
}

// 浏览器端 PBKDF2 密码校验（兼容 gpx82068206）
async function verifyClientSideCipher(inputPassword) {
  const clean = inputPassword.trim();
  if (clean === 'gpx82068206') return true;
  try {
    if (!window.crypto?.subtle) return false;
    const saltStr = '5q4DdvfExgLsnbKrso59QCXI';
    const targetB64 = 'WNUKDKvxUP0Bwu3sriGBmKzH3t0IPPWNgISmNvrgbqE';
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(clean),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltStr),
        iterations: 210000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    const bytes = new Uint8Array(derivedBits);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    const b64 = btoa(binary).replace(/=+$/, '');
    return b64 === targetB64.replace(/=+$/, '');
  } catch {
    return false;
  }
}

export default function PrivateLibrary() {
  const [stage, setStage] = useState('locked'); // 'locked' | 'diving' | 'inside'
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [catalog, setCatalog] = useState({ items: [], folders: [], notes: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [booksPerShelf, setBooksPerShelf] = useState(10);

  useEffect(() => {
    const updateShelfCapacity = () => {
      const w = window.innerWidth;
      if (w < 640) setBooksPerShelf(5);
      else if (w < 960) setBooksPerShelf(7);
      else if (w < 1280) setBooksPerShelf(9);
      else setBooksPerShelf(11);
    };
    updateShelfCapacity();
    window.addEventListener('resize', updateShelfCapacity);
    return () => window.removeEventListener('resize', updateShelfCapacity);
  }, []);

  const fetchRealCatalog = async (autoEnterIfUnlocked = false) => {
    setLoadingCatalog(true);
    setSyncNotice('');
    try {
      const res = await fetch('/api/library-index', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeLibraryData(data);
        setCatalog(normalized);
        if (normalized.items.length > 0) {
          setSelectedBook((prev) => prev || normalized.items[0]);
        } else {
          setSyncNotice('已连接书库接口，但当前返回的书籍列表为空 (0 volumes)。');
        }
        if (autoEnterIfUnlocked) {
          setStage('inside');
        }
        return normalized;
      }

      if (res.status !== 401 && res.status !== 403) {
        setSyncNotice(`书库索引接口返回状态 HTTP ${res.status}，请点击右上角重试同步。`);
      }
    } catch {
      setSyncNotice(
        '当前环境未检测到 /api/library-index 响应（本地调试请使用 vercel dev 启动，或部署至 Vercel 线上以加载全部 60 本 PDF）。'
      );
    } finally {
      setLoadingCatalog(false);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    fetchRealCatalog(true).finally(() => {
      if (mounted) setCheckingAuth(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    setCheckingAuth(true);

    try {
      const cleanPassword = password.trim();
      let apiUnlocked = false;

      try {
        const res = await fetch('/api/library-auth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unlock',
            password: cleanPassword,
            passcode: cleanPassword
          })
        });
        if (res.ok) apiUnlocked = true;
      } catch {
        // ignore
      }

      const clientVerified = await verifyClientSideCipher(cleanPassword);

      if (!apiUnlocked && !clientVerified) {
        throw new Error('ACCESS_DENIED: 密钥不匹配，请输入正确的书架密钥');
      }

      setPassword('');
      await fetchRealCatalog(false);
      setStage('diving');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLock = async () => {
    try {
      await fetch('/api/library-auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lock' })
      });
    } catch {
      // ignore
    }
    setStage('locked');
    setReadingBook(null);
  };

  const filteredBooks = useMemo(() => {
    return catalog.items.filter((item) => {
      const matchFolder =
        selectedFolder === 'ALL' ||
        item.folder === selectedFolder ||
        item.folder.startsWith(selectedFolder);
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.rawName.toLowerCase().includes(q) ||
        item.folder.toLowerCase().includes(q);
      return matchFolder && matchQuery;
    });
  }, [catalog.items, selectedFolder, searchQuery]);

  const shelfBays = useMemo(() => {
    const bays = [];
    for (let i = 0; i < filteredBooks.length; i += booksPerShelf) {
      const slice = filteredBooks.slice(i, i + booksPerShelf);
      const primarySector = slice[0]?.folder || 'ARCHIVE';
      bays.push({
        tierNumber: bays.length + 1,
        sectorLabel: primarySector,
        books: slice
      });
    }
    return bays;
  }, [filteredBooks, booksPerShelf]);

  if (readingBook) {
    return (
      <div className="tesseract-root">
        <TesseractScene3D stage="inside" />
        <LibraryPdfReader item={readingBook} onClose={() => setReadingBook(null)} />
      </div>
    );
  }

  return (
    <div className="tesseract-root">
      {/* 底层：Three.js《星际穿越》五维超立方体条纹时间拉伸长廊与透光书架矩阵 */}
      <TesseractScene3D
        stage={stage}
        onDiveComplete={() => setStage('inside')}
      />

      {/* 阶段一：五维超立方体对角巡航 + 中央悬浮密钥舱 */}
      {stage === 'locked' && (
        <div className="tesseract-auth-overlay">
          <form onSubmit={handleUnlock} className="tesseract-auth-box">
            <div className="tesseract-auth-corner tl" />
            <div className="tesseract-auth-corner tr" />
            <div className="tesseract-auth-corner bl" />
            <div className="tesseract-auth-corner br" />

            <div className="flex items-center justify-between text-amber-300/90 text-[10px] tracking-[0.35em] uppercase mb-3">
              <span className="flex items-center gap-2">
                <Lock size={13} /> 5D_TESSERACT_ARCHIVE
              </span>
              <Link to="/" className="text-amber-200/50 hover:text-amber-200 transition-colors">
                [ESC]
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase mb-2">
              THE TESSERACT
            </h1>
            <p className="text-xs text-amber-100/65 font-mono leading-relaxed mb-6">
              Every book and every gap on the shelf is stretched across time into five-dimensional light. Enter your key to enter the bookshelf.
            </p>

            <div className="relative mb-5">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER_GRAVITY_KEY..."
                autoFocus
                className="tesseract-input"
              />
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400/50" size={15} />
            </div>

            {authError && (
              <div className="mb-5 p-3 border border-red-500/40 bg-red-950/60 text-red-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <button type="submit" disabled={checkingAuth} className="tesseract-submit-btn">
              {checkingAuth ? 'ALIGNING_MANIFOLD...' : 'ENTER_TESSERACT'}
            </button>
          </form>
        </div>
      )}

      {/* 阶段二：三维旋转回正与穿廊过渡 HUD */}
      {stage === 'diving' && (
        <div className="tesseract-diving-hud">
          <div className="diving-reticle" />
          <span>FOLDING 5D LIGHT-PLANES INTO BOOKSHELF CHAMBER...</span>
        </div>
      )}

      {/* 阶段三：进入书架内部 —— 整齐展示全部 60 本 PDF 与右侧真实 PDF 封面 */}
      {stage === 'inside' && (
        <div className="tesseract-inside-stage animate-tesseract-enter">
          <div className="tesseract-inside-grid">
            {/* 左侧主舱：可顺畅上下滚动的多层背光实木/黄铜书柜 */}
            <main className="tesseract-chamber">
              <div className="tesseract-bookcase-frame">
                <div className="bookcase-cornice">
                  <div className="flex items-center gap-3">
                    <span>MURPH_BOOKSHELF // 5D_ARCHIVE_CHAMBER</span>
                    <span className="text-amber-400/60">|</span>
                    <span className="text-amber-200">
                      SHOWING {filteredBooks.length} / {catalog.items.length} VOLUMES
                    </span>
                  </div>
                  <button
                    onClick={() => fetchRealCatalog(false)}
                    className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors"
                    title="Reload Library Index"
                  >
                    <RefreshCw size={12} className={loadingCatalog ? 'animate-spin' : ''} />
                    <span>SYNC_INDEX</span>
                  </button>
                </div>

                {loadingCatalog && catalog.items.length === 0 ? (
                  <div className="tesseract-empty-state">
                    <div className="tesseract-spinner" />
                    <p>SYNCHRONIZING LIBRARY VOLUMES...</p>
                  </div>
                ) : shelfBays.length === 0 ? (
                  <div className="tesseract-empty-state">
                    <p className="text-center max-w-lg leading-relaxed">
                      {syncNotice || '当前筛选条件下没有匹配的 PDF 藏书。'}
                    </p>
                    <div className="flex gap-3 mt-4">
                      {selectedFolder !== 'ALL' && (
                        <button
                          onClick={() => setSelectedFolder('ALL')}
                          className="tesseract-secondary-btn"
                        >
                          SHOW_ALL_VOLUMES
                        </button>
                      )}
                      <button
                        onClick={() => fetchRealCatalog(false)}
                        className="tesseract-primary-btn"
                      >
                        <RefreshCw size={13} />
                        <span>RETRY_FETCH</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  shelfBays.map((bay) => (
                    <div key={bay.tierNumber} className="tesseract-shelf-bay">
                      <div className="shelf-back-slits" />
                      <div className="shelf-top-downlight" />

                      <div className="shelf-books-row">
                        {bay.books.map((book, idx) => {
                          const isSelected = selectedBook?.id === book.id;
                          const { tone, height, width, callNum } = getBookVisuals(
                            book,
                            (bay.tierNumber - 1) * booksPerShelf + idx
                          );

                          return (
                            <div
                              key={book.id}
                              onClick={() => setSelectedBook(book)}
                              onDoubleClick={() => book.isPdf && setReadingBook(book)}
                              style={{
                                height: `${height}px`,
                                width: `${width}px`
                              }}
                              className={`book-3d-volume spine-tone-${tone} ${
                                isSelected ? 'is-selected' : ''
                              }`}
                              title={`${book.title}\n分类: ${book.folder}\n(单击右侧预览真实封面，双击直接打开阅读)`}
                            >
                              <div className="book-top-pages" />
                              <div className="book-right-pages" />

                              <div className="book-spine-face">
                                <div className="spine-gold-rib" />
                                <div className="spine-gold-rib thin" />

                                <div className="spine-title-container">
                                  <span className="spine-vertical-title">{book.title}</span>
                                </div>

                                <div className="spine-gold-rib thin" />
                                <span className="spine-call-number">{callNum}</span>
                                <span className="spine-format-tag">{book.ext}</span>
                                <div className="spine-gold-rib" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="shelf-3d-plank">
                        <div className="plank-top-surface" />
                        <div className="plank-front-edge">
                          <span>
                            TIER_0{bay.tierNumber} // {bay.sectorLabel}
                          </span>
                          <span className="plank-brass-strip" />
                          <span>{bay.books.length} VOLS</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </main>

            {/* 右侧：真实 PDF 第一页封面检视台 */}
            {selectedBook && (
              <aside className="tesseract-inspector">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-4">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-amber-400 uppercase">
                    VOLUME_COVER_INSPECTOR
                  </span>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>

                <PdfCoverPreview item={selectedBook} />

                <h2 className="text-sm font-bold text-amber-50 leading-snug mb-4 line-clamp-2">
                  {selectedBook.title}
                </h2>

                <div className="space-y-2.5 text-xs font-mono mb-5">
                  <div className="inspector-meta-row">
                    <span className="label">FILE</span>
                    <span className="value text-white">{selectedBook.rawName}</span>
                  </div>
                  <div className="inspector-meta-row">
                    <span className="label">SECTOR</span>
                    <span className="value text-amber-300">{selectedBook.folder}</span>
                  </div>
                  <div className="inspector-meta-row">
                    <span className="label">SIZE</span>
                    <span className="value">
                      {formatBytes(selectedBook.size, selectedBook.sizeLabel)}
                    </span>
                  </div>
                </div>

                {selectedBook.note && (
                  <div className="inspector-note-box mb-5">
                    <div className="text-[10px] text-amber-400/80 tracking-widest uppercase mb-1.5 flex items-center gap-1.5">
                      <FileText size={12} />
                      <span>NOTES</span>
                    </div>
                    <p className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap">
                      {selectedBook.note}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-4 space-y-2.5">
                  {selectedBook.isPdf && (
                    <button
                      onClick={() => setReadingBook(selectedBook)}
                      className="tesseract-primary-btn w-full"
                    >
                      <Eye size={15} />
                      <span>READ_VOLUME</span>
                      <ChevronRight className="ml-auto" size={14} />
                    </button>
                  )}

                  <a
                    href={selectedBook.downloadUrl}
                    className="tesseract-secondary-btn w-full"
                  >
                    <Download size={14} />
                    <span>DOWNLOAD ({selectedBook.ext})</span>
                  </a>
                </div>
              </aside>
            )}
          </div>

          {/* 底部悬浮分类与检索舱 */}
          <footer className="tesseract-floating-dock">
            <Link to="/" className="dock-btn" title="Return Home">
              <ArrowLeft size={14} />
              <span>HOME</span>
            </Link>

            <div className="dock-divider" />

            <div className="dock-folders">
              <button
                onClick={() => setSelectedFolder('ALL')}
                className={`dock-pill ${selectedFolder === 'ALL' ? 'active' : ''}`}
              >
                <BookOpen size={12} />
                <span>ALL ({catalog.items.length})</span>
              </button>
              {catalog.folders.map((folder) => {
                const count = catalog.items.filter(
                  (i) => i.folder === folder || i.folder.startsWith(folder)
                ).length;
                return (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`dock-pill ${selectedFolder === folder ? 'active' : ''}`}
                  >
                    <Folder size={12} />
                    <span>
                      {folder} ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="dock-divider" />

            <div className="dock-search">
              <Search size={13} className="text-amber-400/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH_60_VOLS..."
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white/40 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button onClick={handleLock} className="dock-btn" title="Return to 5D Tesseract">
              <Unlock size={13} />
              <span>TESSERACT</span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}