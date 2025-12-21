import LogLayout from '../components/LogLayout';

const AboutBlog = () => (
  <LogLayout title="Log1: About This Blog" category="Announcement" date="DEC 21">
    {/* 使用 space-y-6 让段落之间有呼吸感 */}
    <div className="space-y-6 text-white/80 font-mono leading-relaxed">
      <p>
        This is my first blog. The reason I built this space is that in the midst of constant divergent thinking, 
        we often lose track of ideas because we don't revisit them enough, or we’re forced to set them aside due to limited energy. 
        Some of these ideas are truly fascinating, and I want a place to preserve them.
      </p>
      
      <p className="border-l-2 border-cyan-500/30 pl-4 bg-white/5 py-2">
        Here, I’ll be periodically creating things that are <span className="text-cyan-400">"fun but not necessarily practical,"</span> 
        alongside uploading questions, thoughts, and notes. This blog is mostly just me rambling—if you spot any inaccuracies, 
        feel free to point them out.
      </p>
      
      <p>
        I have plans to add a discussion forum and a comment section in the future. 
        Maybe it’ll evolve into a full-blown social platform, or maybe it’ll stay a quiet corner for random musings. 
        Anyway, I’ll be updating this whenever inspiration strikes.
      </p>
    </div>
  </LogLayout>
);

export default AboutBlog;