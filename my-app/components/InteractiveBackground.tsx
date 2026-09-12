"use client";

import { useEffect, useRef } from "react";

/* ===== 可调参数（集中放置，便于后续调优） ===== */
const MAX_DPR = 2; // 设备像素比上限：高分屏不做 3x 渲染，避免填充率爆炸
const FRAME_MS = 1000 / 60; // 运动归一化基准（不同刷新率下手感一致）
const MAX_SPEED = 0.42; // 粒子最大速度（px/帧）
const MIN_SPEED = 0.06; // 粒子最小速度：保证永远缓慢漂移，不会停死
const AREA_PER_PARTICLE = 30000; // 每个粒子占用的视口面积（px²）
const MIN_PARTICLES = 14;
const MAX_PARTICLES = 64; // 连线是 O(n²)，这里设硬上限保证稳定 60fps
const POINTER_RADIUS = 150; // 指针斥力半径（px）
const POINTER_FORCE = 0.5; // 斥力强度
const RIPPLE_MS = 900; // 点击涟漪扩散时长
const MAX_RIPPLES = 4;

/* 连线按距离分 4 档透明度批量描边：每帧只需 4 次 stroke，而不是 n² 次。
   BAND_EDGES 为距离占比边界（升序），BAND_ALPHA[band] 对应第 band 档，
   即索引 0 = 最近的连线（最亮），索引 3 = 最远（最淡） */
const BAND_EDGES = [0, 0.4, 0.65, 0.85, 1];
const BAND_ALPHA = [0.28, 0.17, 0.1, 0.05];

