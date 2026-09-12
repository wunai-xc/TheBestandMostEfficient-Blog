"use client";

import { useEffect, useRef } from "react";

/* ===== 可调参数（集中放置，便于后续调优） ===== */
const MAX_DPR = 2; // 设备像素比上限：高分屏不做 3x 渲染，避免填充率爆炸
const FRAME_MS = 1000 / 60; // 运动归一化基准（不同刷新率下手感一致）
const BASE_SPACING = 26; // 网格间距（px）
const NARROW_SPACING = 22; // 窄屏（< 640px）间距，点更密一些
const NARROW_WIDTH = 640;
const MAX_DOTS = 3000; // 网格点上限：超出则自动放大间距
const POINTER_RADIUS_FACTOR = 5; // 影响半径 = 间距 × 该系数
const POINTER_RADIUS_MIN = 120;
const PUSH_PER_SPACING = 0.052; // 指针推力系数（× 间距）→ 与网格密度无关的手感
const SPRING = 0.09; // 回弹弹簧刚度：点被推开后自行归位
const DAMPING = 0.86; // 速度阻尼
const MAX_SHIFT_RATIO = 0.75; // 最大位移 = 间距 × 该系数，避免相邻点互换
/* 静止判定阈值（px/帧）²：低于此值视为肉眼不可见的微动，可停帧省电 */
const REST_V2 = 0.0025;
/* 触摸后浏览器会补发一套 pointerType="mouse" 的兼容事件；
   在此时窗内忽略它，否则抬指后点会被误当成"鼠标停在那里"而回不了位 */
const TOUCH_GUARD_MS = 1000;

/* 位移分 4 档：档位越高（被推得越远）越大、越亮，并转为强调色 */
const BAND_EDGES = [0, 0.3, 0.55, 0.8, 1];
const BAND_ALPHA = [0.3, 0.45, 0.6, 0.85];
const BAND_RADIUS = [1, 1.3, 1.6, 1.9];
const BANDS = BAND_EDGES.length - 1;

