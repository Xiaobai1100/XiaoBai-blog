import LogLayout from '../components/LogLayout';

const AboutBlog = () => (
  <LogLayout title="About This Blog" category="WebGL" date="DEC 21">
    <p>这是我的第一篇笔记。这个博客采用了 React 和 Three.js 构建。</p>
    <p>黑洞的视觉效果是基于物理模拟的吸积盘模型...</p>
    {/* 这里可以放任何你想放的 React 组件或图片 */}
  </LogLayout>
);

export default AboutBlog;