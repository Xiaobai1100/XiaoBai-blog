import AboutBlog from '../pages/AboutBlog'; 
import ChristmasLog from '../pages/ChristmasLog';
import ChaosLog_1 from '../pages/ChaosLog_1';
import ChaosLog_2 from '../pages/ChaosLog_2';



export const POSTS = [
{
id: 'CHAOS 3: Poincaré-Bendixson Th. & RETURN MAP', 
title: 'CHAOS 3: Poincaré-Bendixson Th. & RETURN MAP',
category: 'RESEARCH',
date: '2026-04-22',
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

