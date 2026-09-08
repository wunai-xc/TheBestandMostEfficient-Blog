"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：
 * - 纯色卡片（无透明、无渐变、无模糊）
 * - 低饱和柔和配色，每次加载随机切换
 * - 动画：仅从右向左匀速滑动（linear）
 *
 * 页面结构（左 → 右）：
 *   头   : 等腰三角形，底 = 屏幕高(vh)，高(水平) = vh / 3，顶点向左
 *   1/2  : 长方形，宽 = vw / 2，高 = vh
 *   1/4  : 宽 = vw / 4
 *   1/8  : 宽 = vw / 8
 *   1/16 : 宽 = vw / 16
 */

// 低饱和度配色方案（每套 5 色，依次对应 头 / 1/2 / 1/4 / 1/8 / 1/16）
const PALETTES: readonly (readonly string[])[] = [
  ["#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1"], // slate
  ["#1e3a5f", "#2c5282", "#3b6ea5", "#6b9dc4", "#a8c8e0"], // blue
  ["#264653", "#2a9d8f", "#52b788", "#74c69d", "#95d5b2"], // teal-green
  ["#3d2e4f", "#563f6f", "#7e5a9b", "#a98bc4", "#d4b8e8"], // purple
  ["#5c4033", "#8b5e3c", "#b07d4f", "#c9a27b", "#dfc4a5"], // warm brown
  ["#2d3436", "#4a5568", "#718096", "#a0aec0", "#cbd5e0"], // gray
];

const DURATION = 1.6; // 单次右 → 左匀速滑动时长（秒）

export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [palette, setPalette] = useState<readonly string[]>(PALETTES[0]);
  const [animKey, setAnimKey] = useState(0);
  const [dims, setDims] = useState({ vw: 0, vh: 0 });
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const autoExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    setPalette(PALETTES[Math.floor(Math.random() * PALETTES.length)]);
    setAnimKey((k) => k + 1);
    setDims({ vw: window.innerWidth, vh: window.innerHeight });
    setActive(true);
  }, []);

  const stopLoading = useCallback(() => {
    setActive(false);
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

    // 支持 data-loading-trigger 属性触发 loading（演示用）
    function onTriggerClick(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest("[data-loading-trigger]");
      if (!el) return;
      e.preventDefault();
      if (autoExitTimer.current) clearTimeout(autoExitTimer.current);
      startLoading();
      // 1.5 秒后自动退出，方便演示
      autoExitTimer.current = setTimeout(() => stopLoading(), 1500);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("click", onTriggerClick);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("click", onTriggerClick);
      if (autoExitTimer.current) clearTimeout(autoExitTimer.current);
    };
  }, [pathname, startLoading, stopLoading]);

  // pathname 变化 = 路由加载完成 → 停止 loading
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
    stopLoading();
  }, [pathname, stopLoading]);

  if (!active) return null;

  const { vw, vh } = dims;

  // 头：等腰三角形，底(竖直) = vh，水平高度 = vh / 3
  const headW = Math.max(1, vh / 3);
  // 1/2, 1/4, 1/8, 1/16 长方形宽
  const widths = [vw / 2, vw / 4, vw / 8, vw / 16];
  // 单行总宽
  const rowW = headW + widths.reduce((a, b) => a + b, 0);

  // 渲染两份相同内容，实现无缝循环：
  // 位移从 translateX(vw) → translateX(vw - rowW)，循环时第二份正好接上第一份
  const COPIES = 2;
  const animName = `loading-rtl-${animKey}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: `${vh}px`,
          display: "flex",
          alignItems: "stretch",
          willChange: "transform",
          animation: `${animName} ${DURATION}s linear infinite`,
        }}
      >
        {Array.from({ length: COPIES }).map((_, ci) => (
          <div
            key={ci}
            style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}
          >
            {/* 头：等腰三角形，顶点向左 */}
            <div
              style={{
                width: `${headW}px`,
                height: `${vh}px`,
                background: palette[0],
                clipPath: "polygon(0 50%, 100% 0, 100% 100%)",
                flexShrink: 0,
              }}
            />
            {/* 1/2, 1/4, 1/8, 1/16 */}
            {widths.map((w, i) => (
              <div
                key={i}
                style={{
                  width: `${w}px`,
                  height: `${vh}px`,
                  background: palette[i + 1],
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ${animName} {
          from { transform: translateX(${vw}px); }
          to { transform: translateX(${vw - rowW}px); }
        }
      `}</style>
    </div>
  );
}
