import React, { useEffect, useRef } from 'react';

export default function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: { x: number; y: number; radius: number; speed: number; alpha: number; type: 'small' | 'medium' | 'large' }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      const numStars = Math.floor((canvas.width * canvas.height) / 1500); // Adjust density
      for (let i = 0; i < numStars; i++) {
        const rand = Math.random();
        let type: 'small' | 'medium' | 'large' = 'small';
        let radius = Math.random() * 0.8 + 0.2;
        let speed = Math.random() * 0.2 + 0.05;

        if (rand > 0.8) {
          type = 'medium';
          radius = Math.random() * 1.2 + 0.8;
          speed = Math.random() * 0.4 + 0.1;
        }
        if (rand > 0.95) {
          type = 'large';
          radius = Math.random() * 2 + 1.5;
          speed = Math.random() * 0.6 + 0.2;
        }

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius,
          speed,
          alpha: Math.random(),
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
      drawNebula(canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4, 'rgba(188, 19, 254, 0.03)');
      // Neon Blue Nebula
      drawNebula(canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.4, 'rgba(0, 243, 255, 0.03)');
      // Neon Red/Orange Nebula
      drawNebula(canvas.width * 0.5, canvas.height * 0.9, canvas.width * 0.5, 'rgba(255, 0, 60, 0.02)');

      // Draw and update stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        // Add glow to larger stars
        if (star.type === 'large') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
        } else if (star.type === 'medium') {
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#00f3ff';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Move star upwards (parallax effect)
        star.y -= star.speed;
        
        // Wrap around
        if (star.y < -10) {
          star.y = canvas.height + 10;
          star.x = Math.random() * canvas.width;
        }

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
