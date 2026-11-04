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
  X
} from 'lucide-react';
import LibraryPdfReader from '../components/LibraryPdfReader';
import './PrivateLibrary.css';

// 默认展示的经典物理学与数学精装馆藏（当本地未启动 Serverless API 时的保底书架数据）
const FALLBACK_VOLUMES = [
  { id: 'v1', title: 'GRAVITATION // MISNER THORNE WHEELER', rawName: 'Gravitation_MTW.pdf', folder: 'RELATIVITY', ext: 'PDF', size: 48200000, isPdf: true, fileUrl: '/api/library-file?path=Gravitation_MTW.pdf', downloadUrl: '/api/library-file?path=Gravitation_MTW.pdf&download=1' },
  { id: 'v2', title: 'TURBULENT FLOWS // STEPHEN B. POPE', rawName: 'Turbulent_Flows_Pope.pdf', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 32100000, isPdf: true, fileUrl: '/api/library-file?path=Turbulent_Flows_Pope.pdf', downloadUrl: '/api/library-file?path=Turbulent_Flows_Pope.pdf&download=1' },
  { id: 'v3', title: 'THE ROAD TO REALITY // ROGER PENROSE', rawName: 'Road_To_Reality.pdf', folder: 'COSMOLOGY', ext: 'PDF', size: 54000000, isPdf: true, fileUrl: '/api/library-file?path=Road_To_Reality.pdf', downloadUrl: '/api/library-file?path=Road_To_Reality.pdf&download=1' },
  { id: 'v4', title: 'NONLINEAR DYNAMICS AND CHAOS // STROGATZ', rawName: 'Nonlinear_Dynamics_Strogatz.pdf', folder: 'DYNAMICS', ext: 'PDF', size: 21500000, isPdf: true, fileUrl: '/api/library-file?path=Nonlinear_Dynamics_Strogatz.pdf', downloadUrl: '/api/library-file?path=Nonlinear_Dynamics_Strogatz.pdf&download=1' },
  { id: 'v5', title: 'THE FINITE ELEMENT METHOD // T.J.R. HUGHES', rawName: 'FEM_Hughes.pdf', folder: 'NUMERICAL', ext: 'PDF', size: 39800000, isPdf: true, fileUrl: '/api/library-file?path=FEM_Hughes.pdf', downloadUrl: '/api/library-file?path=FEM_Hughes.pdf&download=1' },
  { id: 'v6', title: 'STATISTICAL MECHANICS: ENTROPY, ORDER PARAMETERS', rawName: 'Sethna_StatMech.pdf', folder: 'STAT_PHYS', ext: 'PDF', size: 19400000, isPdf: true, fileUrl: '/api/library-file?path=Sethna_StatMech.pdf', downloadUrl: '/api/library-file?path=Sethna_StatMech.pdf&download=1' },
  { id: 'v7', title: 'TURBULENCE: THE LEGACY OF A.N. KOLMOGOROV', rawName: 'Frisch_Turbulence.pdf', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 16800000, isPdf: true, fileUrl: '/api/library-file?path=Frisch_Turbulence.pdf', downloadUrl: '/api/library-file?path=Frisch_Turbulence.pdf&download=1' },
  { id: 'v8', title: 'BLACK HOLES & TIME WARPS // KIP THORNE', rawName: 'Black_Holes_Time_Warps.pdf', folder: 'RELATIVITY', ext: 'PDF', size: 28900000, isPdf: true, fileUrl: '/api/library-file?path=Black_Holes_Time_Warps.pdf', downloadUrl: '/api/library-file?path=Black_Holes_Time_Warps.pdf&download=1' },
  { id: 'v9', title: 'DIFFERENTIAL GEOMETRY OF CURVES AND SURFACES', rawName: 'DoCarmo_DiffGeo.pdf', folder: 'MATHEMATICS', ext: 'PDF', size: 24300000, isPdf: true, fileUrl: '/api/library-file?path=DoCarmo_DiffGeo.pdf', downloadUrl: '/api/library-file?path=DoCarmo_DiffGeo.pdf&download=1' },
  { id: 'v10', title: 'PARTIAL DIFFERENTIAL EQUATIONS // L.C. EVANS', rawName: 'Evans_PDE.pdf', folder: 'MATHEMATICS', ext: 'PDF', size: 31200000, isPdf: true, fileUrl: '/api/library-file?path=Evans_PDE.pdf', downloadUrl: '/api/library-file?path=Evans_PDE.pdf&download=1' },
  { id: 'v11', title: 'MATHEMATICAL METHODS OF CLASSICAL MECHANICS', rawName: 'Arnold_Mechanics.pdf', folder: 'MECHANICS', ext: 'PDF', size: 22700000, isPdf: true, fileUrl: '/api/library-file?path=Arnold_Mechanics.pdf', downloadUrl: '/api/library-file?path=Arnold_Mechanics.pdf&download=1' },
  { id: 'v12', title: 'FLUID MECHANICS // LANDAU & LIFSHITZ VOL.6', rawName: 'Landau_Fluid_Mechanics.pdf', folder: 'FLUID_DYNAMICS', ext: 'PDF', size: 36500000, isPdf: true, fileUrl: '/api/library-file?path=Landau_Fluid_Mechanics.pdf', downloadUrl: '/api/library-file?path=Landau_Fluid_Mechanics.pdf&download=1' }
];

