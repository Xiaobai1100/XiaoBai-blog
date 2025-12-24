import AboutBlog from '../pages/AboutBlog'; 
import ChristmasLog from '../pages/ChristmasLog';


export const POSTS = [

  
  
{
    id: 'christmas-2025',
    title: 'SIGNAL_RECEIVED: MERRY_CHRISTMAS_2025',
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

