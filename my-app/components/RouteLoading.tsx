"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * Loading 弹窗：
 *
 * 布局：竖向长方形贴屏幕右侧
 *  ┌────────────────────┐
 *  │                    │
 *  │   G  (镂空)        │
 *  │   N  (镂空)        │  ← LOADING 竖向（旋转90°，文字掏空透出下层页面）
 *  │   I  (镂空)        │
 *  │   D  (镂空)        │
 *  │   A  (镂空)        │
 *  │   O  (镂空)        │
 *  │   L  (镂空)        │
 *  │                    │
 *  │               ┃█┃  │  ← 竖向进度条（最右）
 *  └────────────────────┘
 *
 * 动画阶段：
 * 1. enter: 从屏幕右外缓慢滑入到目标位置 + 淡入
 * 2. loading: 进度条 0% → 95%
 * 3. complete: 进度条 95% → 100%（快速完成）
 * 4. flash: 从进度条处向左发出一道闪光扫过到左边框
 * 5. fade: 缓慢变透明
 * 6. exit: 向右淡出滑出屏幕
 * 7. done: 隐藏
 *
 * 技术要点：
 * - 文字镂空：SVG mask（luminance 模式，白显黑镂）+ clip-path 共存
 * - 纸质纹理：fractalNoise SVG + mix-blend-mode multiply
 * - 毛边：clip-path polygon 多点抖动
 * - 闪光：CSS keyframes 从右向左扫过
 * - 多阶段动画：CSS transition + 阶段切换
 */

// ============ 配置 ============
const ENTER_DURATION = 0.5;        // 入场滑动时长（秒）
const PROGRESS_DURATION = 1.0;      // 进度条 0→95% 时长
const COMPLETE_DURATION = 0.15;     // 进度条 95→100% 快速完成
const FLASH_DURATION = 0.35;       // 闪光扫过时长
const FADE_DURATION = 0.4;          // 透明淡出时长
const EXIT_DURATION = 0.4;         // 向右淡出时长

const POPUP_WIDTH = 96;            // 弹窗宽度（px）
const BAR_WIDTH = 6;               // 进度条宽度（px）
const BAR_GAP = 10;                // 进度条与弹窗右边缘距离（px）
const SCREEN_MARGIN_V = 48;       // 弹窗与屏幕上下边缘距离（px）
const POPUP_RIGHT = 16;           // 弹窗最终位置距屏幕右边缘（px）
const FLASH_WIDTH = 14;           // 闪光宽度（px）

