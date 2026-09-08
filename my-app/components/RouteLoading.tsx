"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：
 * - 持续时间 = 实际路由加载时间（点击内部链接启动，pathname 变化结束）
 * - 全程匀速直线运动（linear timing function）
 * - 进入→中央等待→退出 三阶段，平滑衔接
 * - 拖尾效果：移动方向后方叠加 1/2、1/4、1/8、1/16 短边比例的渐隐副本
 */
const T = 0.4; // 单程匀速运动时长（秒）

const COLORS = [
  ["#2563eb", "#60a5fa"],
  ["#7c3aed", "#c084fc"],
  ["#db2777", "#f472b6"],
  ["#ea580c", "#fb923c"],
  ["#16a34a", "#4ade80"],
  ["#0891b2", "#22d3ee"],
  ["#dc2626", "#f87171"],
];

// 拖尾配置：比例（相对短边）、偏移距离（相对短边）、不透明度因子
const TRAILS = [
  { ratio: 1 / 2, offset: 0.25, opacity: 0.55 },
  { ratio: 1 / 4, offset: 0.5, opacity: 0.4 },
  { ratio: 1 / 8, offset: 0.75, opacity: 0.25 },
  { ratio: 1 / 16, offset: 1.0, opacity: 0.12 },
];

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
  const autoExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    const pair = COLORS[Math.floor(Math.random() * COLORS.length)];
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
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => setPhase("center"));
    });
  }, []);

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
      if (autoExitTimer.current) {
        clearTimeout(autoExitTimer.current);
        autoExitTimer.current = null;
      }
      startLoading();
    }

    // 支持 data-loading-trigger 属性的按钮/元素触发 loading（测试用）
    function onTriggerClick(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest("[data-loading-trigger]");
      if (!el) return;
      e.preventDefault();
      if (autoExitTimer.current) clearTimeout(autoExitTimer.current);
      startLoading();
      // 1.5 秒后自动退出，方便演示
      autoExitTimer.current = setTimeout(() => setPhase("exit"), 1500);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("click", onTriggerClick);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onTriggerClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (autoExitTimer.current) clearTimeout(autoExitTimer.current);
    };
  }, [pathname, startLoading]);

  // pathname 变化 = 路由加载完成 → 触发退出
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!pendingRef.current) return;
    pendingRef.current = null;
    if (autoExitTimer.current) {
      clearTimeout(autoExitTimer.current);
      autoExitTimer.current = null;
    }
    setPhase("exit");
  }, [pathname]);

  if (!active) return null;

  const { angle, color, color2, key, vw, vh } = config;
  const panelW = Math.max(1, vw - 10);
  const panelH = Math.max(1, vh - 10);
  const shortEdge = Math.min(panelW, panelH);
  const diag =
    Math.sqrt(panelW * panelW + panelH * panelH) / 2 +
    Math.sqrt(vw * vw + vh * vh) / 2;
  const isLandscape = panelW >= panelH;

  // 各阶段基础位移 [x, y]
  const baseTranslate: Record<string, [number, number]> = {
    enter: isLandscape ? [0, -diag] : [-diag, 0],
    center: [0, 0],
    exit: isLandscape ? [0, diag] : [diag, 0],
  };
  // 拖尾偏移方向（移动方向的反方向）
  const trailDir: [number, number] = isLandscape ? [0, -1] : [-1, 0];

  const scales: Record<string, number> = { enter: 0.92, center: 1, exit: 0.92 };
  const opacities: Record<string, number> = { enter: 0, center: 0.92, exit: 0 };

  const [bx, by] = baseTranslate[phase];
  const scale = scales[phase];
  const baseOpacity = opacities[phase];

  const panelStyle: React.CSSProperties = {
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
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${color}`,
    borderRadius: 0,
  };

  return (
    <>
      <style>{`
        @keyframes loading-pulse-${key} {
          0%, 100% { opacity: 0.6; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.6em; }
        }
      `}</style>

      {/* 拖尾元素：渲染在主面板之前，z-index 更低，位于后方 */}
      {TRAILS.map((t, i) => {
        const tx = bx + trailDir[0] * shortEdge * t.offset;
        const ty = by + trailDir[1] * shortEdge * t.offset;
        return (
          <div
            key={`trail-${i}`}
            style={{
              ...panelStyle,
              transform: `rotate(${angle}deg) translate(${tx}px, ${ty}px) scale(${scale * t.ratio})`,
              opacity: baseOpacity * t.opacity,
              transition: `transform ${T}s linear, opacity ${T}s linear`,
              zIndex: 9990 + i,
              border: "none",
              boxShadow: `inset 0 0 20px ${color}, 0 0 30px ${color2}60`,
            }}
          />
        );
      })}

      {/* 主面板 */}
      <div
        onTransitionEnd={() => {
          if (phase === "exit") setActive(false);
        }}
        style={{
          ...panelStyle,
          transform: `rotate(${angle}deg) translate(${bx}px, ${by}px) scale(${scale})`,
          opacity: baseOpacity,
          transition: `transform ${T}s linear, opacity ${T}s linear`,
          zIndex: 9999,
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "clamp(1.2rem, 4vw, 2.5rem)",
            textTransform: "uppercase",
            textShadow: `0 0 12px ${color}, 0 0 24px ${color2}, 0 0 48px ${color}`,
            animation:
              phase === "center"
                ? `loading-pulse-${key} 0.8s ease-in-out infinite`
                : "none",
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
