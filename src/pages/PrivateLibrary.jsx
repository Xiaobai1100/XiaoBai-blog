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
  EyeOff,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Zap,
  Radio,
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
 * 纹理 A：复古皮革烫金书脊纹理
 */
function createBookSpineCanvas() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 512;
  const ctx = c.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, '#140b06');
  grad.addColorStop(0.3, '#321b0f');
  grad.addColorStop(0.7, '#27140b');
  grad.addColorStop(1, '#0d0704');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 512);

  ctx.fillStyle = 'rgba(218, 168, 70, 0.78)';
  ctx.fillRect(14, 38, 100, 4);
  ctx.fillRect(14, 48, 100, 2);
  ctx.fillRect(14, 460, 100, 2);
  ctx.fillRect(14, 470, 100, 4);

  for (let y = 140; y < 320; y += 24) {
    ctx.fillStyle = 'rgba(218, 168, 70, 0.38)';
    ctx.fillRect(30, y, 68, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * 纹理 B：柔和圆形径向辉光微粒纹理（中心高光向外平滑衰减至完全透明）
 */
function createFineDustGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
  grad.addColorStop(0, 'rgba(255, 248, 220, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 200, 95, 0.82)');
  grad.addColorStop(0.48, 'rgba(220, 135, 38, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 2. 《星际穿越》五维时空书架 3D 引擎（全居中防跑偏 + 鼠标扫掠拨弦 + 精细微尘）
 */
const TesseractScene3D = ({
  stage,
  cameraMode,
  dustBinaryMode,
  pluckSignal,
  morseSignal,
  onDiveComplete
}) => {
  const mountRef = useRef(null);
  const stageRef = useRef(stage);
  const cameraModeRef = useRef(cameraMode);
  const dustBinaryRef = useRef(dustBinaryMode);
  const diveCallbackRef = useRef(onDiveComplete);
  const sceneTriggerRef = useRef({ pluck: null, morse: null });

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    dustBinaryRef.current = dustBinaryMode;
  }, [dustBinaryMode]);

  useEffect(() => {
    diveCallbackRef.current = onDiveComplete;
  }, [onDiveComplete]);

  useEffect(() => {
    if (pluckSignal > 0 && sceneTriggerRef.current.pluck) {
      sceneTriggerRef.current.pluck();
    }
  }, [pluckSignal]);

  useEffect(() => {
    if (morseSignal > 0 && sceneTriggerRef.current.morse) {
      sceneTriggerRef.current.morse();
    }
  }, [morseSignal]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040609);
    scene.fog = new THREE.FogExp2(0x040609, 0.012);

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      160
    );
    // 初始机位严格居中于五维书架走廊中央，绝不偏斜出界
    camera.position.set(0, 0.6, 16.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- 灯光系统 ---
    const ambientLight = new THREE.AmbientLight(0x1e2638, 0.9);
    scene.add(ambientLight);

    const murphCoreLight = new THREE.PointLight(0xff9d36, 4.5, 58, 1.1);
    murphCoreLight.position.set(0, 0, 3);
    scene.add(murphCoreLight);

    const backLight = new THREE.DirectionalLight(0xffaa44, 1.4);
    backLight.position.set(0, 5, -24);
    scene.add(backLight);

    const rimLight = new THREE.DirectionalLight(0x4488bb, 0.65);
    rimLight.position.set(-10, -5, 10);
    scene.add(rimLight);

    const bookSpineTexture = createBookSpineCanvas();
    const glowSpriteTexture = createFineDustGlowTexture();

    // --- 材质定义 ---
    const woodMetalMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c120c,
      roughness: 0.55,
      metalness: 0.35
    });

    const bookBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: bookSpineTexture,
      roughness: 0.55,
      metalness: 0.2
    });

    const slatLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffb85c,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending
    });

    const junctionRimMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe49e,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const bookColors = [
      new THREE.Color(0x5a1820),
      new THREE.Color(0x182436),
      new THREE.Color(0x1a2e20),
      new THREE.Color(0x6b4724),
      new THREE.Color(0x8a6232),
      new THREE.Color(0xa67c38),
      new THREE.Color(0x2d1810)
    ];

    const bookMaterials = bookColors.map((col) => {
      const m = bookBaseMaterial.clone();
      m.color = col;
      return m;
    });

    // --- 构建全包围对称五维书架阵列 (x: -2..2, y: -2..2, z: -3..1) ---
    const tesseractGroup = new THREE.Group();
    scene.add(tesseractGroup);

    const interactiveBooks = [];

    const UNIT_W = 8.8;
    const UNIT_H = 6.8;
    const UNIT_D = 8.5;

    const frameThick = 0.22;
    const shelfDepth = 1.65;
    const shelfWidth = 7.4;
    const shelfHeight = 5.4;

    const topGeom = new THREE.BoxGeometry(shelfWidth, frameThick, shelfDepth);
    const sideGeom = new THREE.BoxGeometry(frameThick, shelfHeight, shelfDepth);
    const slatGeom = new THREE.PlaneGeometry(shelfWidth * 0.98, 0.08);
    const edgeRimGeom = new THREE.BoxGeometry(shelfWidth * 0.99, 0.025, 0.03);

    const louverCount = 12;
    const louverH = shelfHeight / louverCount;
    const louverGeom = new THREE.BoxGeometry(shelfWidth * 0.96, louverH * 0.52, 0.04);

    let randSeed = 1337;
    const nextRand = () => {
      randSeed = (randSeed * 16807) % 2147483647;
      return (randSeed - 1) / 2147483646;
    };

    function createBookshelfUnit(xOffset, yOffset, zOffset, isHero = false, detailedBooks = true) {
      const unit = new THREE.Group();
      unit.position.set(xOffset, yOffset, zOffset);

      // 1. 书柜外框与中央立柱（移除了之前产生小方块的 cornerNodeGeom）
      const topMesh = new THREE.Mesh(topGeom, woodMetalMaterial);
      topMesh.position.set(0, shelfHeight / 2, 0);
      unit.add(topMesh);

      const bottomMesh = new THREE.Mesh(topGeom, woodMetalMaterial);
      bottomMesh.position.set(0, -shelfHeight / 2, 0);
      unit.add(bottomMesh);

      const leftMesh = new THREE.Mesh(sideGeom, woodMetalMaterial);
      leftMesh.position.set(-shelfWidth / 2, 0, 0);
      unit.add(leftMesh);

      const rightMesh = new THREE.Mesh(sideGeom, woodMetalMaterial);
      rightMesh.position.set(shelfWidth / 2, 0, 0);
      unit.add(rightMesh);

      const midMesh = new THREE.Mesh(sideGeom, woodMetalMaterial);
      midMesh.position.set(0, 0, 0);
      unit.add(midMesh);

      // 2. 三层水平书架隔板、透光狭缝与立体书本
      const numTiers = 3;
      const tierHeight = shelfHeight / (numTiers + 1);

      for (let t = 1; t <= numTiers; t++) {
        const yPos = -shelfHeight / 2 + t * tierHeight;
        const shelfMesh = new THREE.Mesh(topGeom, woodMetalMaterial);
        shelfMesh.position.set(0, yPos, 0);
        unit.add(shelfMesh);

        // 隔板交汇前缘的纤细金线
        const rimMesh = new THREE.Mesh(edgeRimGeom, junctionRimMaterial);
        rimMesh.position.set(0, yPos + frameThick * 0.5, shelfDepth * 0.49);
        unit.add(rimMesh);

        // 书架后方透射出的暖金光缝
        const slatMesh = new THREE.Mesh(slatGeom, slatLightMaterial);
        slatMesh.position.set(0, yPos + 0.15, -shelfDepth * 0.45);
        unit.add(slatMesh);

        // 排布实体书本
        [-shelfWidth * 0.25, shelfWidth * 0.25].forEach((sectionX) => {
          const sectionWidth = shelfWidth * 0.42;
          let currentX = sectionX - sectionWidth / 2 + 0.2;
          const maxX = sectionX + sectionWidth / 2 - 0.2;
          const stepBoost = detailedBooks ? 1.0 : 1.8;

          while (currentX < maxX) {
            const bookW = (0.14 + nextRand() * 0.15) * stepBoost;
            const bookH = tierHeight * (0.64 + nextRand() * 0.28);
            const bookD = shelfDepth * (0.55 + nextRand() * 0.32);

            const bGeom = new THREE.BoxGeometry(bookW, bookH, bookD);
            const bMat = bookMaterials[Math.floor(nextRand() * bookMaterials.length)];
            const bMesh = new THREE.Mesh(bGeom, bMat);

            const defaultZ = -shelfDepth * 0.08 + (nextRand() - 0.5) * 0.14;
            bMesh.position.set(
              currentX + bookW / 2,
              yPos + bookH / 2 + frameThick / 2,
              defaultZ
            );

            if (nextRand() < 0.16) {
              bMesh.rotation.z = (nextRand() - 0.5) * 0.1;
            }

            unit.add(bMesh);

            if (detailedBooks && (isHero || nextRand() < 0.35)) {
              const worldPos = new THREE.Vector3(
                xOffset + bMesh.position.x,
                yOffset + bMesh.position.y,
                zOffset + defaultZ
              );
              interactiveBooks.push({
                mesh: bMesh,
                worldPos,
                baseZ: defaultZ,
                currentZ: defaultZ,
                pushVelocity: 0,
                tilt: bMesh.rotation.z
              });
            }

            currentX += bookW + 0.025 + nextRand() * 0.03;
          }
        });
      }

      // 3. 书架背面的百叶窗格 (Venetian Louvers)
      for (let l = 0; l < louverCount; l++) {
        const ly = -shelfHeight / 2 + (l + 0.5) * louverH;
        const lMesh = new THREE.Mesh(louverGeom, woodMetalMaterial);
        lMesh.position.set(0, ly, -shelfDepth * 0.49);
        lMesh.rotation.x = 0.35;
        unit.add(lMesh);
      }

      tesseractGroup.add(unit);
    }

    // 生成 5×5×5 全对称五维书架矩阵，彻底填满视野四周
    for (let z = -3; z <= 1; z++) {
      for (let x = -2; x <= 2; x++) {
        for (let y = -2; y <= 2; y++) {
          // 仅留出正中央摄像机所在的观测走廊 (x=0, y=0, z>=0)
          if (x === 0 && y === 0 && z >= 0) continue;
          const isNearCore = Math.abs(x) <= 1 && Math.abs(y) <= 1 && z >= -2;
          const isHero = x === 0 && y === 0 && z === -1;
          createBookshelfUnit(
            x * UNIT_W,
            y * UNIT_H,
            z * UNIT_D,
            isHero,
            isNearCore
          );
        }
      }
    }

    // --- 5D 重力琴弦系统 (Gravitational Strings：居中加密，鼠标扫过实时拨动) ---
    const stringGroup = new THREE.Group();
    scene.add(stringGroup);

    const numStringsZ = 36;
    const numStringsY = 28;
    const filamentSegments = 60;
    const stringLength = 68;
    const stringData = [];

    for (let i = 0; i < numStringsZ; i++) {
      const gx = (nextRand() - 0.5) * 28;
      const gy = (nextRand() - 0.5) * 22;

      const points = [];
      for (let s = 0; s <= filamentSegments; s++) {
        const z = -stringLength / 2 + (s / filamentSegments) * stringLength;
        points.push(new THREE.Vector3(gx, gy, z));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geom, mat);
      stringGroup.add(line);

      stringData.push({
        axis: 'z',
        fixedX: gx,
        fixedY: gy,
        line,
        mat,
        basePoints: points.map((p) => p.clone()),
        vibration: 0,
        pluckCenterIdx: 30,
        vibeSpeed: 10 + nextRand() * 8,
        phase: nextRand() * Math.PI * 2
      });
    }

    for (let i = 0; i < numStringsY; i++) {
      const gx = (nextRand() - 0.5) * 26;
      const gz = -18 + nextRand() * 32;

      const points = [];
      for (let s = 0; s <= filamentSegments; s++) {
        const y = -stringLength / 2 + (s / filamentSegments) * stringLength;
        points.push(new THREE.Vector3(gx, y, gz));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({
        color: 0xffb855,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending
      });
      const line = new THREE.Line(geom, mat);
      stringGroup.add(line);

      stringData.push({
        axis: 'y',
        fixedX: gx,
        fixedZ: gz,
        line,
        mat,
        basePoints: points.map((p) => p.clone()),
        vibration: 0,
        pluckCenterIdx: 30,
        vibeSpeed: 10 + nextRand() * 8,
        phase: nextRand() * Math.PI * 2
      });
    }

    // --- 精细化零重力漂浮微尘 (圆形径向发光纹理，绝无大方块) ---
    const dustCount = 1400;
    const dustGeom = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustOriginalPos = new Float32Array(dustCount * 3);
    const dustVelocities = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      const x = (nextRand() - 0.5) * 32;
      const y = (nextRand() - 0.5) * 24;
      const z = -24 + nextRand() * 40;

      dustPositions[idx] = x;
      dustPositions[idx + 1] = y;
      dustPositions[idx + 2] = z;

      dustOriginalPos[idx] = x;
      dustOriginalPos[idx + 1] = y;
      dustOriginalPos[idx + 2] = z;

      dustVelocities[idx] = (nextRand() - 0.5) * 0.012;
      dustVelocities[idx + 1] = (nextRand() - 0.5) * 0.012;
      dustVelocities[idx + 2] = (nextRand() - 0.5) * 0.012;
    }

    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

    const dustMaterial = new THREE.PointsMaterial({
      color: 0xffd285,
      size: 0.16,
      map: glowSpriteTexture,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const dustSystem = new THREE.Points(dustGeom, dustMaterial);
    scene.add(dustSystem);

    // --- 穿透百叶窗的柔和丁达尔体积光柱 ---
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);

    const beamGeom = new THREE.CylinderGeometry(0.08, 2.3, 22, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffa038,
      transparent: true,
      opacity: 0.09,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    [
      { pos: [-4, 2, -5], rot: [0.6, 0.4, 0.8] },
      { pos: [3, -1, 0], rot: [0.4, -0.3, 0.6] },
      { pos: [0, 4, -12], rot: [0.9, 0.2, 0.4] },
      { pos: [-5, -3, 6], rot: [0.5, 0.6, -0.7] }
    ].forEach((cfg) => {
      const beam = new THREE.Mesh(beamGeom, beamMat);
      beam.position.set(...cfg.pos);
      beam.rotation.set(...cfg.rot);
      beamGroup.add(beam);
    });

    // --- 交互逻辑 1：全量拨弦与 STAY 摩斯电码 ---
    const triggerGlobalPluck = () => {
      stringData.forEach((s) => {
        s.vibration = 1.1;
        s.pluckCenterIdx = Math.floor(filamentSegments * 0.5);
      });
      interactiveBooks.forEach((b) => {
        if (Math.random() < 0.45) {
          b.pushVelocity = 0.55 + Math.random() * 0.65;
        }
      });
      murphCoreLight.intensity = 6.2;
    };

    const triggerMorseSequence = () => {
      const steps = [180, 180, 180, 420, 180, 420, 420, 180, 420, 420];
      steps.forEach((dur, idx) => {
        setTimeout(() => {
          const targetBook =
            interactiveBooks[Math.floor(Math.random() * interactiveBooks.length)];
          if (targetBook) {
            targetBook.pushVelocity = dur > 300 ? 1.25 : 0.65;
          }
          const targetStr =
            stringData[Math.floor(Math.random() * stringData.length)];
          if (targetStr) {
            targetStr.vibration = 1.2;
          }
          murphCoreLight.intensity = dur > 300 ? 5.8 : 4.6;
        }, idx * 280);
      });
    };

    sceneTriggerRef.current = {
      pluck: triggerGlobalPluck,
      morse: triggerMorseSequence
    };

    // --- 交互逻辑 2：鼠标扫过时实时拨动重力琴弦 + 软限幅防跑偏视差 ---
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const prevMouseNDC = new THREE.Vector2();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const rayPoint = new THREE.Vector3();

    const onMouseMove = (e) => {
      const rawX = (e.clientX / window.innerWidth) * 2 - 1;
      const rawY = -(e.clientY / window.innerHeight) * 2 + 1;

      const moveSpeed = Math.hypot(rawX - prevMouseNDC.x, rawY - prevMouseNDC.y);
      prevMouseNDC.set(rawX, rawY);
      mouseNDC.set(rawX, rawY);

      // 使用 Math.tanh 软限幅，防止鼠标移到屏幕边缘时相机飞出书架走廊
      mouse.tx = Math.tanh(rawX * 1.1);
      mouse.ty = Math.tanh(rawY * 1.1);

      if (moveSpeed < 0.002) return;

      raycaster.setFromCamera(mouseNDC, camera);
      const rayOrigin = raycaster.ray.origin;
      const rayDir = raycaster.ray.direction;

      const sweepBoost = Math.min(1.25, 0.38 + moveSpeed * 14.0);

      for (let i = 0; i < stringData.length; i++) {
        const s = stringData[i];
        if (s.axis === 'z') {
          const t = THREE.MathUtils.clamp((0 - rayOrigin.z) / (rayDir.z || -0.001), 2, 32);
          rayPoint.copy(rayOrigin).addScaledVector(rayDir, t);
          const dist = Math.hypot(rayPoint.x - s.fixedX, rayPoint.y - s.fixedY);
          if (dist < 1.45) {
            const strength = (1 - dist / 1.45) * sweepBoost;
            if (strength > s.vibration) {
              s.vibration = strength;
              const zRatio = (rayPoint.z + stringLength / 2) / stringLength;
              s.pluckCenterIdx = THREE.MathUtils.clamp(
                Math.floor(zRatio * filamentSegments),
                4,
                filamentSegments - 4
              );
            }
          }
        } else {
          const t = THREE.MathUtils.clamp(
            (s.fixedZ - rayOrigin.z) / (rayDir.z || -0.001),
            2,
            35
          );
          rayPoint.copy(rayOrigin).addScaledVector(rayDir, t);
          const dist = Math.abs(rayPoint.x - s.fixedX);
          if (dist < 1.25 && Math.abs(rayPoint.y) < stringLength * 0.45) {
            const strength = (1 - dist / 1.25) * sweepBoost;
            if (strength > s.vibration) {
              s.vibration = strength;
              const yRatio = (rayPoint.y + stringLength / 2) / stringLength;
              s.pluckCenterIdx = THREE.MathUtils.clamp(
                Math.floor(yRatio * filamentSegments),
                4,
                filamentSegments - 4
              );
            }
          }
        }
      }

      // 鼠标扫过时轻推中心书架上的 3D 书本
      const bookCheckT = THREE.MathUtils.clamp(-rayOrigin.z / (rayDir.z || -0.001), 2, 26);
      rayPoint.copy(rayOrigin).addScaledVector(rayDir, bookCheckT);
      for (let i = 0; i < interactiveBooks.length; i++) {
        const b = interactiveBooks[i];
        const d = b.worldPos.distanceTo(rayPoint);
        if (d < 1.6 && moveSpeed > 0.015) {
          b.pushVelocity = Math.max(b.pushVelocity, (1 - d / 1.6) * 0.45);
        }
      }
    };

    const onPointerDown = (e) => {
      if (e.target.closest('button, a, input, aside, .tesseract-bookcase-frame')) return;
      triggerGlobalPluck();
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', onResize);

    // --- 动画主循环 ---
    let animId;
    let diveProgress = 0;
    let diveCompleted = false;
    const clock = new THREE.Clock();
    const targetCamPos = new THREE.Vector3(0, 0.6, 16.5);
    const targetLookAt = new THREE.Vector3(0, 0, -9);
    const currentLookAt = new THREE.Vector3(0, 0, -9);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsedTime = clock.getElapsedTime();

      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      const currentStage = stageRef.current;
      const mode = cameraModeRef.current;

      // 1. 运镜与视点控制（全程居中约束，绝不移出书架阵列边界）
      if (currentStage === 'locked') {
        diveProgress = 0;
        diveCompleted = false;
        const t = elapsedTime * 0.15;
        // 围绕中心轴 (0, 0.5, 16.5) 做小幅呼吸漫游，四面八方始终被书架包裹
        const camX = Math.sin(t * 0.7) * 1.35 + mouse.x * 1.45;
        const camY = 0.5 + Math.cos(t * 0.5) * 0.95 + mouse.y * 1.1;
        const camZ = 16.5 + Math.sin(t * 0.35) * 1.6;

        targetCamPos.set(camX, camY, camZ);
        camera.position.lerp(targetCamPos, 0.05);

        // 微妙的五维空间呼吸倾角，不破坏居中感
        const roll = Math.sin(t * 0.4) * 0.08 - mouse.x * 0.04;
        camera.up.set(Math.sin(roll), Math.cos(roll), 0).normalize();

        targetLookAt.set(mouse.x * 0.9, mouse.y * 0.7, -9);
        currentLookAt.lerp(targetLookAt, 0.06);
        camera.lookAt(currentLookAt);
      } else if (currentStage === 'diving') {
        // 解锁瞬间：沿着中央时间走廊平稳向前推进至书架内部
        diveProgress = Math.min(1, diveProgress + dt * 0.58);
        const ease =
          diveProgress < 0.5
            ? 4 * diveProgress * diveProgress * diveProgress
            : 1 - Math.pow(-2 * diveProgress + 2, 3) / 2;

        camera.position.set(
          THREE.MathUtils.lerp(camera.position.x, 0, ease),
          THREE.MathUtils.lerp(camera.position.y, 0.6, ease),
          THREE.MathUtils.lerp(16.5, 11.5, ease)
        );
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, -9);

        if (diveProgress >= 0.98 && !diveCompleted) {
          diveCompleted = true;
          if (diveCallbackRef.current) diveCallbackRef.current();
        }
      } else {
        // 进入书房内部后：4 种视点均做了边界约束，不会移出书架
        camera.up.set(0, 1, 0);
        if (mode === 'cooper') {
          targetCamPos.set(1.2 + mouse.x * 0.7, 0.2 + mouse.y * 0.5, 4.8);
          targetLookAt.set(mouse.x * 0.5, mouse.y * 0.4, -3);
        } else if (mode === 'lattice') {
          targetCamPos.set(6.5 + mouse.x * 1.4, 4.5 + mouse.y * 1.1, 16.5);
          targetLookAt.set(mouse.x * 0.8, mouse.y * 0.6, -9);
        } else if (mode === 'murph') {
          targetCamPos.set(-0.2 + mouse.x * 0.45, -0.4 + mouse.y * 0.35, 2.6);
          targetLookAt.set(mouse.x * 0.25, -0.4 + mouse.y * 0.25, -2);
        } else {
          // 默认 'cinematic' 居中零重力漂浮视点
          const t = elapsedTime * 0.14;
          targetCamPos.set(
            Math.sin(t * 0.7) * 1.4 + mouse.x * 1.35,
            0.5 + Math.cos(t * 0.5) * 0.9 + mouse.y * 1.0,
            13.5 + Math.sin(t * 0.3) * 1.5
          );
          targetLookAt.set(mouse.x * 0.85, mouse.y * 0.65, -8);
        }

        camera.position.lerp(targetCamPos, 0.05);
        currentLookAt.lerp(targetLookAt, 0.06);
        camera.lookAt(currentLookAt);
      }

      // 2. 更新重力琴弦的驻波与行波振动
      for (let sIdx = 0; sIdx < stringData.length; sIdx++) {
        const s = stringData[sIdx];
        if (s.vibration > 0.001) {
          s.vibration *= 0.955;
          s.mat.opacity = Math.min(0.95, 0.42 + s.vibration * 0.55);
          s.mat.color.setRGB(
            1.0,
            Math.min(1.0, 0.67 + s.vibration * 0.33),
            Math.min(1.0, 0.27 + s.vibration * 0.65)
          );

          const positions = s.line.geometry.attributes.position.array;
          const len = s.basePoints.length;

          for (let i = 0; i < len; i++) {
            const base = s.basePoints[i];
            const endPin = Math.sin((i / (len - 1)) * Math.PI);
            const distFromPluck = Math.abs(i - s.pluckCenterIdx) / filamentSegments;
            const envelope = Math.exp(-distFromPluck * 2.8) * endPin;
            const wave =
              Math.sin(i * 0.45 - elapsedTime * s.vibeSpeed + s.phase) *
              s.vibration *
              0.42 *
              envelope;

            if (s.axis === 'z') {
              positions[i * 3] = base.x + wave;
              positions[i * 3 + 1] = base.y + wave * 0.65;
              positions[i * 3 + 2] = base.z;
            } else {
              positions[i * 3] = base.x + wave;
              positions[i * 3 + 1] = base.y;
              positions[i * 3 + 2] = base.z + wave * 0.65;
            }
          }
          s.line.geometry.attributes.position.needsUpdate = true;
        } else if (s.mat.opacity > 0.43) {
          s.mat.opacity = 0.42;
          s.mat.color.setHex(0xffaa44);
        }
      }

      // 3. 更新 3D 书架上被重力波或摩斯电码推开的实体书本
      for (let i = 0; i < interactiveBooks.length; i++) {
        const b = interactiveBooks[i];
        if (b.pushVelocity > 0.004) {
          b.currentZ += b.pushVelocity * dt * 4.2;
          b.pushVelocity *= 0.91;
          b.mesh.rotation.z = b.tilt + b.pushVelocity * 0.18;
        } else if (b.currentZ > b.baseZ) {
          b.currentZ += (b.baseZ - b.currentZ) * 0.04;
          b.mesh.rotation.z += (b.tilt - b.mesh.rotation.z) * 0.06;
        }
        b.mesh.position.z = b.currentZ;
      }

      // 4. 更新精细化圆形引力微粒
      const posArray = dustGeom.attributes.position.array;
      const isBinary = dustBinaryRef.current;
      for (let i = 0; i < dustCount; i++) {
        const idx = i * 3;
        if (isBinary) {
          const stripeSpacing = 2.2;
          const targetX = Math.round(dustOriginalPos[idx] / stripeSpacing) * stripeSpacing;
          posArray[idx] += (targetX - posArray[idx]) * 0.06;
          posArray[idx + 1] -= 0.022;
          if (posArray[idx + 1] < -13) posArray[idx + 1] = 13;
        } else {
          posArray[idx] += dustVelocities[idx];
          posArray[idx + 1] +=
            dustVelocities[idx + 1] + Math.sin(elapsedTime * 0.5 + i) * 0.0025;
          posArray[idx + 2] += dustVelocities[idx + 2];

          if (posArray[idx] > 16) posArray[idx] = -16;
          if (posArray[idx] < -16) posArray[idx] = 16;
          if (posArray[idx + 1] > 12) posArray[idx + 1] = -12;
          if (posArray[idx + 1] < -12) posArray[idx + 1] = 12;
          if (posArray[idx + 2] > 16) posArray[idx + 2] = -24;
          if (posArray[idx + 2] < -24) posArray[idx + 2] = 16;
        }
      }
      dustGeom.attributes.position.needsUpdate = true;

      // 5. 核心光源与体积光束微动
      murphCoreLight.intensity +=
        (4.0 + Math.sin(elapsedTime * 1.5) * 0.4 - murphCoreLight.intensity) * 0.05;
      beamGroup.rotation.y = Math.sin(elapsedTime * 0.08) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      bookSpineTexture.dispose();
      glowSpriteTexture.dispose();
      topGeom.dispose();
      sideGeom.dispose();
      slatGeom.dispose();
      edgeRimGeom.dispose();
      louverGeom.dispose();
      dustGeom.dispose();
      beamGeom.dispose();
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

  const [cameraMode, setCameraMode] = useState('cinematic'); // 'cinematic' | 'cooper' | 'lattice' | 'murph'
  const [dustBinaryMode, setDustBinaryMode] = useState(false);
  const [pureSpaceView, setPureSpaceView] = useState(false);
  const [pluckSignal, setPluckSignal] = useState(0);
  const [morseSignal, setMorseSignal] = useState(0);

  useEffect(() => {
    const updateShelfCapacity = () => {
      const w = window.innerWidth;
      if (w < 640) setBooksPerShelf(5);
      else if (w < 960) setBooksPerShelf(7);
      else if (w < 1280) setBooksPerShelf(9);
      else setBooksPerShelf(10);
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
      setPluckSignal((n) => n + 1);
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
        body: JSON.stringify({
          action: 'lock'
        })
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

  const switchViewpoint = (mode) => {
    setCameraMode(mode);
  };

  if (readingBook) {
    return (
      <div className="tesseract-root">
        <TesseractScene3D
          stage="inside"
          cameraMode={cameraMode}
          dustBinaryMode={dustBinaryMode}
          pluckSignal={pluckSignal}
          morseSignal={morseSignal}
        />
        <LibraryPdfReader item={readingBook} onClose={() => setReadingBook(null)} />
      </div>
    );
  }

  return (
    <div className="tesseract-root">
      {/* 底层：Three.js 全包围居中五维书架 + 鼠标扫过实时拨动重力弦 + 精细圆形引力微尘 */}
      <TesseractScene3D
        stage={stage}
        cameraMode={cameraMode}
        dustBinaryMode={dustBinaryMode}
        pluckSignal={pluckSignal}
        morseSignal={morseSignal}
        onDiveComplete={() => setStage('inside')}
      />

      {/* 宽银幕变形镜头微光与电影暗角 */}
      <div className="tesseract-cinematic-vignette" />
      <div className="tesseract-anamorphic-flare" />

      {/* 阶段一：五维超立方体居中巡航 + 悬浮密钥舱 */}
      {stage === 'locked' && (
        <div className="tesseract-auth-overlay">
          <form onSubmit={handleUnlock} className="tesseract-auth-box">
            <div className="tesseract-auth-corner tl" />
            <div className="tesseract-auth-corner tr" />
            <div className="tesseract-auth-corner bl" />
            <div className="tesseract-auth-corner br" />

            <div className="flex items-center justify-between text-amber-300/90 text-[10px] tracking-[0.28em] uppercase mb-3">
              <span className="flex items-center gap-2">
                <Lock size={13} /> GARGANTUA // 5D_BOOKSHELF_TESSERACT
              </span>
              <Link to="/" className="text-amber-200/60 hover:text-white transition-colors">
                [ESC]
              </Link>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase mb-2">
              THE TESSERACT
            </h1>
            <p className="text-xs text-amber-100/75 font-mono leading-relaxed mb-6">
              Sweep across gravitational strings to resonate across time. Enter your cipher to enter Murph&apos;s bookshelf chamber.
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
              <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300/70" size={15} />
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

      {/* 阶段二：穿廊过渡 HUD */}
      {stage === 'diving' && (
        <div className="tesseract-diving-hud">
          <div className="diving-reticle" />
          <span>ALIGNING WITH MURPH&apos;S ROOM TIMELINE...</span>
        </div>
      )}

      {/* 阶段三：进入书架内部 */}
      {stage === 'inside' && (
        <div className="tesseract-inside-stage animate-tesseract-enter">
          <div
            className={`tesseract-inside-grid transition-opacity duration-500 ${
              pureSpaceView ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <main className="tesseract-chamber">
              <div className="tesseract-bookcase-frame">
                <div className="bookcase-cornice">
                  <div className="flex items-center gap-3">
                    <span>MURPH_ROOM_TIMELINE // 5D_BOOKSHELF</span>
                    <span className="text-amber-400/60">|</span>
                    <span className="text-amber-200">
                      {filteredBooks.length} / {catalog.items.length} VOLUMES
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPluckSignal((n) => n + 1)}
                      className="inline-flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
                      title="拨动重力琴弦"
                    >
                      <Zap size={12} />
                      <span>PLUCK</span>
                    </button>
                    <button
                      onClick={() => setMorseSignal((n) => n + 1)}
                      className="inline-flex items-center gap-1 text-amber-300 hover:text-white transition-colors"
                      title="发送 STAY 摩斯码"
                    >
                      <Radio size={12} />
                      <span>STAY</span>
                    </button>
                    <button
                      onClick={() => fetchRealCatalog(false)}
                      className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white transition-colors"
                      title="Reload Library Index"
                    >
                      <RefreshCw size={12} className={loadingCatalog ? 'animate-spin' : ''} />
                      <span>SYNC</span>
                    </button>
                  </div>
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
                      <div className="shelf-back-louvers" />
                      <div className="shelf-back-slits" />
                      <div className="shelf-center-pillar" />
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

          {/* 底部悬浮综合控制台 */}
          <footer className="tesseract-floating-dock">
            <Link to="/" className="dock-btn" title="Return Home">
              <ArrowLeft size={14} />
              <span>HOME</span>
            </Link>

            <div className="dock-divider" />

            <div className="flex items-center gap-1">
              {[
                { id: 'cinematic', label: '漫游' },
                { id: 'cooper', label: '库珀视点' },
                { id: 'lattice', label: '时空阵列' },
                { id: 'murph', label: '书架窗格' }
              ].map((vp) => (
                <button
                  key={vp.id}
                  onClick={() => switchViewpoint(vp.id)}
                  className={`dock-pill ${cameraMode === vp.id ? 'active' : ''}`}
                  title="切换五维背景书架视点"
                >
                  <span>{vp.label}</span>
                </button>
              ))}
              <button
                onClick={() => setDustBinaryMode((v) => !v)}
                className={`dock-pill ${dustBinaryMode ? 'active' : ''}`}
                title="切换重力尘埃二进制坐标条纹"
              >
                <span>尘埃条纹</span>
              </button>
              <button
                onClick={() => setPureSpaceView((v) => !v)}
                className={`dock-pill ${pureSpaceView ? 'active' : ''}`}
                title="隐藏前景书柜，纯享 3D 拨弦与五维书架视角"
              >
                {pureSpaceView ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>{pureSpaceView ? '显示藏书' : '纯净五维'}</span>
              </button>
            </div>

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
                placeholder="SEARCH..."
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

            <button onClick={handleLock} className="dock-btn" title="Return to Lock Screen">
              <Unlock size={13} />
              <span>LOCK</span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}