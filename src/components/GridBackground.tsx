import React, { useEffect, useRef } from 'react';

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
      const numStars = Math.floor((canvas.width * canvas.height) / 1000); // More density
      for (let i = 0; i < numStars; i++) {
        const rand = Math.random();
        let type: 'small' | 'medium' | 'large' = 'small';
        let radius = Math.random() * 1 + 0.5; // Slightly larger base
        
        // Random floating velocity
        let vx = (Math.random() - 0.5) * 0.3;
        let vy = (Math.random() - 0.5) * 0.3 - 0.1; // Slight upward bias

        if (rand > 0.7) {
          type = 'medium';
          radius = Math.random() * 1.5 + 1.2;
          vx = (Math.random() - 0.5) * 0.5;
          vy = (Math.random() - 0.5) * 0.5 - 0.2;
        }
        if (rand > 0.92) {
          type = 'large';
          radius = Math.random() * 2.5 + 2;
          vx = (Math.random() - 0.5) * 0.7;
          vy = (Math.random() - 0.5) * 0.7 - 0.3;
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw premium deep space background with subtle nebulas
      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.5, 0,
        canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
      );
      bgGradient.addColorStop(0, '#0a0514'); // Deep purple-black center
      bgGradient.addColorStop(0.5, '#05030a'); // Darker
      bgGradient.addColorStop(1, '#020104'); // Pitch black edges
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle glowing orbs (nebulas)
      const drawNebula = (x: number, y: number, r: number, color: string) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      };

      // Neon Purple Nebula
      drawNebula(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4, 'rgba(188, 19, 254, 0.04)');
      // Neon Blue Nebula
      drawNebula(canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.4, 'rgba(0, 243, 255, 0.04)');
      // Neon Red/Orange Nebula
      drawNebula(canvas.width * 0.5, canvas.height * 0.9, canvas.width * 0.5, 'rgba(255, 0, 60, 0.03)');

      // Draw and update stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        // Add glow to stars
        if (star.type === 'large') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ffffff';
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        } else if (star.type === 'medium') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00f3ff';
          ctx.fillStyle = `rgba(200, 240, 255, ${star.alpha})`;
        } else {
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#bc13fe';
          ctx.fillStyle = `rgba(240, 200, 255, ${star.alpha})`;
        }

        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Move star (floating effect)
        star.x += star.vx;
        star.y += star.vy;
        
        // Wrap around
        if (star.y < -20) star.y = canvas.height + 20;
        if (star.y > canvas.height + 20) star.y = -20;
        if (star.x < -20) star.x = canvas.width + 20;
        if (star.x > canvas.width + 20) star.x = -20;

        // Twinkle effect
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[-1] pointer-events-none"
    />
  );
}
