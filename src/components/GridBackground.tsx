import React, { useEffect, useState } from 'react';

export default function GridBackground() {
  const [blocks, setBlocks] = useState<number[]>([]);

  useEffect(() => {
    const calculateBlocks = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const blockSize = 50; // 50x50 pixels per block
      const cols = Math.ceil(width / blockSize);
      const rows = Math.ceil(height / blockSize);
      setBlocks(Array.from({ length: cols * rows }));
    };

    calculateBlocks();
    window.addEventListener('resize', calculateBlocks);
    return () => window.removeEventListener('resize', calculateBlocks);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden flex flex-wrap" style={{ alignContent: 'flex-start' }}>
      {blocks.map((_, i) => (
        <div
          key={i}
          className="w-[50px] h-[50px] border-[0.5px] border-white/[0.015] transition-colors duration-500 hover:duration-0 hover:bg-neon-blue/20"
        />
      ))}
    </div>
  );
}