type RGB = { r: number; g: number; b: number };
type Ripple = { x: number; y: number; t: number };

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

    /* 粒子位置/速度用扁平定长数组（stride=4: x, y, vx, vy），避免每帧产生对象垃圾 */
    let pos = new Float32Array(0);
    let radii = new Float32Array(0);
    let count = 0;

    let w = 0;
    let h = 0;
    let linkDist = 120;
    /* 分档边界的平方值，随 linkDist 变化预计算：热循环内避免开方与每帧分配 */
    let bandEdges2: number[] = [];
    let ripples: Ripple[] = [];
    let raf = 0;
    let running = false;
    let lastTs = 0;
    let resizeRaf = 0;
    /* 上次播种时的视口尺寸，用于判断是否需要重新播种 */
    let lastSeedW = -1;
    let lastSeedH = -1;

    const pointer = { x: 0, y: 0, active: false };

    let dotColor = "rgba(120,120,120,0.5)";
    let lineColor = "rgb(37,99,235)";
    let glowColor = "rgba(37,99,235,0.3)";
    let glowSprite: HTMLCanvasElement | null = null;

    /* ---------- 工具 ---------- */

    function parseColor(input: string | null | undefined): RGB | null {
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

    /* 指针光晕：预渲染一次到离屏画布，之后每帧只做一次 drawImage */
    function buildGlow(color: string): HTMLCanvasElement {
      const size = POINTER_RADIUS * 2;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const g = c.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
      }
      return c;
    }

    /* 跟随主题（亮/暗）读取颜色：正文前景色作粒子，强调色作连线与光晕 */
    function readTheme() {
      const dot = parseColor(getComputedStyle(document.body).color) || { r: 128, g: 128, b: 128 };
      const accent =
        parseColor(getComputedStyle(document.documentElement).getPropertyValue("--accent")) || dot;
      dotColor = `rgba(${dot.r},${dot.g},${dot.b},0.3)`;
      lineColor = `rgb(${accent.r},${accent.g},${accent.b})`;
      glowColor = `rgba(${accent.r},${accent.g},${accent.b},0.22)`;
      glowSprite = buildGlow(glowColor);
    }

    /* ---------- 初始化 / 尺寸 ---------- */

    function seed() {
      const target = Math.round((w * h) / AREA_PER_PARTICLE);
      count = Math.max(MIN_PARTICLES, Math.min(MAX_PARTICLES, target || MIN_PARTICLES));
      pos = new Float32Array(count * 4);
      radii = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const o = i * 4;
        pos[o] = Math.random() * w;
        pos[o + 1] = Math.random() * h;
        const angle = Math.random() * Math.PI * 2;
        const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
        pos[o + 2] = Math.cos(angle) * speed;
        pos[o + 3] = Math.sin(angle) * speed;
        radii[i] = 1.1 + Math.random() * 1.4;
      }
    }

    function updateLinkDist() {
      // 小屏幕上缩短连线距离，避免糊成一片
      linkDist = Math.max(90, Math.min(140, Math.min(w, h) * 0.22));
      bandEdges2 = BAND_EDGES.map((f) => f * f * linkDist * linkDist);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      // 移动端地址栏伸缩会频繁触发 resize：宽度不变、高度微变时不重新播种，
      // 否则粒子会不断"瞬移"重排，反而抵消性能优化
      const widthChanged = Math.abs(nw - lastSeedW) > 1;
      const heightJumped = lastSeedH > 0 && Math.abs(nh - lastSeedH) / lastSeedH > 0.25;

      w = nw;
      h = nh;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      // canvas.width 赋值会重置上下文状态，需重新设置变换
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      updateLinkDist();

      if (count === 0 || widthChanged || heightJumped) {
        seed();
        lastSeedW = nw;
        lastSeedH = nh;
      }
      ripples = [];
    }

    /* ---------- 运动与绘制 ---------- */

    function step(k: number, dt: number) {
      const pr2 = POINTER_RADIUS * POINTER_RADIUS;
      const min2 = MIN_SPEED * MIN_SPEED;
      const max2 = MAX_SPEED * MAX_SPEED;

      for (let i = 0; i < count; i++) {
        const o = i * 4;
        let x = pos[o];
        let y = pos[o + 1];
        let vx = pos[o + 2];
        let vy = pos[o + 3];

        // 指针斥力：附近的粒子被柔和推开，形成"被拨动"的手感
        if (pointer.active) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < pr2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / POINTER_RADIUS) * POINTER_FORCE * k;
            vx += (dx / d) * f;
            vy += (dy / d) * f;
          }
        }

        // 阻尼 + 限速（保留方向，避免抖动）
        vx *= 0.985;
        vy *= 0.985;
        const sp2 = vx * vx + vy * vy;
        if (sp2 > max2) {
          const s = MAX_SPEED / Math.sqrt(sp2);
          vx *= s;
          vy *= s;
        } else if (sp2 < min2 && sp2 > 0) {
          const s = MIN_SPEED / Math.sqrt(sp2);
          vx *= s;
          vy *= s;
        }

        x += vx * k;
        y += vy * k;

        // 边缘环绕（留 20px 余量，粒子在视口外完成回绕）
        if (x < -20) x = w + 20;
        else if (x > w + 20) x = -20;
        if (y < -20) y = h + 20;
        else if (y > h + 20) y = -20;

        pos[o] = x;
        pos[o + 1] = y;
        pos[o + 2] = vx;
        pos[o + 3] = vy;
      }

      // 涟漪推进
      if (ripples.length) {
        for (let i = ripples.length - 1; i >= 0; i--) {
          ripples[i].t += dt / RIPPLE_MS;
          if (ripples[i].t >= 1) ripples.splice(i, 1);
        }
      }
    }

    function render() {
      if (!w || !h) return;
      ctx!.clearRect(0, 0, w, h);

      // 1) 粒子连线：按距离分档，每档一次批量 stroke
      ctx!.lineWidth = 1;
      ctx!.strokeStyle = lineColor;
      for (let band = 0; band < BAND_ALPHA.length; band++) {
        const lo = band === 0 ? -1 : bandEdges2[band];
        const hi = bandEdges2[band + 1];
        ctx!.globalAlpha = BAND_ALPHA[band];
        ctx!.beginPath();
        for (let i = 0; i < count; i++) {
          const io = i * 4;
          const x1 = pos[io];
          const y1 = pos[io + 1];
          for (let j = i + 1; j < count; j++) {
            const jo = j * 4;
            const dx = x1 - pos[jo];
            const dy = y1 - pos[jo + 1];
            const d2 = dx * dx + dy * dy;
            if (d2 > lo && d2 <= hi) {
              ctx!.moveTo(x1, y1);
              ctx!.lineTo(pos[jo], pos[jo + 1]);
            }
          }
        }
        ctx!.stroke();
      }

      // 2) 指针光晕（离屏精灵，避免每帧重建渐变）
      if (pointer.active && glowSprite) {
        const s = POINTER_RADIUS * 2;
        ctx!.globalAlpha = 0.55;
        ctx!.drawImage(glowSprite, pointer.x - s / 2, pointer.y - s / 2, s, s);
      }

      // 3) 点击涟漪
      if (ripples.length) {
        ctx!.strokeStyle = lineColor;
        ctx!.lineWidth = 1.5;
        for (let i = 0; i < ripples.length; i++) {
          const rp = ripples[i];
          ctx!.globalAlpha = (1 - rp.t) * 0.35;
          ctx!.beginPath();
          ctx!.arc(rp.x, rp.y, rp.t * 180, 0, Math.PI * 2);
          ctx!.stroke();
        }
      }

      // 4) 粒子点：所有点合并进一条路径，只 fill 一次
      ctx!.globalAlpha = 0.8;
      ctx!.fillStyle = dotColor;
      ctx!.beginPath();
      for (let i = 0; i < count; i++) {
        const o = i * 4;
        const r = radii[i];
        ctx!.moveTo(pos[o] + r, pos[o + 1]);
        ctx!.arc(pos[o], pos[o + 1], r, 0, Math.PI * 2);
      }
      ctx!.fill();

      ctx!.globalAlpha = 1;
    }

    function frame(ts: number) {
      const dt = lastTs ? Math.min(48, ts - lastTs) : FRAME_MS;
      lastTs = ts;
      step(dt / FRAME_MS, dt);
      render();
      raf = requestAnimationFrame(frame);
    }

    /* ---------- 循环控制（后台/减弱动画时彻底停帧，省电） ---------- */

    function start() {
      if (running || (motionQuery && motionQuery.matches)) return;
      running = true;
      lastTs = 0;
      raf = requestAnimationFrame(frame);
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
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    }

    function onPointerDown(e: PointerEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (ripples.length >= MAX_RIPPLES) ripples.shift();
      ripples.push({ x: e.clientX, y: e.clientY, t: 0 });
      if (!running) render(); // 减弱动画模式下也要能看到一次涟漪
    }

    function onPointerUp(e: PointerEvent) {
      if (e.pointerType === "touch") pointer.active = false;
    }

    function onPointerLeave() {
      pointer.active = false;
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
      window.removeEventListener("blur", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      ripples = [];
    };
  }, []);

  return <canvas ref={ref} className="bg-canvas" aria-hidden="true" />;
}
