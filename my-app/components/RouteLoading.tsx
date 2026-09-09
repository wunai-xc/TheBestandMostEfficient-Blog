"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换 loading：
 * - 纯色卡片（无透明填充、无模糊背景）
 * - 低饱和纸质配色，6 套方案随机切换
 * - 元素从左到右亮度递减 10%（每步 ×0.9，颜色逐渐变深，梯度不明显）
 * - 元素间固定间隔（GAP_PX）
 * - 纸质纹理：fractalNoise SVG + 多层叠加
 * - 毛边：clip-path polygon 多点抖动（每个形状独立 seed）
 * - 三角形头部"挖空"出 LOADING 字样（SVG mask + destination-out）
 * - 动画：单次右 → 左匀速滑动（linear forwards），跑完即结束
 *   起点在屏幕右外，终点在屏幕左外，时长 = loading 总时长
 *
 * 页面结构（左 → 右）：
 *   头   : 等腰三角形，底 = vh，水平高 = vh / 3，顶点向左
 *   1/2  : 长方形，宽 = vw / 2，高 = vh
 *   1/4  : 宽 = vw / 4
 *   1/8  : 宽 = vw / 8
 *   1/16 : 宽 = vw / 16
 */

// ============== 配置 ==============
const DURATION = 1.6;             // 单次右 → 左匀速滑动时长（秒）= loading 总时长
const GAP_PX = 12;                 // 元素之间固定间隔（像素）
const PAPER_OPACITY = 0.22;        // 纸质纹理叠加不透明度
const EDGE_POINTS = 28;           // 每条边毛边采样点数
const EDGE_JITTER = 0.014;        // 毛边抖动幅度（相对元素短边）

// 低饱和度基础色（HSL：H 0-360, S 0-1, L 0-1）
const BASE_COLORS: readonly (readonly [number, number, number])[] = [
  [210, 0.18, 0.30], // slate blue
  [200, 0.22, 0.32], // cool gray-blue
  [165, 0.20, 0.32], // teal
  [275, 0.20, 0.30], // muted purple
  [30,  0.22, 0.35], // warm tan
  [220, 0.12, 0.28], // dark slate
];

// 纸质噪声纹理（内联 SVG fractalNoise）
const PAPER_TEXTURE = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(%23n)' opacity='1'/>
  </svg>`
)}")`;

// "LOADING" 字样图：用于在三角形头部叠加显示
// 三角形为瘦高形（宽:高 = 1:3），用三角形内接长方形放置字
// 内接长方形：在三角形内部居中放一个长方形区域，字在长方形内
// 三角形顶点向左，右边是底，内接长方形放在右半部分（底附近）
// 字为浅色（带描边），直接画在三角形上
function loadingTextSvg(): string {
  // viewBox 120 x 360（宽:高 = 1:3 匹配三角形）
  // LOADING 7 个字母垂直排列，放在三角形内接长方形区域
  // 三角形顶点(0,180) 右上(120,0) 右下(120,360)
  // 内接长方形：右半部分，约 x: 60-110, y: 30-330
  const letters = "LOADING".split("");
  const letterH = 42;
  const startY = 30;
  const cx = 88; // 靠右，避开三角形顶点
  const letterSvg = letters
    .map((ch, i) => {
      const y = startY + i * letterH;
      return `<text x='${cx}' y='${y}' fill='#f5f3ee' stroke='#000' stroke-width='1.2'
        font-family='Arial Black, Impact, sans-serif'
        font-size='34' font-weight='900' text-anchor='middle' dominant-baseline='hanging'
        paint-order='stroke'>${ch}</text>`;
    })
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 360'>
    ${letterSvg}
  </svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

// ============== 工具函数 ==============
function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbStr(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

// 简单可重复伪随机
function rng(seed: number) {
  return (i: number) => {
    const v = Math.sin(seed * 9301.0 + i * 49297.0) * 233280.0;
    return v - Math.floor(v);
  };
}

/**
 * 生成矩形毛边多边形 clip-path（4 条边各采样 N 点 + 抖动）
 * 坐标空间 [0,1]x[0,1]，输出带 % 单位
 */
function makeRoughRectClip(seed: number): string {
  const r = rng(seed);
  const N = EDGE_POINTS;
  const j = EDGE_JITTER;
  const pts: string[] = [];

  // 顶边 左→右
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    pts.push(`${(t * 100).toFixed(4)}% ${(clamp01(0.5 + (r(i + 1) - 0.5) * j * 2) * 100).toFixed(4)}%`);
  }
  // 右边 上→下
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    pts.push(`${(clamp01(1 + (r(i + 11) - 0.5) * j * 2) * 100).toFixed(4)}% ${(t * 100).toFixed(4)}%`);
  }
  // 底边 右→左
  for (let i = 1; i <= N; i++) {
    const t = 1 - i / N;
    pts.push(`${(t * 100).toFixed(4)}% ${(clamp01(1 + (r(i + 23) - 0.5) * j * 2) * 100).toFixed(4)}%`);
  }
  // 左边 下→上
  for (let i = 1; i < N; i++) {
    const t = 1 - i / N;
    pts.push(`${(clamp01((r(i + 31) - 0.5) * j * 2) * 100).toFixed(4)}% ${(t * 100).toFixed(4)}%`);
  }
  return `polygon(${pts.join(", ")})`;
}

