import { lazy } from 'react';

const AboutBlog = lazy(() => import('../pages/AboutBlog'));
const ChristmasLog = lazy(() => import('../pages/ChristmasLog'));
const ChaosLog_1 = lazy(() => import('../pages/ChaosLog_1'));
const ChaosLog_2 = lazy(() => import('../pages/ChaosLog_2'));
const ChaosLog_3 = lazy(() => import('../pages/ChaosLog_3'));
const ChaosLog_4 = lazy(() => import('../pages/ChaosLog_4'));
const ChaosLog_5 = lazy(() => import('../pages/ChaosLog_5'));
const BlackHoleLog = lazy(() => import('../pages/BlackHoleLog'));
const FemChapter1 = lazy(() => import('../pages/FemChapter1'));
const FemChapter2 = lazy(() => import('../pages/FemChapter2'));




export const POSTS = [
{
id: 'FemChapter2', 
title: 'FemChapter2',
category: 'GUEST_RESEARCH',
date: '2026-07-23',
description: 'FemChapter 2.',
component: FemChapter2 
},


{
id: 'FemChapter1', 
title: 'FemChapter1',
category: 'GUEST_RESEARCH',
date: '2026-07-21',
description: 'FemChapter 1.',
component: FemChapter1 
},

{
id: 'BlackHoleLog', 
title: 'BlackHoleLog',
category: 'RESEARCH',
date: '2026-05-1',
description: 'Gravity & BlackHole.',
component: BlackHoleLog 
},

{
id: 'CHAOS 5: CHAOS & STRANGE ATTRACTOR', 
title: 'CHAOS 5: CHAOS & STRANGE ATTRACTOR',
category: 'RESEARCH',
date: '2026-05-1',
description: 'CHAOS & STRANGE ATTRACTOR.',
component: ChaosLog_5
},

{
id: 'CHAOS 4: Lorenz Equation', 
title: 'CHAOS 4: Lorenz Equation',
category: 'RESEARCH',
date: '2026-04-28',
description: 'Lorenz Equation.',
component: ChaosLog_4 
},


{
id: 'CHAOS 3: Poincaré-Bendixson Th. & RETURN MAP', 
title: 'CHAOS 3: Poincaré-Bendixson Th. & RETURN MAP',
category: 'RESEARCH',
date: '2026-04-26',
description: 'Poincaré-Bendixson Th. & RETURN MAP.',
component: ChaosLog_3 
},


{
id: 'CHAOS 2: CONTINUOUS_DYNAMICS', 
title: 'CHAOS 2: CONTINUOUS_DYNAMICS',
category: 'RESEARCH',
date: '2026-04-22',
description: 'Transitioning from discrete maps to continuous differential equations, exploring vector fields and bifurcations.',
component: ChaosLog_2 
},

{
id: 'CHAOS 1: DYNAMICAL_SYSTEMS', 
title: 'CHAOS 1: DYNAMICAL_SYSTEMS',
category: 'RESEARCH',
date: '2025-12-25',
description: 'From fixed points to the Feigenbaum constant: exploring the beauty of non-linear dynamics.',
component: ChaosLog_1 
},
  
{
id: 'christmas-2025',
title: 'MERRY_CHRISTMAS_2025',
category: 'EVENT',
date: '2025-12-25',
component: ChristmasLog 
},

{
id: 'about-blog',
title: 'About This Blog',
category: 'Announcement', 
date: 'DEC 21',
component: AboutBlog 
}
  ,
];

