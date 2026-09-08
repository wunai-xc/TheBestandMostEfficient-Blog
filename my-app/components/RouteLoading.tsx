"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：细长彩色光束从屏幕外以任意角度旋转扫过屏幕
 */
export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState({
    angle: 0,
    color: "#2563eb",
    color2: "#7c3aed",
    key: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const colors = [
      ["#2563eb", "#60a5fa"],
      ["#7c3aed", "#c084fc"],
      ["#db2777", "#f472b6"],
      ["#ea580c", "#fb923c"],
      ["#16a34a", "#4ade80"],
      ["#0891b2", "#22d3ee"],
      ["#dc2626", "#f87171"],
    ];
    const pair = colors[Math.floor(Math.random() * colors.length)];
    // 任意角度 0~360
    const angle = Math.floor(Math.random() * 360);

    setConfig({ angle, color: pair[0], color2: pair[1], key: Date.now() });
    setActive(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!active) return null;

  const { angle, color, color2, key } = config;

  return (
    <>
      <style>{`
        @keyframes beam-sweep-${key} {
          0% {
            transform: rotate(${angle}deg) translate(0, -120vh) scaleX(0.3);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: rotate(${angle}deg) translate(0, -120vh) scaleX(0.6);
          }
          50% {
            transform: rotate(${angle}deg) translate(0, 0) scaleX(1);
            opacity: 1;
          }
          85% {
            opacity: 1;
            transform: rotate(${angle}deg) translate(0, 120vh) scaleX(0.6);
          }
          100% {
            transform: rotate(${angle}deg) translate(0, 120vh) scaleX(0.3);
            opacity: 0;
          }
        }
        @keyframes loading-text-${key} {
          0%, 100% { opacity: 0.4; letter-spacing: 0.2em; }
          50% { opacity: 1; letter-spacing: 0.5em; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: "180vw",
          height: "6px",
          marginTop: "-3px",
          marginLeft: "-90vw",
          background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color2} 50%, ${color} 80%, transparent 100%)`,
          boxShadow: `0 0 12px ${color}, 0 0 32px ${color2}, 0 0 64px ${color}80`,
          transformOrigin: "center center",
          animation: `beam-sweep-${key} 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          zIndex: 9999,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "clamp(0.7rem, 1.6vw, 0.95rem)",
            textTransform: "uppercase",
            textShadow: `0 0 8px ${color}, 0 0 16px ${color2}`,
            animation: `loading-text-${key} 0.9s ease-in-out infinite`,
            whiteSpace: "nowrap",
            // 让文字反向旋转，保持水平阅读
            transform: `rotate(${-angle}deg)`,
            display: "inline-block",
          }}
        >
          loading
        </span>
      </div>
    </>
  );
}
