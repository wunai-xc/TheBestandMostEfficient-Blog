"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@iconify/react";

interface TocItem { id: string; text: string; level: number; }

interface DotPos { id: string; text: string; level: number; pos: number; }

export default function PostNav({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [dots, setDots] = useState<DotPos[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

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
          setActive(visible[visible.length - 1].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  // 计算每个标题在文档中的相对位置（用于进度条圆点定位）
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
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const p = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
        setProgress(p);
        // 滚动超过 70% 或超过两屏时显示回到顶部
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

  // 点击圆点/目录项：平滑滚动到对应标题
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    setTocOpen(false);
  }, []);

  // 点击进度条空白处：跳转到对应滚动位置
  const onBarClick = useCallback((e: ReactMouseEvent) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, ratio * maxScroll), behavior: "smooth" });
  }, []);

  const hasToc = items.length > 0;

  return (
    <>
      {/* ===== 左侧浮动目录按钮（动态图标） ===== */}
      {hasToc && (
        <div className={`toc-fab-wrap${tocOpen ? " open" : ""}`}>
          <button
            className="toc-fab"
            onClick={() => setTocOpen((v) => !v)}
            aria-label="Toggle table of contents"
            aria-expanded={tocOpen}
            title="目录"
          >
            {/* 动态图标：关闭态为列表图标（持续呼吸动画），打开态旋转为关闭 */}
            <span className="toc-fab-icon">
              <Icon
                icon={tocOpen ? "mdi:close" : "mdi:format-list-bulleted"}
                width="1.3em"
                height="1.3em"
                className="toc-icon-anim"
              />
              {/* 三条小横线装饰，hover 时错位流动 */}
              {!tocOpen && (
                <span className="toc-fab-lines" aria-hidden="true">
                  <span /><span /><span />
                </span>
              )}
            </span>
          </button>

          {/* 展开面板 */}
          <aside className="toc-panel" aria-hidden={!tocOpen}>
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
                    className={active === it.id ? "active" : ""}
                  >
                    <span className="toc-bullet" />
                    {it.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {/* ===== 右侧滑动进度条 + 标题凸起圆点 ===== */}
      {hasToc && (
        <div className="scroll-rail" ref={barRef} onClick={onBarClick}>
          {/* 轨道 */}
          <div className="scroll-rail-track" />
          {/* 进度填充 */}
          <div
            className="scroll-rail-fill"
            style={{ height: `${progress * 100}%` }}
          />
          {/* 标题圆点 */}
          {dots.map((d) => {
            const isActive = active === d.id;
            const reached = d.pos <= progress;
            return (
              <button
                key={d.id}
                className={`progress-dot lvl-${d.level}${isActive ? " active" : ""}${reached ? " reached" : ""}`}
                style={{ top: `${d.pos * 100}%` }}
                onClick={(e) => { e.stopPropagation(); scrollTo(d.id); }}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
                aria-label={d.text}
                title={d.text}
              >
                <span className="progress-dot-core" />
                {/* 悬浮标签 */}
                <span className={`progress-dot-label${hovered === d.id ? " show" : ""}`}>
                  {d.text}
                </span>
              </button>
            );
          })}
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