export default function InteractiveBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;

    /* 每个点 6 个分量：baseX, baseY, offsetX, offsetY, velX, velY。
       用扁平定长数组，避免每帧产生对象垃圾 */
    let dots = new Float32Array(0);
    let count = 0;
    let cols = 0;
    let rows = 0;

    let w = 0;
    let h = 0;
    let spacing = BASE_SPACING;
    let radius = 1.8;
    let pointerRadius = POINTER_RADIUS_MIN;
    let pointerRadius2 = POINTER_RADIUS_MIN * POINTER_RADIUS_MIN;
    let pushForce = BASE_SPACING * PUSH_PER_SPACING;
    let maxShift = BASE_SPACING * MAX_SHIFT_RATIO;
    let maxShift2 = maxShift * maxShift;
    /* 分档边界换算到"位移平方"上，热循环里可省掉开方 */
    let bandLo2: number[] = [];
    let bandHi2: number[] = [];

    let raf = 0;
    let running = false;
    /* 静帧状态：网格已静止（含指针悬停不动），循环已停；指针一动即被唤醒 */
    let idle = false;
    let lastTs = 0;
    let resizeRaf = 0;

    const pointer = { x: 0, y: 0, active: false };
    /* 当前主题下整体透明度系数：暗色背景上高亮度的点会显得更抢眼，
       按系数压低以保持与浅色模式相近的"若有若无"观感 */
    let alphaScale = 1;
    /* 最近一次触摸事件的时间戳，用于屏蔽触摸后的兼容鼠标事件 */
    let lastTouchAt = 0;

    let dotColor = "rgb(120,120,120)";
    let accentColor = "rgb(37,99,235)";

    /* ---------- 工具 ---------- */

    function parseColor(input: string | null | undefined): { r: number; g: number; b: number } | null {
      const s = (input || "").trim();
      if (!s) return null;
      let m = s.match(/^#([0-9a-f]{3})$/i);
      if (m) {
        const [r, g, b] = m[1];
        return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16) };
      }
      m = s.match(/^#([0-9a-f]{6})/i);
      if (m) {
        return {
          r: parseInt(m[1].slice(0, 2), 16),
          g: parseInt(m[1].slice(2, 4), 16),
          b: parseInt(m[1].slice(4, 6), 16),
        };
      }
      m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
      if (m) return { r: Math.round(+m[1]), g: Math.round(+m[2]), b: Math.round(+m[3]) };
      return null;
    }

    /* 跟随主题（亮/暗）读取颜色：静止点用前景色，被推开的点转为强调色 */
    function readTheme() {
      const isDark = document.documentElement.classList.contains("dark");
      alphaScale = isDark ? 0.62 : 1;
      const fg = parseColor(getComputedStyle(document.body).color) || { r: 128, g: 128, b: 128 };
      const accent =
        parseColor(getComputedStyle(document.documentElement).getPropertyValue("--accent")) || fg;
      dotColor = `rgb(${fg.r},${fg.g},${fg.b})`;
      accentColor = `rgb(${accent.r},${accent.g},${accent.b})`;
    }

    /* ---------- 网格构建 ---------- */

    function buildGrid() {
      spacing = w < NARROW_WIDTH ? NARROW_SPACING : BASE_SPACING;
      // 超大屏上自动放大间距，把点数压在 MAX_DOTS 以内
      const minSpacing = Math.sqrt((w * h) / MAX_DOTS);
      if (minSpacing > spacing) spacing = minSpacing;

      cols = Math.ceil(w / spacing) + 1;
      rows = Math.ceil(h / spacing) + 1;
      count = cols * rows;
      dots = new Float32Array(count * 6);

      // 基准位置按行优先写入；偏移与速度初始为 0（新 Float32Array 已置零）
      for (let r = 0; r < rows; r++) {
        const y = r * spacing;
        for (let c = 0; c < cols; c++) {
          const o = (r * cols + c) * 6;
          dots[o] = c * spacing;
          dots[o + 1] = y;
        }
      }

      radius = Math.min(2.4, Math.max(1.2, spacing * 0.07));
      pointerRadius = Math.max(POINTER_RADIUS_MIN, spacing * POINTER_RADIUS_FACTOR);
      pointerRadius2 = pointerRadius * pointerRadius;
      pushForce = spacing * PUSH_PER_SPACING;
      maxShift = spacing * MAX_SHIFT_RATIO;
      maxShift2 = maxShift * maxShift;
      bandLo2 = BAND_EDGES.slice(0, BANDS).map((f) => (f * maxShift) ** 2);
      bandHi2 = BAND_EDGES.slice(1).map((f) => (f * maxShift) ** 2);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      // canvas.width 赋值会重置上下文状态，需重新设置变换
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    }

    /* ---------- 运动与绘制 ---------- */

    function step(k: number): boolean {
      const damp = Math.pow(DAMPING, k);
      const active = pointer.active;
      const px = pointer.x;
      const py = pointer.y;
      const pr2 = pointerRadius2;
      const invR = 1 / pointerRadius;
      const force = pushForce * k;
      const spring = SPRING * k;
      let maxV2 = 0;

      for (let i = 0; i < count; i++) {
        const o = i * 6;
        const bx = dots[o];
        const by = dots[o + 1];
        let ox = dots[o + 2];
        let oy = dots[o + 3];
        let vx = dots[o + 4];
        let vy = dots[o + 5];

        // 指针斥力：落在影响半径内的点被推离光标/触点，越近推力越大
        if (active) {
          let nx = bx + ox - px;
          let ny = by + oy - py;
          let d2 = nx * nx + ny * ny;
          if (d2 < pr2) {
            let d = Math.sqrt(d2);
            // 点与指针几乎重合时给一个确定方向，避免除以 0 后原地不动
            if (d < 0.001) {
              nx = 1;
              ny = 0;
              d = 1;
            }
            const falloff = 1 - d * invR;
            const f = falloff * falloff * force;
            vx += (nx / d) * f;
            vy += (ny / d) * f;
          }
        }

        // 弹簧回位 + 阻尼
        vx -= spring * ox;
        vy -= spring * oy;
        vx *= damp;
        vy *= damp;
        ox += vx * k;
        oy += vy * k;

        // 限制最大位移，防止相邻点穿过彼此
        const s2 = ox * ox + oy * oy;
        if (s2 > maxShift2) {
          const s = maxShift / Math.sqrt(s2);
          ox *= s;
          oy *= s;
          vx *= s;
          vy *= s;
        }

        dots[o + 2] = ox;
        dots[o + 3] = oy;
        dots[o + 4] = vx;
        dots[o + 5] = vy;

        // 记录本帧最大速度：全部接近 0 时说明网格已静止
        const v2 = vx * vx + vy * vy;
        if (v2 > maxV2) maxV2 = v2;
      }

      return maxV2 > REST_V2;
    }

    function render() {
      if (!w || !h || !count) return;
      ctx!.clearRect(0, 0, w, h);

      // 按位移分档批量绘制：每档一次 fill，档位越高点越大越亮
      for (let band = 0; band < BANDS; band++) {
        const lo = band === 0 ? -1 : bandLo2[band];
        const hi = bandHi2[band];
        const r = radius * BAND_RADIUS[band];
        ctx!.globalAlpha = BAND_ALPHA[band] * alphaScale;
        ctx!.fillStyle = band < 2 ? dotColor : accentColor;
        ctx!.beginPath();
        for (let i = 0; i < count; i++) {
          const o = i * 6;
          const ox = dots[o + 2];
          const oy = dots[o + 3];
          const s2 = ox * ox + oy * oy;
          if (s2 > lo && s2 <= hi) {
            const cx = dots[o] + ox;
            const cy = dots[o + 1] + oy;
            // moveTo 先跳到圆周起点，避免相邻点被直线连起来
            ctx!.moveTo(cx + r, cy);
            ctx!.arc(cx, cy, r, 0, Math.PI * 2);
          }
        }
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
    }

    function frame(ts: number) {
      const dt = lastTs ? Math.min(48, ts - lastTs) : FRAME_MS;
      lastTs = ts;
      const moving = step(dt / FRAME_MS);
      render();
      if (!moving) {
        // 网格静止：停帧，等下一个指针/触屏事件唤醒。
        // 注意此时各点的位移会被冻结在当前值，画面与继续跑完全一致，
        // 但静止悬停/无交互时不再空转（手机上尤其省电）
        idle = true;
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    /* ---------- 循环控制（后台/减弱动画时彻底停帧，省电） ---------- */

    function start() {
      if (running || (motionQuery && motionQuery.matches)) return;
      running = true;
      idle = false;
      lastTs = 0;
      raf = requestAnimationFrame(frame);
    }

    /* 指针/触屏事件唤醒：只在静帧状态下才重新起帧 */
    function wake() {
      if (idle) start();
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    /* ---------- 事件 ---------- */

    function onResize() {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
        if (!running) render();
      });
    }

    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }

    function onMotionChange() {
      if (motionQuery && motionQuery.matches) {
        stop();
        render();
      } else {
        start();
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (e.pointerType === "mouse" && performance.now() - lastTouchAt < TOUCH_GUARD_MS) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      wake();
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && performance.now() - lastTouchAt < TOUCH_GUARD_MS) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      wake();
    }

    function onPointerUp(e: PointerEvent) {
      // 触屏抬起后不再有指针位置，点自然回弹归位
      if (e.pointerType === "touch") {
        pointer.active = false;
        wake(); // 停帧状态下被冻结的位移必须唤醒才会回弹归位
      }
    }

    function onPointerLeave() {
      pointer.active = false;
      wake();
    }

    // 触屏兜底：部分浏览器在 touch 拖动时 pointermove 不稳定
    function onTouch(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      lastTouchAt = performance.now();
      pointer.x = t.clientX;
      pointer.y = t.clientY;
      pointer.active = true;
      wake();
    }

    function onTouchEnd() {
      lastTouchAt = performance.now();
      pointer.active = false;
      wake();
    }

    function onThemeChange() {
      readTheme();
      if (!running) render();
    }

    /* ---------- 启动 ---------- */

    readTheme();
    resize();
    render();

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const themeObserver = new MutationObserver(onThemeChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (motionQuery) {
      // 旧版 Safari 只有已废弃的 addListener/removeListener，做个兼容分支
      const legacy = motionQuery as MediaQueryList & {
        addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
        removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
      };
      if (typeof motionQuery.addEventListener === "function") {
        motionQuery.addEventListener("change", onMotionChange);
      } else {
        legacy.addListener?.(onMotionChange);
      }
    }

    start();

    return () => {
      stop();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      themeObserver.disconnect();
      if (motionQuery) {
        const legacy = motionQuery as MediaQueryList & {
          removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
        };
        if (typeof motionQuery.removeEventListener === "function") {
          motionQuery.removeEventListener("change", onMotionChange);
        } else {
          legacy.removeListener?.(onMotionChange);
        }
      }
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("blur", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      dots = new Float32Array(0);
      count = 0;
    };
  }, []);

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />;
}
