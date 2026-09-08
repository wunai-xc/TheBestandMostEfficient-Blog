"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

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
  const percent = Math.round(scale * 100);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
      <button className="icon-btn" onClick={() => apply(STEPS[Math.max(0, idx - 1)])} title="Decrease font" aria-label="Decrease font size">
        <Icon icon="mdi:format-font-size-decrease" width="1.2em" height="1.2em" />
      </button>
      <button className="icon-btn" onClick={() => apply(1.0)} title="Reset font" aria-label="Reset font size" style={{ minWidth: 40, textAlign: "center", fontSize: "0.75rem" }}>
        {percent}%
      </button>
      <button className="icon-btn" onClick={() => apply(STEPS[Math.min(STEPS.length - 1, idx + 1)])} title="Increase font" aria-label="Increase font size">
        <Icon icon="mdi:format-font-size-increase" width="1.2em" height="1.2em" />
      </button>
    </div>
  );
}