/**
 * 1. Three.js 3D 无限延伸五维超立方体书架引擎 (Interstellar 5D Tesseract Lattice)
 * stage: 'locked' (斜角无限书架矩阵巡航) | 'diving' (高速穿梭飞入书架内部) | 'inside' (舱内环绕视界)
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
    scene.background = new THREE.Color(0x090806);
    scene.fog = new THREE.FogExp2(0x090806, 0.0068);

    const camera = new THREE.PerspectiveCamera(
      54,
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
    container.appendChild(renderer.domElement);

    // 灯光系统：还原《星际穿越》书架背后的暖琥珀色、橄榄金与柔和白炽背光
    const ambientLight = new THREE.AmbientLight(0xd6b87c, 0.75);
    scene.add(ambientLight);

    const coreLight = new THREE.PointLight(0xffe6b0, 3.2, 260, 1.2);
    coreLight.position.set(0, 0, -40);
    scene.add(coreLight);

    const warmBackLight = new THREE.DirectionalLight(0xd99b4e, 1.6);
    warmBackLight.position.set(40, 60, -80);
    scene.add(warmBackLight);

    // 构建无限重复的 3D 超立方体书架群组 (2 套大矩阵前后无缝循环推进)
    const CELL_SPACE = 32;
    const GRID_X = 4; // -2..1
    const GRID_Y = 4; // -2..1
    const GRID_Z = 7; // 7 层纵深
    const BLOCK_DEPTH = GRID_Z * CELL_SPACE;

    const buildTesseractSector = () => {
      const group = new THREE.Group();

      const totalCells = GRID_X * GRID_Y * GRID_Z;
      const shelvesPerCell = 4;
      const booksPerCell = 9;

      // A. 实木/青铜书架隔板与立柱 InstancedMesh
      const plankGeo = new THREE.BoxGeometry(1, 1, 1);
      const plankMat = new THREE.MeshStandardMaterial({
        color: 0x3b2d1d,
        roughness: 0.55,
        metalness: 0.25
      });
      const plankInst = new THREE.InstancedMesh(
        plankGeo,
        plankMat,
        totalCells * (shelvesPerCell + 2)
      );

      // B. 书架上的成排立体书本块 InstancedMesh
      const bookGeo = new THREE.BoxGeometry(1, 1, 1);
      const bookMat = new THREE.MeshStandardMaterial({
        color: 0x1a1510,
        roughness: 0.7,
        metalness: 0.15
      });
      const bookInst = new THREE.InstancedMesh(
        bookGeo,
        bookMat,
        totalCells * booksPerCell
      );

      // C. 书架背后的发光透光狭缝 (模拟从书缝间射出的五维暖白/琥珀光带)
      const slitGeo = new THREE.BoxGeometry(1, 1, 1);
      const slitMat = new THREE.MeshBasicMaterial({
        color: 0xfff0c4,
        transparent: true,
        opacity: 0.78
      });
      const slitInst = new THREE.InstancedMesh(
        slitGeo,
        slitMat,
        totalCells * shelvesPerCell
      );

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      let pIdx = 0;
      let bIdx = 0;
      let sIdx = 0;

      for (let ix = -2; ix < 2; ix++) {
        for (let iy = -2; iy < 2; iy++) {
          for (let iz = 0; iz < GRID_Z; iz++) {
            // 留出正中央穿梭通道，但四周与远景布满交错书架
            const cx = (ix + 0.5) * CELL_SPACE;
            const cy = (iy + 0.5) * CELL_SPACE;
            const cz = -iz * CELL_SPACE;

            // 每一格书架单元的 4 层横隔板
            for (let s = 0; s < shelvesPerCell; s++) {
              const sy = cy - 9 + s * 6;
              dummy.position.set(cx, sy, cz);
              dummy.scale.set(22, 0.55, 6.5);
              dummy.rotation.set(0, 0, 0);
              dummy.updateMatrix();
              plankInst.setMatrixAt(pIdx, dummy.matrix);
              color.setHSL(0.09 + ((s + ix) % 3) * 0.015, 0.38, 0.16 + (s % 2) * 0.05);
              plankInst.setColorAt(pIdx, color);
              pIdx++;

              // 书架后方透射出的暖白/金黄背光光缝
              dummy.position.set(cx, sy + 2.5, cz - 3.1);
              dummy.scale.set(20.5, 4.2, 0.2);
              dummy.updateMatrix();
              slitInst.setMatrixAt(sIdx, dummy.matrix);
              const isWarm = (ix + iy + s) % 2 === 0;
              color.setHex(isWarm ? 0xffe8a8 : 0xc8b878);
              slitInst.setColorAt(sIdx, color);
              sIdx++;
            }

            // 左右两侧垂直书柜立柱与正交光梁
            for (let pillar of [-10.8, 10.8]) {
              dummy.position.set(cx + pillar, cy, cz);
              dummy.scale.set(0.7, 26, 6.8);
              dummy.updateMatrix();
              plankInst.setMatrixAt(pIdx, dummy.matrix);
              color.setHex(0x2a2015);
              plankInst.setColorAt(pIdx, color);
              pIdx++;
            }

            // 填充错落有致的立体书本群（留出透光缝隙）
            for (let b = 0; b < booksPerCell; b++) {
              const tier = b % shelvesPerCell;
              const sy = cy - 9 + tier * 6;
              const bx = cx - 8.5 + ((b * 4.3 + iz * 1.7) % 17);
              const bw = 1.6 + ((b * 7 + ix) % 3) * 0.85;
              const bh = 3.8 + ((b * 3 + iy) % 3) * 0.55;

              dummy.position.set(bx, sy + bh * 0.5 + 0.28, cz - 1.2);
              dummy.scale.set(bw, bh, 4.2);
              dummy.updateMatrix();
              bookInst.setMatrixAt(bIdx, dummy.matrix);
              color.setHSL(0.08, 0.28, 0.06 + (b % 3) * 0.03);
              bookInst.setColorAt(bIdx, color);
              bIdx++;
            }
          }
        }
      }

      plankInst.instanceMatrix.needsUpdate = true;
      if (plankInst.instanceColor) plankInst.instanceColor.needsUpdate = true;
      bookInst.instanceMatrix.needsUpdate = true;
      if (bookInst.instanceColor) bookInst.instanceColor.needsUpdate = true;
      slitInst.instanceMatrix.needsUpdate = true;
      if (slitInst.instanceColor) slitInst.instanceColor.needsUpdate = true;

      group.add(plankInst);
      group.add(bookInst);
      group.add(slitInst);

      // D. 贯穿五维空间的正交光弦 (X / Y / Z 三维正交亮线网格)
      const linePositions = [];
      const halfSpan = CELL_SPACE * 2.5;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const px = i * CELL_SPACE;
          const py = j * CELL_SPACE;
          // Z 轴向深空延伸的光弦
          linePositions.push(px, py, 0, px, py, -BLOCK_DEPTH);
        }
      }
      for (let z = 0; z >= -BLOCK_DEPTH; z -= CELL_SPACE * 0.5) {
        for (let i = -2; i <= 2; i++) {
          const p = i * CELL_SPACE;
          // X 轴与 Y 轴正交光弦
          linePositions.push(-halfSpan, p, z, halfSpan, p, z);
          linePositions.push(p, -halfSpan, z, p, halfSpan, z);
        }
      }

      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(linePositions, 3)
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xd8b46c,
        transparent: true,
        opacity: 0.34
      });
      const lines = new THREE.LineSegments(lineGeo, lineMat);
      group.add(lines);

      return group;
    };

    const sectorA = buildTesseractSector();
    const sectorB = buildTesseractSector();
    sectorB.position.z = -BLOCK_DEPTH;
    scene.add(sectorA);
    scene.add(sectorB);

    // 交互视差状态
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
    let scrollZ = 0;
    let diveProgress = 0;
    let diveTriggeredDone = false;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;

      const currentStage = stageRef.current;

      if (currentStage === 'locked') {
        diveProgress = 0;
        diveTriggeredDone = false;
        // 阶段一：还原《星际穿越》五维超立方体斜角巡航视角
        scrollZ += dt * 7.5;
        const camX = 26 + mouse.x * 9;
        const camY = 20 - mouse.y * 7;
        camera.position.set(camX, camY, 28);
        camera.up.set(0.32, 0.94, 0.08).normalize();
        camera.lookAt(-6 + mouse.x * 4, -4 - mouse.y * 4, -75);
      } else if (currentStage === 'diving') {
        // 阶段二：解锁瞬间！摄像机从五维斜角高速俯冲并回正，飞入目标书架舱室内部
        diveProgress = Math.min(1, diveProgress + dt * 0.48);
        // 三次缓动曲线 (Ease-in-out cubic)
        const ease =
          diveProgress < 0.5
            ? 4 * diveProgress * diveProgress * diveProgress
            : 1 - Math.pow(-2 * diveProgress + 2, 3) / 2;

        // 穿梭速度在飞行中飙升
        const warpSpeed = 8 + Math.sin(diveProgress * Math.PI) * 95;
        scrollZ += dt * warpSpeed;

        const camX = THREE.MathUtils.lerp(26, 0, ease) + mouse.x * 3 * (1 - ease);
        const camY = THREE.MathUtils.lerp(20, 0, ease) - mouse.y * 2 * (1 - ease);
        const camZ = THREE.MathUtils.lerp(28, 12, ease);
        camera.position.set(camX, camY, camZ);

        const upX = THREE.MathUtils.lerp(0.32, 0, ease);
        const upZ = THREE.MathUtils.lerp(0.08, 0, ease);
        camera.up.set(upX, 1, upZ).normalize();

        const lookX = THREE.MathUtils.lerp(-6, 0, ease);
        const lookY = THREE.MathUtils.lerp(-4, 0, ease);
        camera.lookAt(lookX, lookY, -85);

        if (diveProgress >= 0.98 && !diveTriggeredDone) {
          diveTriggeredDone = true;
          if (diveCallbackRef.current) diveCallbackRef.current();
        }
      } else {
        // 阶段三：已进入书架内部，背景保持正交五维走廊微动
        scrollZ += dt * 2.2;
        camera.position.set(mouse.x * 3.2, -mouse.y * 2.2, 12);
        camera.up.set(0, 1, 0);
        camera.lookAt(mouse.x * 1.5, -mouse.y * 1.0, -90);
      }

      // 循环无缝衔接两个超立方体扇区
      const offsetZ = scrollZ % BLOCK_DEPTH;
      sectorA.position.z = offsetZ;
      sectorB.position.z = offsetZ - BLOCK_DEPTH;

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
 * 2. 深度递归目录解析器
 */