/**
 * 生成三角形毛边多边形（顶点向左：顶点(0%,50%) → 右上(100%,0%) → 右下(100%,100%)）
 * 输出带 % 单位
 */
function makeRoughTriClip(seed: number): string {
  const r = rng(seed);
  const N = EDGE_POINTS;
  const j = EDGE_JITTER;
  const pts: string[] = [];

  // 边 1：顶点(0,0.5) → 右上(1,0)
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = clamp01(t + (r(i + 1) - 0.5) * j * 2);
    const y = clamp01(0.5 - t * 0.5 + (r(i + 1) - 0.5) * j * 2);
    pts.push(`${(x * 100).toFixed(4)}% ${(y * 100).toFixed(4)}%`);
  }
  // 边 2：右上(1,0) → 右下(1,1)
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    pts.push(`${(clamp01(1 + (r(i + 11) - 0.5) * j * 2) * 100).toFixed(4)}% ${(t * 100).toFixed(4)}%`);
  }
  // 边 3：右下(1,1) → 顶点(0,0.5)
  for (let i = 1; i < N; i++) {
    const t = 1 - i / N;
    const x = clamp01(t + (r(i + 23) - 0.5) * j * 2);
    const y = clamp01(1 - t * 0.5 + (r(i + 23) - 0.5) * j * 2);
    pts.push(`${(x * 100).toFixed(4)}% ${(y * 100).toFixed(4)}%`);
  }
  return `polygon(${pts.join(", ")})`;
}

// ============== 形状定义 ==============
interface Shape {
  w: number;
  h: number;
  color: string;
  clip: string;
}

