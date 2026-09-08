"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：
 * - 持续时间 = 实际路由加载时间（点击内部链接启动，pathname 变化结束）
 * - 全程匀速直线运动（linear timing function）
 * - 进入→中央等待→退出 三阶段，平滑衔接
 */
const T = 0.4; // 单程匀速运动时长（秒）

export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<"enter" | "center" | "exit">("enter");
  const [config, setConfig] = useState({
    angle: 0,
    color: "#2563eb",
    color2: "#7c3aed",
    key: 0,
    vw: 0,
    vh: 0,
  });
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  // 监听内部链接点击 → 启动 loading
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      if (!href || /^(https?:|mailto:|#|tel:)/.test(href)) return;
      const target = href.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
      const current = pathname.replace(/\/$/, "") || "/";
      if (target === current) return;

      pendingRef.current = href;
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
      setPhase("enter");
      setActive(true);
      // 双 rAF 确保 enter 状态先渲染一次，再切到 center 触发匀速直线 transition
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setPhase("center"));
      });
    }
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  // pathname 变化 = 路由加载完成 → 触发退出
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!pendingRef.current) return;
    pendingRef.current = null;
    // 从当前状态匀速直线运动到 exit 位置
    setPhase("exit");
  }, [pathname]);

  if (!active) return null;

  const { angle, color, color2, key, vw, vh } = config;
  const panelW = Math.max(1, vw - 10);
  const panelH = Math.max(1, vh - 10);
  const diag = Math.sqrt(panelW * panelW + panelH * panelH) / 2 + Math.sqrt(vw * vw + vh * vh) / 2;
  const isLandscape = panelW >= panelH;
  const enterT = isLandscape ? `translate(0, -${diag}px)` : `translate(-${diag}px, 0)`;
  const exitT = isLandscape ? `translate(0, ${diag}px)` : `translate(${diag}px, 0)`;

  const transforms: Record<string, string> = {
    enter: `rotate(${angle}deg) ${enterT} scale(0.92)`,
    center: `rotate(${angle}deg) translate(0, 0) scale(1)`,
    exit: `rotate(${angle}deg) ${exitT} scale(0.92)`,
  };
  const opacities: Record<string, number> = { enter: 0, center: 0.92, exit: 0 };

  return (
    <>
      <style>{`
        @keyframes loading-pulse-${key} {
          0%, 100% { opacity: 0.6; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.6em; }
        }
      `}</style>
      <div
        onTransitionEnd={() => {
          if (phase === "exit") setActive(false);
        }}
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
          transform: transforms[phase],
          opacity: opacities[phase],
          transition: `transform ${T}s linear, opacity ${T}s linear`,
          transformOrigin: "center center",
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
            animation: phase === "center" ? `loading-pulse-${key} 0.8s ease-in-out infinite` : "none",
            whiteSpace: "nowrap",
            display: "inline-block",
            letterSpacing: "0.3em",
            transform: `rotate(${-angle}deg)`,
          }}
        >
          loading
        </span>
      </div>
    </>
  );
}