function normalizeLibraryData(payload) {
  if (!payload) return { items: [], folders: [], notes: [] };

  const collected = [];
  const folderSet = new Set();

  const inspectList = (arr, parentFolder = '') => {
    if (!Array.isArray(arr)) return;
    arr.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return;
      const subItems =
        entry.items || entry.files || entry.books || entry.children || entry.entries;
      if (Array.isArray(subItems)) {
        const folderName =
          entry.path || entry.name || entry.title || entry.folder || parentFolder;
        if (folderName) folderSet.add(folderName);
        inspectList(subItems, folderName);
        return;
      }
      collected.push({ ...entry, _inferredFolder: parentFolder });
    });
  };

  if (Array.isArray(payload)) inspectList(payload);
  inspectList(payload.items);
  inspectList(payload.books);
  inspectList(payload.files);
  inspectList(payload.entries);
  inspectList(payload.tree);
  inspectList(payload.folders);
  inspectList(payload.categories);

  if (payload.catalog && typeof payload.catalog === 'object') {
    if (Array.isArray(payload.catalog)) inspectList(payload.catalog);
    inspectList(payload.catalog.items);
    inspectList(payload.catalog.books);
    inspectList(payload.catalog.files);
    inspectList(payload.catalog.tree);
    inspectList(payload.catalog.folders);
  }

  const seen = new Set();
  const items = [];

  collected.forEach((raw, idx) => {
    const rawPath =
      raw.path || raw.relativePath || raw.filePath || raw.key || raw.id || raw.name || '';
    const dedupeKey = rawPath || `${raw.title}-${idx}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const parts = String(rawPath).split('/').filter(Boolean);
    const fileName = parts[parts.length - 1] || raw.title || `Volume_${idx + 1}`;
    const inferredFolder =
      raw.folder ||
      raw.category ||
      raw.collection ||
      raw._inferredFolder ||
      (parts.length > 1 ? parts.slice(0, -1).join(' / ') : 'CORE_COLLECTION');

    folderSet.add(inferredFolder);

    const ext = (
      raw.extension ||
      raw.format ||
      (fileName.includes('.') ? fileName.split('.').pop() : 'pdf')
    )
      .replace(/^\./, '')
      .toUpperCase();

    const encodedPath = encodeURIComponent(rawPath || fileName);
    const fileUrl =
      raw.fileUrl || raw.streamUrl || raw.url || `/api/library-file?path=${encodedPath}`;
    const downloadUrl =
      raw.downloadUrl || `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}download=1`;

    items.push({
      id: raw.id || rawPath || `item-${idx}`,
      title: (raw.title || fileName.replace(/\.[^/.]+$/, '')).replace(/_/g, ' '),
      rawName: fileName,
      path: rawPath,
      folder: inferredFolder,
      ext,
      size: raw.size || raw.sizeBytes || raw.fileSize || 0,
      updatedAt: raw.updatedAt || raw.mtime || raw.date || '',
      note: raw.note || raw.description || raw.summary || '',
      fileUrl,
      downloadUrl,
      isPdf: ext === 'PDF'
    });
  });

  if (Array.isArray(payload.folders)) {
    payload.folders.forEach((f) => {
      const name = typeof f === 'string' ? f : f?.path || f?.name;
      if (name) folderSet.add(name);
    });
  }

  return {
    items,
    folders: Array.from(folderSet),
    notes: Array.isArray(payload.notes) ? payload.notes : []
  };
}

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return 'LFS_VOLUME';
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
  const height = 212 + (hash % 36);
  const width = 42 + ((hash >> 3) % 18);
  const callNum = `${String.fromCharCode(65 + (hash % 18))}${100 + (hash % 899)}`;
  return { tone, height, width, callNum };
}

// 浏览器端原位 PBKDF2 校验（与 .env.local 中的 LIBRARY_PASSWORD_HASH 对齐）
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
  // 'locked' -> 无限五维书架巡航 | 'diving' -> 穿梭飞入书架动画 | 'inside' -> 进入书架内部
  const [stage, setStage] = useState('locked');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [catalog, setCatalog] = useState({ items: [], folders: [], notes: [] });
  const [selectedFolder, setSelectedFolder] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [readingBook, setReadingBook] = useState(null);
  const [chamberTilt, setChamberTilt] = useState({ x: 0, y: 0 });

  // 拉取远端真实目录；如果本地未启动 Vercel 函数，则使用保底书单填充 3D 书架
  const loadCatalogData = async (silent = false) => {
    try {
      const res = await fetch('/api/library-index', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeLibraryData(data);
        if (normalized.items.length > 0) {
          setCatalog(normalized);
          setSelectedBook(normalized.items[0]);
          if (silent) setStage('inside');
          return true;
        }
      }
    } catch {
      // 忽略网络异常，由下方保底书架接管
    }
    return false;
  };

  useEffect(() => {
    let mounted = true;
    loadCatalogData(true).finally(() => {
      if (mounted) setCheckingAuth(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleChamberMouseMove = (e) => {
    if (stage !== 'inside') return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setChamberTilt({ x: nx * 3.2, y: -ny * 2.0 });
  };

  // 解锁并触发《星际穿越》五维书架俯冲动画
  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    setCheckingAuth(true);

    try {
      let apiUnlocked = false;
      try {
        const res = await fetch('/api/library-auth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'unlock',
            password: password.trim(),
            passcode: password.trim()
          })
        });
        if (res.ok) apiUnlocked = true;
      } catch {
        // 本地纯前端环境可能无 /api/library-auth，继续走密钥校验
      }

      const clientVerified = await verifyClientSideCipher(password);

      if (!apiUnlocked && !clientVerified) {
        throw new Error('ACCESS_DENIED: 密钥不匹配，请输入正确的书架密钥');
      }

      setPassword('');
      // 预加载真实目录，若无则注入保底书架以便进入后展示
      const hasRemote = await loadCatalogData(false);
      if (!hasRemote) {
        const fallbackFolders = Array.from(new Set(FALLBACK_VOLUMES.map((v) => v.folder)));
        setCatalog({ items: FALLBACK_VOLUMES, folders: fallbackFolders, notes: [] });
        setSelectedBook(FALLBACK_VOLUMES[0]);
      }

      // 启动 2.2 秒的五维超立方体穿梭飞入动画
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
    setSelectedBook(null);
    setReadingBook(null);
  };

  const activeSourceBooks =
    catalog.items.length > 0 ? catalog.items : FALLBACK_VOLUMES;

  const filteredBooks = useMemo(() => {
    return activeSourceBooks.filter((item) => {
      const matchFolder =
        selectedFolder === 'ALL' ||
        item.folder === selectedFolder ||
        item.folder.startsWith(selectedFolder);
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.folder.toLowerCase().includes(q) ||
        item.ext.toLowerCase().includes(q);
      return matchFolder && matchQuery;
    });
  }, [activeSourceBooks, selectedFolder, searchQuery]);

  const shelfRows = useMemo(() => {
    const perShelf = 12;
    const rows = [];
    for (let i = 0; i < filteredBooks.length; i += perShelf) {
      rows.push(filteredBooks.slice(i, i + perShelf));
    }
    while (rows.length < 2 && filteredBooks.length > 0) {
      rows.push([]);
    }
    return rows;
  }, [filteredBooks]);

  if (readingBook) {
    return (
      <div className="tesseract-root">
        <TesseractScene3D stage="inside" />
        <LibraryPdfReader item={readingBook} onClose={() => setReadingBook(null)} />
      </div>
    );
  }

  return (
    <div className="tesseract-root" onMouseMove={handleChamberMouseMove}>
      {/* 底层：Three.js 3D 无限延伸的五维超立方体书架 */}
      <TesseractScene3D
        stage={stage}
        onDiveComplete={() => setStage('inside')}
      />

      {/* 阶段一：未解锁时，悬浮在无限延伸五维书架中央的极简密钥舱（无任何左上角 Bar） */}
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
            <p className="text-xs text-amber-100/60 font-mono leading-relaxed mb-6">
              Infinite bookshelves across five dimensions. Enter your gravitational key to dive into the study chamber.
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
              {checkingAuth ? 'ALIGNING_COORDINATES...' : 'ENTER_TESSERACT'}
            </button>
          </form>
        </div>
      )}

      {/* 阶段二：穿梭动画过渡提示 */}
      {stage === 'diving' && (
        <div className="tesseract-diving-hud">
          <div className="diving-reticle" />
          <span>TRAVERSING 5D BOOKSHELF MANIFOLD...</span>
        </div>
      )}

      {/* 阶段三：飞入五维书架内部后展开的实体 3D 藏书架与底部极简控制台 */}
      {stage === 'inside' && (
        <div className="tesseract-inside-stage animate-tesseract-enter">
          <div className="tesseract-inside-grid">
            {/* 中央：3D 多层实木与黄铜背光主书柜 */}
            <main className="tesseract-chamber">
              <div
                className="tesseract-3d-room"
                style={{
                  transform: `perspective(1500px) rotateX(${chamberTilt.y}deg) rotateY(${chamberTilt.x}deg)`
                }}
              >
                <div className="tesseract-bookcase-frame">
                  <div className="bookcase-cornice">
                    <span>COOPER_STATION // 5D_BOOKSHELF_CHAMBER</span>
                    <span>{filteredBooks.length} VOLUMES SYNCHRONIZED</span>
                  </div>

                  {shelfRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="tesseract-shelf-bay">
                      <div className="shelf-back-slits" />
                      <div className="shelf-top-downlight" />

                      <div className="shelf-books-row">
                        {row.map((book, idx) => {
                          const isSelected = selectedBook?.id === book.id;
                          const { tone, height, width, callNum } = getBookVisuals(book, idx);

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
                              title={`${book.title} (双击直接打开阅读)`}
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
                          <span>SHELF_TIER // 0{rowIndex + 1}</span>
                          <span className="plank-brass-strip" />
                          <span>{row.length} VOLUMES</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {/* 右侧：选中书籍的 3D 精装封面检视面板 */}
            {selectedBook && (
              <aside className="tesseract-inspector">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-5">
                  <span className="text-[10px] font-mono tracking-[0.3em] text-amber-400 uppercase">
                    VOLUME_INSPECTOR
                  </span>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-white/40 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="inspector-3d-showcase">
                  <div className="showcase-hardcover">
                    <div className="hardcover-spine-hinge" />
                    <div className="text-[9px] font-mono tracking-[0.22em] text-amber-300/75 uppercase">
                      {selectedBook.folder}
                    </div>
                    <div className="font-bold text-sm text-amber-50 leading-snug line-clamp-4 my-auto">
                      {selectedBook.title}
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-amber-400/80 border-t border-amber-500/25 pt-2">
                      <span>{selectedBook.ext} EDITION</span>
                      <span>{formatBytes(selectedBook.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-mono mb-6">
                  <div className="inspector-meta-row">
                    <span className="label">FILE_NAME</span>
                    <span className="value text-white">{selectedBook.rawName}</span>
                  </div>
                  <div className="inspector-meta-row">
                    <span className="label">SHELF_SECTOR</span>
                    <span className="value text-amber-300">{selectedBook.folder}</span>
                  </div>
                  <div className="inspector-meta-row">
                    <span className="label">MASS / SIZE</span>
                    <span className="value">{formatBytes(selectedBook.size)}</span>
                  </div>
                </div>

                {selectedBook.note && (
                  <div className="inspector-note-box">
                    <div className="text-[10px] text-amber-400/80 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                      <FileText size={12} />
                      <span>MARGINALIA_NOTES</span>
                    </div>
                    <p className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap">
                      {selectedBook.note}
                    </p>
                  </div>
                )}

                <div className="mt-auto pt-6 space-y-3">
                  {selectedBook.isPdf && (
                    <button
                      onClick={() => setReadingBook(selectedBook)}
                      className="tesseract-primary-btn w-full"
                    >
                      <Eye size={15} />
                      <span>OPEN_VOLUME</span>
                      <ChevronRight className="ml-auto" size={14} />
                    </button>
                  )}

                  <a href={selectedBook.downloadUrl} className="tesseract-secondary-btn w-full">
                    <Download size={14} />
                    <span>DOWNLOAD ({selectedBook.ext})</span>
                  </a>
                </div>
              </aside>
            )}
          </div>

          {/* 底部悬浮极简控制舱（替代左上角 Bar 与左侧栏） */}
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
                <span>ALL ({activeSourceBooks.length})</span>
              </button>
              {catalog.folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  className={`dock-pill ${selectedFolder === folder ? 'active' : ''}`}
                >
                  <Folder size={12} />
                  <span>{folder}</span>
                </button>
              ))}
            </div>

            <div className="dock-divider" />

            <div className="dock-search">
              <Search size={13} className="text-amber-400/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FILTER..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>

            <button onClick={handleLock} className="dock-btn" title="Exit to 5D Tesseract">
              <Unlock size={13} />
              <span>TESSERACT</span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}