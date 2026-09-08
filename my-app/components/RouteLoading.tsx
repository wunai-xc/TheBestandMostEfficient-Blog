"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：大尺寸彩色面板（比屏幕小10px）以任意角度旋转扫过屏幕
 */
export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState({
    angle: 0,
    color: "#2563eb",
    color2: "#7c3aed",
    key: 0,
    vw: 0,
    vh: 0,
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

    setConfig((prev) => ({
      angle,
      color: pair[0],
      color2: pair[1],
      key: Date.now(),
      vw: window.innerWidth,
      vh: window.innerHeight,
    }));
    setActive(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!active) return null;

  const { angle, color, color2, key, vw, vh } = config;
  // 面板尺寸比屏幕小 10px
  const panelW = Math.max(1, vw - 10);
  const panelH = Math.max(1, vh - 10);
  // 扫描距离：面板对角线一半 + 屏幕对角线一半，确保从屏外到屏外
  const diag = Math.sqrt(panelW * panelW + panelH * panelH) / 2 + Math.sqrt(vw * vw + vh * vh) / 2;

  return (
    <>
      <style>{`
        @keyframes panel-sweep-${key} {
          0% {
            transform: rotate(${angle}deg) translate(0, -${diag}px) scale(0.85);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
            transform: rotate(${angle}deg) translate(0, -${diag}px) scale(0.9);
          }
          50% {
            transform: rotate(${angle}deg) translate(0, 0) scale(1);
            opacity: 0.95;
          }
          85% {
            opacity: 0.95;
            transform: rotate(${angle}deg) translate(0, ${diag}px) scale(0.9);
          }
          100% {
            transform: rotate(${angle}deg) translate(0, ${diag}px) scale(0.85);
            opacity: 0;
          }
        }
        @keyframes loading-text-${key} {
          0%, 100% { opacity: 0.5; letter-spacing: 0.3em; transform: rotate(${-angle}deg) scale(0.9); }
          50% { opacity: 1; letter-spacing: 0.6em; transform: rotate(${-angle}deg) scale(1.05); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: `${panelW}px`,
          height: `${panelH}px`,
          marginTop: `-${panelH / 2}px`,
          marginLeft: `-${panelW / 2}px`,
          background: `linear-gradient(135deg, ${color}cc 0%, ${color2}cc 50%, ${color}cc 100%)`,
          boxShadow: `inset 0 0 40px ${color}, inset 0 0 80px ${color2}, 0 0 60px ${color}, 0 0 120px ${color2}80`,
          transformOrigin: "center center",
          animation: `panel-sweep-${key} 1s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          zIndex: 9999,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `2px solid ${color}`,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "clamp(1.2rem, 4vw, 2.5rem)",
            textTransform: "uppercase",
            textShadow: `0 0 12px ${color}, 0 0 24px ${color2}, 0 0 48px ${color}`,
            animation: `loading-text-${key} 1s ease-in-out infinite`,
            whiteSpace: "nowrap",
            display: "inline-block",
            letterSpacing: "0.3em",
          }}
        >
          loading
        </span>
      </div>
    </>
  );
}
