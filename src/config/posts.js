import AboutBlog from '../pages/AboutBlog'; 
import ChristmasLog from '../pages/ChristmasLog';
import ChaosLog_1 from '../pages/ChaosLog_1';
import ChaosLog_2 from '../pages/ChaosLog_2';



export const POSTS = [
{
id: 'continuous-dynamics', // 新路由的 URL ID (如 /continuous-dynamics)
title: 'CONTINUOUS_DYNAMICS: DIFFERENTIAL_EQUATIONS_&_VECTOR_FIELDS',
category: 'RESEARCH',
date: '2026-04-22',
description: 'Transitioning from discrete maps to continuous differential equations, exploring vector fields and bifurcations.',
component: ChaosLog_2 // 关联到刚刚导入的组件
},

{
id: 'chaos-dynamics', // 路由使用的 ID
title: 'SIGNAL_RECEIVED: DYNAMICS_FIXED_POINTS_TO_CHAOS',
category: 'RESEARCH',
date: '2025-12-25',
description: 'From fixed points to the Feigenbaum constant: exploring the beauty of non-linear dynamics.',
component: ChaosLog_1 // 关键：指向你刚刚写的组件
},
  
{
id: 'christmas-2025',
title: 'MERRY_CHRISTMAS_2025',
category: 'EVENT',
date: '2025-12-25',
component: ChristmasLog // 引用刚才导入的组件
},

{
id: 'about-blog',
title: 'About This Blog',
category: 'Announcement', 
date: 'DEC 21',
component: AboutBlog // 这里引用了上面的导入
}
  ,
];

