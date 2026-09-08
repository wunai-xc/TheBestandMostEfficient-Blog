"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换时显示彩色条状 loading 页面
 * 条从屏幕任意边缘向对边移动，带 "loading" 字样
 */
export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [config, setConfig] = useState({ from: "left", color: "#2563eb" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 首次挂载不触发
    if (!pathname) return;

    // 随机选边缘与颜色
    const edges = ["left", "right", "top", "bottom"];
    const colors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2"];
    const from = edges[Math.floor(Math.random() * edges.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    setConfig({ from, color });
    setActive(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 700);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!active) return null;

  const { from, color } = config;

  // 根据起始边确定条的尺寸与起止位置
  const isHorizontal = from === "left" || from === "right";
  const barStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
    background: `linear-gradient(90deg, ${color}, ${color}cc, ${color})`,
    boxShadow: `0 0 24px ${color}, 0 0 48px ${color}80`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    fontSize: "clamp(0.75rem, 2vw, 1rem)",
    overflow: "hidden",
    pointerEvents: "none",
    animation: `routebar-${from} 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
  };

  if (isHorizontal) {
    barStyle.left = 0;
    barStyle.right = 0;
    barStyle.height = "28px";
    barStyle.top = "50%";
    barStyle.marginTop = "-14px";
  } else {
    barStyle.top = 0;
    barStyle.bottom = 0;
    barStyle.width = "28px";
    barStyle.left = "50%";
    barStyle.marginLeft = "-14px";
  }

  return (
    <>
      <style>{`
        @keyframes routebar-left {
          0% { transform: translateX(-100vw); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes routebar-right {
          0% { transform: translateX(100vw); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(-100vw); opacity: 0; }
        }
        @keyframes routebar-top {
          0% { transform: translateY(-100vh); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes routebar-bottom {
          0% { transform: translateY(100vh); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
      `}</style>
      <div style={barStyle}>
        <span style={{ animation: "loading-pulse 0.7s ease-in-out infinite" }}>
          loading
        </span>
        <style>{`
          @keyframes loading-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}
