"use client";

import { useEffect, useState } from "react";

export function ShootingStar() {
  const [visible, setVisible] = useState(false);
  const [instance, setInstance] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = 45_000 + Math.random() * 45_000; // 45–90s, sparse by design
      timeout = setTimeout(() => {
        setInstance((i) => i + 1);
        setVisible(true);
        setTimeout(() => setVisible(false), 1200);
        schedule();
      }, delay);
    }
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div
      key={instance}
      aria-hidden="true"
      className="pointer-events-none fixed left-[15%] top-[20%] -z-10 h-px w-24 origin-left animate-[shooting-star_1.2s_ease-out_forwards] bg-gradient-to-r from-transparent via-[var(--text)] to-transparent"
    />
  );
}
