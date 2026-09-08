"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@iconify/react";

interface TocItem { id: string; text: string; level: number; }

interface DotPos { id: string; text: string; level: number; pos: number; }

// 吸附阈值（占轨道高度的比例）：距离节点超过此值不吸附
const SNAP_THRESHOLD = 0.06;
// 近距离标签阈值：滑块靠近节点此范围内显示标题
const NEAR_THRESHOLD = 0.05;

export default function PostNav({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [dots, setDots] = useState<DotPos[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [nearDotId, setNearDotId] = useState<string | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const thumbYOffsetRef = useRef(0);

  // IntersectionObserver：跟踪当前活跃标题
  useEffect(() => {
    if (!items.length) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 1] }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  // 计算每个标题在文档中的相对位置
  const computeDots = useCallback(() => {
    if (!items.length) { setDots([]); return; }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const list: DotPos[] = items.map((it) => {
      const el = document.getElementById(it.id);
      if (!el) return { ...it, pos: 0 };
      const top = el.getBoundingClientRect().top + window.scrollY;
      return { id: it.id, text: it.text, level: it.level, pos: maxScroll > 0 ? Math.min(1, Math.max(0, top / maxScroll)) : 0 };
    });
    setDots(list);
  }, [items]);

  useEffect(() => {
    computeDots();
    const t1 = setTimeout(computeDots, 600);
    const t2 = setTimeout(computeDots, 2500);
    window.addEventListener("resize", computeDots);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", computeDots); };
  }, [computeDots]);

  // 滚动监听：进度 + 回到顶部可见性
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (isDraggingRef.current) return; // 拖动时不更新进度（由拖动控制）
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const p = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
        setProgress(p);
        setShowTop(p > 0.7 || scrollTop > window.innerHeight * 1.8);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // 找到距离给定进度最近的节点
  const findNearestDot = useCallback((p: number): DotPos | null => {
    if (!dots.length) return null;
    let best = dots[0];
    let bestDist = Math.abs(best.pos - p);
    for (let i = 1; i < dots.length; i++) {
      const d = Math.abs(dots[i].pos - p);
      if (d < bestDist) { best = dots[i]; bestDist = d; }
    }
    return best;
  }, [dots]);

  // ===== 滑块拖拽（鼠标 + 触屏） =====
  const startDrag = useCallback((clientY: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    const bar = barRef.current;
    if (bar) {
      const rect = bar.getBoundingClientRect();
      const thumbCenter = rect.top + progress * rect.height;
      thumbYOffsetRef.current = clientY - thumbCenter;
    }
  }, [progress]);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    let ratio = (clientY - thumbYOffsetRef.current - rect.top) / rect.height;
    ratio = Math.min(1, Math.max(0, ratio));

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * maxScroll, behavior: "auto" });
    setProgress(ratio);

    const nearest = findNearestDot(ratio);
    if (nearest && Math.abs(nearest.pos - ratio) <= NEAR_THRESHOLD) {
      setNearDotId(nearest.id);
    } else {
      setNearDotId(null);
    }
  }, [findNearestDot]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const currentProgress = progress;
    const nearest = findNearestDot(currentProgress);
    if (nearest && Math.abs(nearest.pos - currentProgress) <= SNAP_THRESHOLD) {
      const el = document.getElementById(nearest.id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
    setIsDragging(false);
    setNearDotId(null);
  }, [progress, findNearestDot]);

  // 鼠标事件
  const onThumbMouseDown = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDrag(e.clientY);
  }, [startDrag]);

  // 触摸事件
  const onThumbTouchStart = useCallback((e: React.TouchEvent) => {
    if (!e.touches.length) return;
    startDrag(e.touches[0].clientY);
  }, [startDrag]);

  // 全局移动 / 松开监听（鼠标 + 触屏）
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || !e.touches.length) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientY);
    };
    const onTouchEnd = () => endDrag();

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [moveDrag, endDrag]);

  // 点击外部关闭目录面板
  useEffect(() => {
    if (!tocOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const btn = document.querySelector(".toc-fab");
        if (btn && btn.contains(e.target as Node)) return;
        setTocOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [tocOpen]);

  // Esc 关闭面板
  useEffect(() => {
    if (!tocOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTocOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tocOpen]);

  // 点击圆点/目录项：平滑滚动到对应标题
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    setTocOpen(false);
  }, []);

  // 点击进度条空白处
  const onBarClick = useCallback((e: ReactMouseEvent) => {
    if (isDraggingRef.current) return;
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, ratio * maxScroll), behavior: "smooth" });
  }, []);

  const hasToc = items.length > 0;
  const activeItem = items.find((i) => i.id === active);
  const nearDot = nearDotId ? dots.find((d) => d.id === nearDotId) : null;

  return (
    <>
      {/* ===== Sticky Heading：当前章节标题固定在 header 下方 ===== */}
      {hasToc && activeItem && activeItem.level <= 3 && (
        <div className="sticky-heading" aria-hidden={!active}>
          <span className="sticky-heading-text">{activeItem.text}</span>
        </div>
      )}

      {/* ===== TOC 按钮 + 面板 ===== */}
      {hasToc && (
        <>
          <button
            className={`toc-fab${tocOpen ? " open" : ""}`}
            onClick={() => setTocOpen((v) => !v)}
            aria-label="Toggle table of contents"
            aria-expanded={tocOpen}
            title="目录"
          >
            <span className="hb-icon" aria-hidden="true">
              <span /><span /><span />
            </span>
          </button>

          <div
            ref={panelRef}
            className={`toc-panel${tocOpen ? " open" : ""}`}
            aria-hidden={!tocOpen}
          >
            <div className="toc-panel-head">
              <Icon icon="mdi:table-of-contents" width="1em" height="1em" />
              <span>目录</span>
            </div>
            <ul className="toc-panel-list">
              {items.map((it) => (
                <li
                  key={it.id}
                  className={`lvl-${it.level}${active === it.id ? " active" : ""}`}
                >
                  <a
                    href={`#${it.id}`}
                    onClick={(e) => { e.preventDefault(); scrollTo(it.id); }}
                  >
                    <span className="toc-bullet" />
                    {it.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* ===== 右侧滑动进度条 + 标题凸起圆点 + 滑块 ===== */}
      {hasToc && (
        <div
          className={`scroll-rail${isDragging ? " dragging" : ""}`}
          ref={barRef}
          onClick={onBarClick}
        >
          <div className="scroll-rail-track" />
          <div
            className="scroll-rail-fill"
            style={{ height: `${progress * 100}%` }}
          />

          {/* 凸起圆点 */}
          {dots.map((d) => {
            const isActive = active === d.id;
            const reached = d.pos <= progress;
            const isNear = nearDotId === d.id;
            return (
              <button
                key={d.id}
                className={`progress-dot lvl-${d.level}${isActive ? " active" : ""}${reached ? " reached" : ""}${isNear ? " near" : ""}`}
                style={{ top: `${d.pos * 100}%` }}
                onClick={(e) => { e.stopPropagation(); scrollTo(d.id); }}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
                aria-label={d.text}
                title={d.text}
              >
                <span className="progress-dot-core" />
                {/* 原有 hover 标签 */}
                <span className={`progress-dot-label${hovered === d.id ? " show" : ""}`}>
                  {d.text}
                </span>
                {/* 拖动靠近时的左侧透明小标签 */}
                {isNear && (
                  <span className="progress-dot-near-label">{d.text}</span>
                )}
              </button>
            );
          })}

          {/* 滑块 thumb */}
          <div
            className="scroll-thumb"
            style={{ top: `${progress * 100}%` }}
            onMouseDown={onThumbMouseDown}
            onTouchStart={onThumbTouchStart}
            role="slider"
            aria-label="阅读进度滑块"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
          />

          {/* 底部百分比 */}
          <div className="scroll-rail-pct">{Math.round(progress * 100)}%</div>
        </div>
      )}

      {/* ===== 底部回到顶部按钮 ===== */}
      <button
        className={`back-to-top${showTop ? " show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="回到顶部"
        title="回到顶部"
      >
        <Icon icon="mdi:arrow-up" width="1.3em" height="1.3em" className="back-top-icon" />
        <span className="back-top-ring" aria-hidden="true" />
      </button>
    </>
  );
}
