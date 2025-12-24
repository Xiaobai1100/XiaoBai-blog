import React from 'react';
import { motion } from 'framer-motion';

const ChristmasOverlay = () => {
  // 生成 50 片随机雪花的数据
  const snowflakes = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // 随机水平位置
    duration: Math.random() * 5 + 5, // 随机下落时间
    delay: Math.random() * 10, // 随机开始时间
    size: Math.random() * 4 + 2, // 随机大小
    opacity: Math.random() * 0.5 + 0.2, // 随机透明度
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] overflow-hidden">
      {snowflakes.map((snow) => (
        <motion.div
          key={snow.id}
          initial={{ y: -20, x: `${snow.x}vw`, opacity: 0 }}
          animate={{ 
            y: '110vh', 
            x: `${snow.x + (Math.random() * 10 - 5)}vw`, // 左右轻微晃动
            opacity: [0, snow.opacity, snow.opacity, 0] 
          }}
          transition={{
            duration: snow.duration,
            repeat: Infinity,
            delay: snow.delay,
            ease: "linear"
          }}
          className="absolute bg-white rounded-full blur-[1px]"
          style={{
            width: snow.size,
            height: snow.size,
          }}
        />
      ))}
      
      {/* 底部堆雪微光感 */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/5 to-transparent"></div>
    </div>
  );
};

export default ChristmasOverlay;