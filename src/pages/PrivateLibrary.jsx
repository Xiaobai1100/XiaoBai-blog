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
 * 2. 《星际穿越》五维超立方体 GLSL 光幕与正交书井引擎
 * 还原参考图中的香槟金/橄榄色条形码书缝透光、正交光束与多轴复合运镜
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
    scene.background = new THREE.Color(0x0c0a07);

    const camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.5,
      500
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 核心：编写《星际穿越》五维书架光栅与条形码光束着色器 (Barcode Light-Curtain Shader)
    const curtainUniforms = {
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uDim: { value: 1.0 }
    };

    const curtainMaterial = new THREE.ShaderMaterial({
      uniforms: curtainUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vDist;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vec4 mv = viewMatrix * wp;
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uWarp;
        uniform float uDim;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying float vDist;

        float hash(float n) {
          return fract(sin(n * 127.1) * 43758.5453123);
        }

        void main() {
          // 1. 书架层格与成排书缝的条形码光栅 (模拟光线穿过不同厚度的书本缝隙)
          float bookSlot = floor(vUv.x * 42.0);
          float bookRand = hash(bookSlot + floor(vUv.y * 6.0) * 19.0);
          float slitMask = smoothstep(0.35, 0.92, bookRand);

          // 高频光学细丝 (还原参考图中密集的书背反光条纹)
          float fineStreaks = 0.5 + 0.5 * sin(vUv.x * 260.0 + bookRand * 6.28);
          fineStreaks = pow(fineStreaks, 2.2);

          // 书架横梁暗格切分
          float shelfTier = fract(vUv.y * 4.0);
          float shelfBeam = smoothstep(0.0, 0.08, shelfTier) * smoothstep(1.0, 0.88, shelfTier);

          // 沿四维时间轴流动的光波涟漪
          float timeFlow = 0.75 + 0.25 * sin(vUv.y * 18.0 - uTime * (1.2 + uWarp * 6.0) + bookRand * 4.0);

          // 色彩还原：参考图中的香槟暖白、橄榄金、琥珀棕与微弱红移丝线
          vec3 colChampagne = vec3(1.0, 0.95, 0.82);
          vec3 colOliveGold = vec3(0.68, 0.58, 0.34);
          vec3 colDeepAmber = vec3(0.45, 0.30, 0.14);
          vec3 colCrimsonThread = vec3(0.75, 0.22, 0.12);

          vec3 baseCol = mix(colDeepAmber, colOliveGold, bookRand);
          baseCol = mix(baseCol, colChampagne, pow(fineStreaks * slitMask, 1.6));

          // 偶发的红色/金色时间引力弦
          if (hash(bookSlot * 3.1) > 0.93) {
            baseCol = mix(baseCol, colCrimsonThread, 0.65);
          }

          // 横梁边缘的高亮金属反光
          floatledgeGlow = smoothstep(0.06, 0.0, abs(shelfTier - 0.08)) * 0.9;
          baseCol += colChampagne * floatledgeGlow;

          // 远近景深柔和衰减
          float depthFade = smoothstep(260.0, 28.0, vDist) * smoothstep(2.0, 14.0, vDist);
          float alpha = (slitMask * fineStreaks * 0.42 + floatledgeGlow * 0.35 + 0.06) * shelfBeam * timeFlow * depthFade * uDim;

          gl_FragColor = vec4(baseCol * (1.0 + uWarp * 0.6), clamp(alpha, 0.0, 0.85));
        }
      `
    });

    // 深色金属/胡桃木结构框架材质（与明亮的条形码光幕形成强烈明暗对比）
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0x16110b,
      transparent: true,
      opacity: 0.92
    });

    const edgeLineMaterial = new THREE.LineBasicMaterial({
      color: 0xd4be8d,
      transparent: true,
      opacity: 0.42
    });

    // 构建正交四维交叉的书架井道矩阵 (Tesseract Orthogonal Matrix)
    const tesseractGroup = new THREE.Group();
    scene.add(tesseractGroup);

    const planeGeo = new THREE.PlaneGeometry(26, 26);
    const beamGeo = new THREE.BoxGeometry(26.5, 0.55, 1.4);

    const CELL = 28;
    // 在三维网格中布置互相垂直交错的 X-Y、Z-Y、X-Z 书架光幕面与实木横梁
    for (let ix = -2; ix <= 2; ix++) {
      for (let iy = -2; iy <= 2; iy++) {
        for (let iz = -3; iz <= 2; iz++) {
          // 留出中心观测核心走廊
          if (Math.abs(ix) === 0 && Math.abs(iy) === 0 && Math.abs(iz) <= 1) continue;

          const cx = ix * CELL;
          const cy = iy * CELL;
          const cz = iz * CELL;

          // 1. 正面书架光幕
          const pFront = new THREE.Mesh(planeGeo, curtainMaterial);
          pFront.position.set(cx, cy, cz);
          tesseractGroup.add(pFront);

          // 2. 正交侧面书架光幕（形成五维空间縱横交错的光线重影）
          const pSide = new THREE.Mesh(planeGeo, curtainMaterial);
          pSide.position.set(cx + CELL * 0.5, cy, cz + CELL * 0.5);
          pSide.rotation.y = Math.PI * 0.5;
          tesseractGroup.add(pSide);

          // 3. 水平透光光束面（模拟从书缝向空间射出的长条形光毯）
          if ((ix + iy + iz) % 2 === 0) {
            const pRay = new THREE.Mesh(planeGeo, curtainMaterial);
            pRay.position.set(cx, cy - CELL * 0.5, cz);
            pRay.rotation.x = Math.PI * 0.5;
            tesseractGroup.add(pRay);
          }

          // 4. 高对比度深色书架剪影横梁（强化前实后虚的光影层次）
          if (Math.abs(ix) <= 1 && Math.abs(iy) <= 1) {
            const beam = new THREE.Mesh(beamGeo, frameMaterial);
            beam.position.set(cx, cy - 6.5, cz + 0.8);
            tesseractGroup.add(beam);
          }
        }
      }
    }

    // 贯穿整个超立方体的长程金色世界线光弦
    const linePts = [];
    const SPAN = CELL * 3;
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        const u = i * (CELL * 0.5);
        const v = j * (CELL * 0.5);
        linePts.push(-SPAN, u, v, SPAN, u, v);
        linePts.push(u, -SPAN, v, u, SPAN, v);
        linePts.push(u, v, -SPAN, u, v, SPAN);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePts, 3));
    const worldLines = new THREE.LineSegments(lineGeo, edgeLineMaterial);
    tesseractGroup.add(worldLines);

    // 鼠标视差与窗口尺寸监听
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

      curtainUniforms.uTime.value = elapsed;
      const currentStage = stageRef.current;

      if (currentStage === 'locked') {
        diveProgress = 0;
        diveCompleted = false;
        curtainUniforms.uWarp.value = 0.0;
        curtainUniforms.uDim.value = 1.05;

        // 电影级多轴复合运镜（告别呆板的直线往前冲）：
        // 摄像机沿三维李萨如轨迹在正交书架井道间优雅横移、俯仰并带有《星际穿越》标志性的斜角旋转
        const orbitX = Math.sin(elapsed * 0.22) * 18 + Math.cos(elapsed * 0.11) * 8 + mouse.x * 10;
        const orbitY = Math.cos(elapsed * 0.18) * 14 + Math.sin(elapsed * 0.09) * 6 - mouse.y * 8;
        const orbitZ = Math.sin(elapsed * 0.15) * 22 + 18;

        camera.position.set(orbitX, orbitY, orbitZ);

        // 镜头焦点在多维书架象限间缓慢巡视
        const lookX = Math.cos(elapsed * 0.14) * 12 - mouse.x * 5;
        const lookY = Math.sin(elapsed * 0.16) * 10 + mouse.y * 5;
        const lookZ = -35 + Math.cos(elapsed * 0.12) * 15;

        // 赋予 32°~42° 的五维空间倾斜角（完全复刻参考图的对角透视感）
        const rollAngle = 0.58 + Math.sin(elapsed * 0.2) * 0.12;
        camera.up.set(Math.sin(rollAngle), Math.cos(rollAngle), 0.15).normalize();
        camera.lookAt(lookX, lookY, lookZ);
      } else if (currentStage === 'diving') {
        // 解锁瞬间：三维旋转回正 + 穿廊对齐运镜
        diveProgress = Math.min(1, diveProgress + dt * 0.52);
        const ease =
          diveProgress < 0.5
            ? 4 * diveProgress * diveProgress * diveProgress
            : 1 - Math.pow(-2 * diveProgress + 2, 3) / 2;

        curtainUniforms.uWarp.value = Math.sin(diveProgress * Math.PI);
        curtainUniforms.uDim.value = THREE.MathUtils.lerp(1.05, 0.55, ease);

        // 从当前多维斜角平滑旋转回正，并滑入中央书房坐标
        const startX = Math.sin(elapsed * 0.22) * 18;
        const startY = Math.cos(elapsed * 0.18) * 14;
        const startZ = Math.sin(elapsed * 0.15) * 22 + 18;

        camera.position.set(
          THREE.MathUtils.lerp(startX, 0, ease),
          THREE.MathUtils.lerp(startY, 0, ease),
          THREE.MathUtils.lerp(startZ, -14, ease)
        );

        const rollAngle = THREE.MathUtils.lerp(0.58, 0.0, ease);
        camera.up.set(Math.sin(rollAngle), Math.cos(rollAngle), 0).normalize();
        camera.lookAt(0, 0, -55);

        if (diveProgress >= 0.98 && !diveCompleted) {
          diveCompleted = true;
          if (diveCallbackRef.current) diveCallbackRef.current();
        }
      } else {
        // 进入书房内部后：环境光幕柔和环绕，随鼠标产生深空视差
        curtainUniforms.uWarp.value = 0.0;
        curtainUniforms.uDim.value = 0.48;
        camera.position.set(mouse.x * 4.5, -mouse.y * 3.0, -14);
        camera.up.set(0, 1, 0);
        camera.lookAt(mouse.x * 2.0, -mouse.y * 1.5, -60);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="tesseract-webgl-stage" />;
};

/**
 * 3. 精准解析 `/api/library-index` 中的全部 60 本 PDF（严禁将文件夹元数据误判为书籍）
 */
function normalizeLibraryData(payload) {
  if (!payload) return { items: [], folders: [], notes: [] };

  const rawFiles = [];
  const folderSet = new Set();

  // 递归提取树形节点中的真实文件
  const extractFromTree = (nodes, parentFolder = '') => {
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (!node || typeof node !== 'object') return;
      const children = node.items || node.files || node.books || node.children || node.entries;
      if (Array.isArray(children)) {
        const nextFolder = node.path || node.name || node.title || node.folder || parentFolder;
        if (nextFolder) folderSet.add(nextFolder);
        extractFromTree(children, nextFolder);
        return;
      }
      // 排除纯目录描述对象（没有后缀且带有 count/isDirectory 标记的对象）
      if (
        node.type === 'folder' ||
        node.type === 'directory' ||
        node.isDirectory === true ||
        (typeof node.count === 'number' && !node.fileUrl && !node.extension && !node.format)
      ) {
        const dirName = node.path || node.name || node.title;
        if (dirName) folderSet.add(dirName);
        return;
      }
      rawFiles.push({ ...node, _inferredFolder: parentFolder });
    });
  };

  // 优先读取主文件数组（避免同 folders 数组混杂导致重复或污染）
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
    extractFromTree(payload.tree || payload.catalog?.tree || payload.folders || payload.categories);
  }

  // 收集显式声明的文件夹名
  const explicitFolders = payload.folders || payload.categories || payload.catalog?.folders || [];
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
    const fileName = raw.fileName || raw.name || parts[parts.length - 1] || raw.title || `Volume_${idx + 1}`;
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

  // 根据窗口宽度动态调整每层书架容纳的本数，彻底杜绝同一层书架折行悬空
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

  // 拉取你仓库中的 60 本真实 PDF 目录
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
      setSyncNotice('当前环境未检测到 /api/library-index 响应（本地调试请使用 vercel dev 启动，或部署至 Vercel 线上以加载全部 60 本 PDF）。');
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

      // 优先请求服务端会话解锁接口，确保 Cookie 写入以便拉取 60 本 PDF
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
        // 忽略本地无 Serverless 时的网络异常
      }

      const clientVerified = await verifyClientSideCipher(cleanPassword);

      if (!apiUnlocked && !clientVerified) {
        throw new Error('ACCESS_DENIED: 密钥不匹配，请输入正确的书架密钥');
      }

      setPassword('');
      // 解锁成功后立即拉取全部 60 本 PDF 目录
      await fetchRealCatalog(false);
      // 触发《星际穿越》五维书架穿梭运镜
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

  // 按当前分类或书架容量将 60 本 PDF 整齐排列到多层书架隔板上
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
      {/* 底层：Three.js《星际穿越》五维超立方体条形码光幕与多轴运镜 */}
      <TesseractScene3D
        stage={stage}
        onDiveComplete={() => setStage('inside')}
      />

      {/* 阶段一：五维超立方体多轴巡航 + 中央悬浮密钥舱 */}
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
              Light-planes across five dimensions. Enter your gravitational key to align the tesseract and enter your bookshelf.
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
                {/* 书柜顶冠状态栏 */}
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
                      {/* 书架后方透射出的五维书缝背光 */}
                      <div className="shelf-back-slits" />
                      <div className="shelf-top-downlight" />

                      {/* 严格单排竖立的 3D 精装书籍（绝不折行悬空） */}
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

                      {/* 3D 实木与黄铜承重书架横梁 */}
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

                {/* 实时渲染选中 PDF 的第 1 页真实封面 */}
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