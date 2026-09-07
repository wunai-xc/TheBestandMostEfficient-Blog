"use client";

import { useEffect, useState } from "react";

const STEPS = [0.85, 0.92, 1.0, 1.08, 1.15, 1.22, 1.3];

export default function FontSizeControl() {
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    const s = parseFloat(localStorage.getItem("fontscale") || "1");
    setScale(s);
  }, []);

  function apply(s: number) {
    localStorage.setItem("fontscale", String(s));
    setScale(s);
    document.documentElement.setAttribute("data-font-scale", String(s));
  }

  const idx = STEPS.indexOf(scale);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <button className="icon-btn" onClick={() => apply(STEPS[Math.max(0, idx - 1)])} title="Decrease font" aria-label="Decrease font size">
        A−
      </button>
      <button className="icon-btn" onClick={() => apply(1.0)} title="Reset font" aria-label="Reset font size">
        A
      </button>
      <button className="icon-btn" onClick={() => apply(STEPS[Math.min(STEPS.length - 1, idx + 1)])} title="Increase font" aria-label="Increase font size">
        A+
      </button>
    </div>
  );
}
