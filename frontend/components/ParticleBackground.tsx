"use client";

import { useEffect, useRef } from "react";

type ParticleBackgroundProps = {
  className?: string;
  count?: number;
};

export default function ParticleBackground({ className = "", count = 48 }: ParticleBackgroundProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const particles = Array.from({ length: count }).map(() => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      alpha: 0,
      r: 0,
    }));

    const resetParticle = (idx: number) => {
      particles[idx].x = Math.random() * canvas.width;
      particles[idx].y = Math.random() * canvas.height;
      particles[idx].vx = Math.random() * 0.35 - 0.175;
      particles[idx].vy = Math.random() * 0.35 - 0.175;
      particles[idx].alpha = Math.random() * 0.45 + 0.1;
      particles[idx].r = Math.random() * 2 + 0.7;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    particles.forEach((_, idx) => resetParticle(idx));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -6 || p.x > canvas.width + 6 || p.y < -6 || p.y > canvas.height + 6) {
          resetParticle(idx);
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return <canvas ref={ref} className={className} />;
}
