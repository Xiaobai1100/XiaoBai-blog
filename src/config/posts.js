import AboutBlog from '../pages/AboutBlog'; 
import ChristmasLog from '../pages/ChristmasLog';
import ChaosLog_1 from '../pages/ChaosLog_1';
import ChaosLog_2 from '../pages/ChaosLog_2';
import ChaosLog_3 from '../pages/ChaosLog_3';
import ChaosLog_4 from '../pages/ChaosLog_4';
import ChaosLog_5 from '../pages/ChaosLog_5';
import BlackHoleLog from '../pages/BlackHoleLog';
import FemChapter1 from '../pages/FemChapter1';
import FemChapter2 from '../pages/FemChapter2';

export const POSTS = [
  {
    id: 'fem-chapter-2',
    title: 'FEM 2: CRITICAL ISSUES IN 1D & STABILITY',
    category: 'EXTERNAL_TRANSMISSION',
    date: '2026-07-22',
    status: 'DECRYPTED',
    description: 'Higher-order P2 elements, advection-dominated instabilities, and SUPG stabilization.',
    component: FemChapter2
  },
  {
    id: 'fem-chapter-1',
    title: 'FEM 1: 1D SELF-ADJOINT SOLVER',
    category: 'EXTERNAL_TRANSMISSION',
    date: '2026-07-17',
    status: 'DECRYPTED',
    description: 'Weak formulation, Gaussian quadrature assembly, and L2/H1 convergence analysis.',
    component: FemChapter1
  },
  {
    id: 'black-hole-relativity',
    title: 'RELATIVITY: GARGANTUA & SCHWARZSCHILD',
    category: 'ASTROPHYSICS',
    date: '2026-05-01',
    status: 'DECRYPTED',
    description: 'General Relativity, ISCO, Doppler beaming, and Shakura-Sunyaev accretion dynamics.',
    component: BlackHoleLog
  },
  {
    id: 'chaos-log-5',
    title: 'CHAOS 5: STRANGE ATTRACTOR (FINALE)',
    category: 'RESEARCH',
    date: '2026-05-01',
    status: 'DECRYPTED',
    description: 'Fractal geometry, Lyapunov exponents, and the prediction horizon of the Lorenz butterfly.',
    component: ChaosLog_5
  },
  {
    id: 'chaos-log-4',
    title: 'CHAOS 4: LORENZ EQ. & SADDLE CYCLE',
    category: 'RESEARCH',
    date: '2026-04-28',
    status: 'DECRYPTED',
    description: 'Chaotic water wheel, Fourier reduction, volume contraction, and subcritical Hopf bifurcation.',
    component: ChaosLog_4
  },
  {
    id: 'chaos-log-3',
    title: 'CHAOS 3: POINCARE-BENDIXSON & RETURN MAP',
    category: 'RESEARCH',
    date: '2026-04-25',
    status: 'DECRYPTED',
    description: 'Poincaré-Bendixson Theorem & Return Map analysis in continuous phase space.',
    component: ChaosLog_3 
  },
  {
    id: 'chaos-log-2',
    title: 'CHAOS 2: CONTINUOUS_DYNAMICS',
    category: 'RESEARCH',
    date: '2026-04-22',
    status: 'DECRYPTED',
    description: 'Transitioning from discrete maps to continuous differential equations and limit cycles.',
    component: ChaosLog_2 
  },
  {
    id: 'chaos-log-1',
    title: 'CHAOS 1: DYNAMICAL_SYSTEMS',
    category: 'RESEARCH',
    date: '2025-12-25',
    status: 'DECRYPTED',
    description: 'From fixed points to the Feigenbaum constant: exploring the beauty of non-linear dynamics.',
    component: ChaosLog_1 
  },
  {
    id: 'christmas-2025',
    title: 'MERRY_CHRISTMAS_2025',
    category: 'EVENT',
    date: '2025-12-25',
    status: 'ARCHIVED',
    component: ChristmasLog 
  },
  {
    id: 'about-blog',
    title: 'About This Blog',
    category: 'ANNOUNCEMENT', 
    date: '2025-12-21',
    status: 'ONLINE',
    component: AboutBlog 
  }
];