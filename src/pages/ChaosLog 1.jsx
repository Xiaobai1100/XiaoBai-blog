import React from 'react';
// Correcting the import path for LogLayout.
// Note: If you have a different folder structure, please adjust this path.
import LogLayout from '../components/LogLayout';

/**
 * Particle Christmas Tree Component (ParticleTree)
 * Features balanced proportions (higher and thinner) and a delicate glowing star on top.
 */
const ParticleTree = () => {
  // Tree structure configuration
  const layers = 16; 
  const particles = [];

  for (let i = 0; i < layers; i++) {
    // Width factor set to 1.4 for a balanced, sophisticated tree shape
    const rowCount = Math.floor(i / 1.4) + 1;
    for (let j = 0; j < rowCount; j++) {
      particles.push({
        id: `${i}-${j}`,
        row: i,
        col: j,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 2,
        size: Math.random() * 2.2 + 1.2,
      });
    }
  }

  return (
    <div className="relative py-16 flex flex-col items-center justify-center bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
      
      {/* Top Star - Refined w-6 h-6 size with amber glow */}
      <div className="relative mb-4 z-10">
        <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-40 animate-pulse"></div>
        <svg 
          viewBox="0 0 24 24" 
          className="w-6 h-6 fill-orange-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]"
        >
          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
        </svg>
      </div>

      {/* Particle Tree Body */}
      <div className="flex flex-col items-center">
        {Array.from({ length: layers }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5 mb-1.5">
            {particles
              .filter((p) => p.row === rowIndex)
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-full bg-orange-400/70 shadow-[0_0_6px_rgba(251,146,60,0.4)]"
                  style={{
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    animation: `particle-flicker ${p.duration}s infinite ease-in-out`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}
          </div>
        ))}
      </div>

      {/* Tree Trunk */}
      <div className="w-4 h-8 bg-orange-900/30 rounded-sm mt-1 border-t border-white/5 shadow-inner"></div>

      {/* Bottom Ambient Glow */}
      <div className="absolute bottom-[-20px] w-48 h-12 bg-orange-500/10 blur-3xl rounded-full"></div>

      <style>{`
        @keyframes particle-flicker {
          0%, 100% { opacity: 0.2; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
};

/**
 * Special Christmas Log Page Component
 */
const ChristmasLog = () => {
  return (
    <LogLayout 
      title="SIGNAL_RECEIVED: MERRY_CHRISTMAS_2025" 
      category="EVENT" 
      date="2025-12-25"
    >
      <div className="space-y-8 font-mono">
        
        {/* Particle Tree Section */}
        <ParticleTree />

        <section className="space-y-4 text-white/80 text-center md:text-left">
          <p>
            The singularity remains stable, but today, a strange pattern has emerged in the event horizon. 
            Clusters of crystallized data are falling like snow across the observation deck.
          </p>
          
          <div className="bg-orange-500/5 border-l-4 border-orange-500 p-6 italic text-orange-100/90 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]">
            "Even in the deepest void, there is a season for light and connection."
          </div>
        </section>

        <section className="space-y-4 text-white/80 text-center md:text-left">
          <h3 className="text-xl font-bold text-white tracking-widest uppercase border-b border-white/10 pb-2">System_Message</h3>
          <p>
            To everyone who has drifted into this corner of the digital void: 
            <strong className="text-orange-400"> Thank you for being part of the observation.</strong>
          </p>
          <p>
            Whether you are a fellow traveler, a dedicated researcher, or a wandering soul, 
            I wish you a peaceful Christmas, success in your academic journey, and the discovery of profound <strong>Serendipity</strong> in the coming year.
          </p>
        </section>

        {/* Interaction Section */}
        <div className="py-8 border-y border-white/5 text-center">
          <p className="text-sm text-white/40 mb-4">
            // The communication channel is wide open. 
            Feel free to leave your festive signals or reflections below.
          </p>
          <div className="inline-block px-4 py-2 bg-orange-600/20 border border-orange-600/50 text-orange-400 text-[10px] tracking-widest uppercase animate-pulse">
            Interaction_Required: Drop a comment or a reaction.
          </div>
        </div>

        <p className="text-xs opacity-30 italic text-right">
          -- XiaoBai SAMA // End of Transmission
        </p>
      </div>
    </LogLayout>
  );
};

export default ChristmasLog;