// ============== 组件 ==============
export default function RouteLoading() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [animKey, setAnimKey] = useState(0);
  const [dims, setDims] = useState({ vw: 0, vh: 0 });
  const pendingRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  const autoExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const base = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
    const headW = Math.max(1, vh / 3);
    const widths = [vw / 2, vw / 4, vw / 8, vw / 16];
    const baseSeed = Date.now() % 100000;

    // 颜色从左到右递减 10%（每步 ×0.9，亮度逐步降低，梯度不明显）
    // 头（最左）使用基础亮度；后续每个矩形依次衰减 10%
    const STEP_FACTOR = 0.9; // 每步亮度衰减系数（10% 递减）
    let currentL = base[2];

    const allShapes: Shape[] = [];
    allShapes.push({
      w: headW,
      h: vh,
      color: rgbStr(hslToRgb(base[0], base[1], currentL)),
      clip: makeRoughTriClip(baseSeed),
    });
    widths.forEach((w, i) => {
      currentL = Math.max(0.08, currentL * STEP_FACTOR); // 防止亮度过低
      allShapes.push({
        w,
        h: vh,
        color: rgbStr(hslToRgb(base[0], base[1], currentL)),
        clip: makeRoughRectClip(baseSeed + i + 1),
      });
    });

    setShapes(allShapes);
    setDims({ vw, vh });
    setAnimKey((k) => k + 1);
    setActive(true);
  }, []);

  const stopLoading = useCallback(() => setActive(false), []);

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

  if (!active || shapes.length === 0) return null;

  const { vw, vh } = dims;
  const gap = GAP_PX;
  const rowW = shapes.reduce((sum, s) => sum + s.w, 0) + gap * (shapes.length - 1);
  const animName = `loading-once-${animKey}`;

  // 用 CSS class 写入 clip-path，避免 React 内联 style 解析问题
  // 每次 animKey 变化时 class 名也变化，CSS 规则不会被旧规则污染
  // 三角形头部不加 mask，三角形完整可见，LOADING 字样作为独立层叠加
  const shapeClass = (i: number) => `loading-shape-${animKey}-${i}`;
  const texClass = (i: number) => `loading-tex-${animKey}-${i}`;
  const textClass = `loading-text-${animKey}`;
  const clipCss = shapes
    .map(
      (s, i) => `
      .${shapeClass(i)} {
        clip-path: ${s.clip};
        -webkit-clip-path: ${s.clip};
      }
      .${texClass(i)} {
        clip-path: ${s.clip};
        -webkit-clip-path: ${s.clip};
      }
    `
    )
    .join("\n");

  return (
    <div
      data-loading-overlay="1"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        overflow: "hidden",
        pointerEvents: "none",
        background: "transparent", // 整体透明，不挡下层页面
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: clipCss }} />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: `${vh}px`,
          display: "flex",
          alignItems: "stretch",
          gap: `${gap}px`,
          willChange: "transform",
          animation: `${animName} ${DURATION}s linear forwards`,
        }}
      >
        {shapes.map((s, i) => {
          const isHead = i === 0; // 三角形头部
          return (
            <div
              key={i}
              className={shapeClass(i)}
              style={{
                position: "relative",
                width: `${s.w}px`,
                height: `${s.h}px`,
                background: s.color,
                flexShrink: 0,
                isolation: "isolate", // 创建独立 stacking context，纸质纹理 mix-blend-mode 只在形状内部混合，不穿透到下层页面
              }}
            >
              {/* 纸质纹理叠加 - 第一层（粗颗粒，multiply） */}
              <div
                className={texClass(i)}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: PAPER_TEXTURE,
                  backgroundRepeat: "repeat",
                  backgroundSize: "240px 240px",
                  mixBlendMode: "multiply",
                  opacity: PAPER_OPACITY,
                  pointerEvents: "none",
                }}
              />
              {/* 纸质纹理叠加 - 第二层（细颗粒，soft-light） */}
              <div
                className={texClass(i)}
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage: PAPER_TEXTURE,
                  backgroundRepeat: "repeat",
                  backgroundSize: "120px 120px",
                  mixBlendMode: "soft-light",
                  opacity: PAPER_OPACITY * 0.6,
                  pointerEvents: "none",
                }}
              />
              {/* 三角形头部：LOADING 字样层（带三角形 clip-path，字只显示在三角形内部） */}
              {isHead && (
                <div
                  className={`${shapeClass(i)} ${textClass}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: loadingTextSvg(),
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                    backgroundSize: "100% 100%",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ${animName} {
          /* 起点：整行在屏幕右侧外（左端紧贴屏幕右缘） */
          from { transform: translateX(${vw}px); }
          /* 终点：整行完全滑出屏幕左侧外（右端紧贴屏幕左缘） */
          to { transform: translateX(${-rowW}px); }
        }
      `}</style>
    </div>
  );
}
