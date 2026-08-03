"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
  layer: 0 | 1 | 2;
}

// Back to front: fewer, larger, faster stars in the near layer.
const LAYER_COUNTS = [80, 50, 25];
const LAYER_DRIFT = [0.008, 0.015, 0.025]; // px/frame, device-pixel-ratio adjusted below

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = window.devicePixelRatio || 1;

    let stars: Star[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;

    function resize() {
      width = canvas!.width = window.innerWidth * dpr;
      height = canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      seed();
    }

    function seed() {
      stars = LAYER_COUNTS.flatMap((count, layer) =>
        Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: (layer + 1) * 0.6 * dpr,
          baseOpacity: 0.3 + Math.random() * 0.5,
          twinkleSpeed: 0.3 + Math.random() * 0.7,
          layer: layer as 0 | 1 | 2,
        }))
      );
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);
      for (const s of stars) {
        if (!reduceMotion) {
          s.y -= LAYER_DRIFT[s.layer] * dpr;
          if (s.y < 0) s.y = height;
        }
        const twinkle = reduceMotion ? 1 : 0.7 + 0.3 * Math.sin(time * 0.0006 * s.twinkleSpeed);
        ctx!.globalAlpha = s.baseOpacity * twinkle;
        ctx!.fillStyle = "#f0eefc";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx!.fill();
      }
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        raf = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    if (reduceMotion) {
      draw(0); // one static paint, no loop — not just a slower loop
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />
  );
}
