import React, { useEffect, useRef } from 'react';

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize for no transparency on base
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number; type: 'small' | 'medium' | 'large' }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      // Reduce density for better performance on mobile
      const numStars = Math.floor((canvas.width * canvas.height) / 3000); 
      for (let i = 0; i < numStars; i++) {
        const rand = Math.random();
        let type: 'small' | 'medium' | 'large' = 'small';
        let radius = Math.random() * 1 + 0.5;
        
        let vx = (Math.random() - 0.5) * 0.2;
        let vy = (Math.random() - 0.5) * 0.2 - 0.05;

        if (rand > 0.8) {
          type = 'medium';
          radius = Math.random() * 1.5 + 1.0;
          vx = (Math.random() - 0.5) * 0.3;
          vy = (Math.random() - 0.5) * 0.3 - 0.1;
        }
        if (rand > 0.95) {
          type = 'large';
          radius = Math.random() * 2.0 + 1.5;
          vx = (Math.random() - 0.5) * 0.4;
          vy = (Math.random() - 0.5) * 0.4 - 0.15;
        }

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          vx,
          vy,
          alpha: Math.random() * 0.5 + 0.3,
          type
        });
      }
    };

    const draw = () => {
      // Simple solid fill is much faster than gradients every frame
      ctx.fillStyle = '#030712'; // Base dark color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update stars without expensive shadowBlur
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        if (star.type === 'large') {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        } else if (star.type === 'medium') {
          ctx.fillStyle = `rgba(200, 240, 255, ${star.alpha})`;
        } else {
          ctx.fillStyle = `rgba(240, 200, 255, ${star.alpha})`;
        }

        ctx.fill();

        // Move star
        star.x += star.vx;
        star.y += star.vy;
        
        // Wrap around
        if (star.y < -20) star.y = canvas.height + 20;
        if (star.y > canvas.height + 20) star.y = -20;
        if (star.x < -20) star.x = canvas.width + 20;
        if (star.x > canvas.width + 20) star.x = -20;

        // Twinkle effect (simplified)
        star.alpha += (Math.random() - 0.5) * 0.05;
        if (star.alpha < 0.2) star.alpha = 0.2;
        if (star.alpha > 1) star.alpha = 1;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-[-2] pointer-events-none"
      />
      {/* Use CSS for nebulas instead of Canvas for GPU acceleration */}
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-40">
        <div className="absolute top-[30%] left-[20%] w-[40vw] h-[40vw] bg-neon-purple/10 rounded-full blur-[100px] mix-blend-screen transform-gpu"></div>
        <div className="absolute top-[70%] left-[80%] w-[40vw] h-[40vw] bg-neon-blue/10 rounded-full blur-[100px] mix-blend-screen transform-gpu"></div>
        <div className="absolute top-[90%] left-[50%] w-[50vw] h-[50vw] bg-neon-red/5 rounded-full blur-[120px] mix-blend-screen transform-gpu"></div>
      </div>
    </>
  );
}
