"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：大尺寸彩色面板（比屏幕小10px）以任意角度旋转扫过屏幕
 * 扫过时页面内容模糊度随之变化：清晰→模糊→清晰
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
    const angle = Math.floor(Math.random() * 360);

    setConfig({
      angle,
      color: pair[0],
      color2: pair[1],
      key: Date.now(),
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
    setActive(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!active) return null;

  const { angle, color, color2, key, vw, vh } = config;
  const panelW = Math.max(1, vw - 10);
  const panelH = Math.max(1, vh - 10);
  const diag = Math.sqrt(panelW * panelW + panelH * panelH) / 2 + Math.sqrt(vw * vw + vh * vh) / 2;
  const isLandscape = panelW >= panelH;
  const enter = isLandscape ? `translate(0, -${diag}px)` : `translate(-${diag}px, 0)`;
  const exit = isLandscape ? `translate(0, ${diag}px)` : `translate(${diag}px, 0)`;
  const dur = 0.25;

  return (
    <>
      <style>{`
        @keyframes panel-sweep-${key} {
          0% {
            transform: rotate(${angle}deg) ${enter} scale(0.85);
            opacity: 0;
          }
          10% {
            opacity: 0.92;
            transform: rotate(${angle}deg) ${enter} scale(0.9);
          }
          50% {
            transform: rotate(${angle}deg) translate(0, 0) scale(1);
            opacity: 0.92;
          }
          90% {
            opacity: 0.92;
            transform: rotate(${angle}deg) ${exit} scale(0.9);
          }
          100% {
            transform: rotate(${angle}deg) ${exit} scale(0.85);
            opacity: 0;
          }
        }
        @keyframes loading-text-${key} {
          0%, 100% { opacity: 0.5; letter-spacing: 0.3em; transform: rotate(${-angle}deg) scale(0.9); }
          50% { opacity: 1; letter-spacing: 0.6em; transform: rotate(${-angle}deg) scale(1.05); }
        }
        /* 页面内容模糊度：清晰→模糊→清晰 */
        @keyframes content-blur-${key} {
          0% { filter: blur(0px); }
          50% { filter: blur(8px); }
          100% { filter: blur(0px); }
        }
        .route-loading-blur {
          animation: content-blur-${key} ${dur}s cubic-bezier(0.45, 0, 0.55, 1) forwards;
        }
      `}</style>
      {/* 给页面内容包裹模糊层 */}
      <div
        className="route-loading-blur"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9998,
          pointerEvents: "none",
          backdropFilter: "blur(0px)",
        }}
      />
      {/* 扫过的彩色面板 */}
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
          animation: `panel-sweep-${key} ${dur}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
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
            animation: `loading-text-${key} ${dur}s ease-in-out infinite`,
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