// ============ LOADING 文字 mask（镂空）============
// 白色背景 = 弹窗显示，黑色文字 = 镂空（透出下层页面）
// 文字横向排版 "LOADING"，以弹窗中心为原点旋转90度变竖向
function loadingMaskSvg(popupW: number, popupH: number): string {
  // 文字旋转后高度 ≈ 弹窗高 - 40（上下留 padding）
  const textH = popupH - 40;
  // fontSize ≈ textH / (7 * 0.82 + 6 * 0.12)  （7字母 + 6间距）
  const fontSize = Math.floor(textH / 6.5);
  const cx = popupW / 2;
  const cy = popupH / 2;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${popupW} ${popupH}'>
    <rect width='${popupW}' height='${popupH}' fill='white'/>
    <g transform='rotate(90 ${cx} ${cy})'>
      <text x='${cx}' y='${cy}' fill='black'
        font-family='Arial Black, Impact, sans-serif'
        font-size='${fontSize}' font-weight='900'
        text-anchor='middle' dominant-baseline='central'
        letter-spacing='6'>LOADING</text>
    </g>
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ============ 纸质纹理 ============
const PAPER_TEXTURE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(%23n)' opacity='1'/>
  </svg>`
)}")`;

// ============ 类型 ============
type Phase = "done" | "enter-init" | "enter" | "loading" | "complete" | "flash" | "fade" | "exit";

// ============ 组件 ============
export default function RouteLoading() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("done");
  const [dims, setDims] = useState({ vw: 0, vh: 0 });
  const [animKey, setAnimKey] = useState(0);
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const autoExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoading = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const seed = Date.now() % 100000;

    setDims({ vw, vh });
    setAnimKey((k) => k + 1);
    setPhase("enter-init");
    clearTimers();

    // 双 rAF 确保浏览器先渲染初始位置再触发 transition
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase("enter");
        // 入场后进入加载阶段
        timersRef.current.push(
          setTimeout(() => setPhase("loading"), ENTER_DURATION * 1000 + 50)
        );
      });
    });
  }, [clearTimers]);

  const stopLoading = useCallback(() => {
    clearTimers();
    // 进入 complete 阶段（进度条快速到 100%）
    setPhase("complete");
    // complete 后闪光
    timersRef.current.push(
      setTimeout(() => setPhase("flash"), COMPLETE_DURATION * 1000 + 50)
    );
    // 闪光后淡出
    timersRef.current.push(
      setTimeout(() => setPhase("fade"), (COMPLETE_DURATION + FLASH_DURATION) * 1000 + 50)
    );
    // 淡出后向右滑出
    timersRef.current.push(
      setTimeout(
        () => setPhase("exit"),
        (COMPLETE_DURATION + FLASH_DURATION + FADE_DURATION) * 1000 + 50
      )
    );
    // 完全结束
    timersRef.current.push(
      setTimeout(
        () => setPhase("done"),
        (COMPLETE_DURATION + FLASH_DURATION + FADE_DURATION + EXIT_DURATION) * 1000 + 50
      )
    );
  }, [clearTimers]);

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

    function onTriggerClick(e: MouseEvent) {
      const el = (e.target as HTMLElement)?.closest("[data-loading-trigger]");
      if (!el) return;
      e.preventDefault();
      if (autoExitTimer.current) clearTimeout(autoExitTimer.current);
      startLoading();
      autoExitTimer.current = setTimeout(() => stopLoading(), 2500);
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

  // 清理
  useEffect(() => () => clearTimers(), [clearTimers]);

  if (phase === "done") return null;

  const { vw, vh } = dims;
  const popupH = Math.max(200, vh - 2 * SCREEN_MARGIN_V);
  const popupW = POPUP_WIDTH;
  const maskUrl = loadingMaskSvg(popupW, popupH);
  const flashAnimName = `loading-flash-${animKey}`;

  // 计算位移和透明度
  let translateX = 0;
  let opacity = 1;
  let transition = "none";

  switch (phase) {
    case "enter-init":
      // 初始位置：屏幕右外
      translateX = popupW + POPUP_RIGHT + 20;
      opacity = 0;
      transition = "none";
      break;
    case "enter":
      // 滑入到目标位置
      translateX = 0;
      opacity = 1;
      transition = `transform ${ENTER_DURATION}s cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${ENTER_DURATION}s ease-out`;
      break;
    case "loading":
    case "complete":
      translateX = 0;
      opacity = 1;
      transition = "none";
      break;
    case "flash":
      translateX = 0;
      opacity = 1;
      transition = "none";
      break;
    case "fade":
      translateX = 0;
      opacity = 0;
      transition = `opacity ${FADE_DURATION}s ease-out`;
      break;
    case "exit":
      translateX = popupW + POPUP_RIGHT + 20;
      opacity = 0;
      transition = `transform ${EXIT_DURATION}s cubic-bezier(0.4, 0, 1, 1), opacity ${EXIT_DURATION}s ease-out`;
      break;
  }

  // 进度条填充百分比
  let barPct = 0;
  let barTransition = "none";
  switch (phase) {
    case "enter-init":
    case "enter":
      barPct = 0;
      barTransition = "none";
      break;
    case "loading":
      barPct = 95;
      barTransition = `height ${PROGRESS_DURATION}s linear`;
      break;
    case "complete":
      barPct = 100;
      barTransition = `height ${COMPLETE_DURATION}s ease-out`;
      break;
    case "flash":
    case "fade":
    case "exit":
      barPct = 100;
      barTransition = "none";
      break;
  }

  // 闪光起点：进度条左侧位置
  const flashStartX = popupW - BAR_GAP - BAR_WIDTH - FLASH_WIDTH;
  const flashEndX = 0;
  const showFlash = phase === "flash";

  return (
    <div
      data-loading-overlay="1"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <style>{`
        @keyframes ${flashAnimName} {
          0% {
            left: ${flashStartX}px;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: ${flashEndX}px;
            opacity: 0;
          }
        }
      `}</style>

      {/* 弹窗容器 */}
      {(() => {
        const popupStyle: React.CSSProperties = {
          position: "absolute",
          top: "50%",
          right: `${POPUP_RIGHT}px`,
          width: `${popupW}px`,
          height: `${popupH}px`,
          transform: `translateY(-50%) translateX(${translateX}px)`,
          opacity,
          transition,
          background: "var(--card, #2a2a2e)",
          maskImage: maskUrl,
          WebkitMaskImage: maskUrl,
          maskMode: "luminance",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          isolation: "isolate",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)",
        };
        // WebkitMaskMode 不在 React CSS 类型中，用扩展注入
        const popupStyleExt = { ...popupStyle, WebkitMaskMode: "luminance" } as React.CSSProperties;
        return (
      <div
        style={popupStyleExt}
      >
        {/* 纸质纹理 - 第一层（粗颗粒，multiply） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: PAPER_TEXTURE,
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px",
            mixBlendMode: "multiply",
            opacity: 0.2,
            pointerEvents: "none",
          }}
        />
        {/* 纸质纹理 - 第二层（细颗粒，soft-light） */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: PAPER_TEXTURE,
            backgroundRepeat: "repeat",
            backgroundSize: "100px 100px",
            mixBlendMode: "soft-light",
            opacity: 0.12,
            pointerEvents: "none",
          }}
        />

        {/* 进度条 */}
        <div
          style={{
            position: "absolute",
            right: `${BAR_GAP}px`,
            top: "20px",
            bottom: "20px",
            width: `${BAR_WIDTH}px`,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "3px",
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {/* 进度条填充（从下到上） */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${barPct}%`,
              background:
                "linear-gradient(to top, var(--accent, #5b8def), color-mix(in srgb, var(--accent, #5b8def) 60%, white))",
              transition: barTransition,
              boxShadow: "0 0 6px var(--accent, #5b8def), 0 0 12px color-mix(in srgb, var(--accent, #5b8def) 40%, transparent)",
              borderRadius: "3px",
            }}
          />
        </div>

        {/* 闪光（从进度条处向左扫过到左边框） */}
        {showFlash && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: `${FLASH_WIDTH}px`,
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 60%, transparent)",
              filter: "blur(1.5px)",
              left: `${flashStartX}px`,
              animation: `${flashAnimName} ${FLASH_DURATION}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`,
              boxShadow: "0 0 24px rgba(255,255,255,0.7), 0 0 48px rgba(255,255,255,0.3)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
        );
      })()}
    </div>
  );
}
