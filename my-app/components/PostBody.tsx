"use client";

import { useEffect, useRef } from "react";

export default function PostBody({ html, slug }: { html: string; slug: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 代码复制按钮
    el.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.onclick = () => {
        const code = pre.querySelector("code");
        navigator.clipboard.writeText(code?.textContent || "").then(() => {
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 1500);
        });
      };
      pre.appendChild(btn);
    });

    // Mermaid
    const mermaids = el.querySelectorAll(".mermaid");
    if (mermaids.length && !(window as any).mermaidLoaded) {
      (window as any).mermaidLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",
        () => {
          (window as any).mermaid?.initialize({ startOnLoad: true, theme: "default" });
          (window as any).mermaid?.run?.();
        },
        () => mermaids.forEach((m: any) => { m.textContent = "Mermaid 加载失败"; })
      );
    }

    // ECharts
    const echarts = el.querySelectorAll(".echarts");
    if (echarts.length && !(window as any).echartsLoaded) {
      (window as any).echartsLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js",
        () => {
          echarts.forEach((c: any) => {
            // 图表容器需有明确高度，否则 canvas 高度为 0
            c.style.minHeight = "360px";
            c.style.width = "100%";
            try {
              const option = JSON.parse(c.getAttribute("data-option") || "{}");
              const chart = (window as any).echarts.init(c);
              chart.setOption(option);
              // 响应式
              const ro = new ResizeObserver(() => chart.resize());
              ro.observe(c);
            } catch (e) {
              c.textContent = "ECharts 数据解析失败";
            }
          });
        },
        () => echarts.forEach((c: any) => { c.textContent = "ECharts 加载失败"; })
      );
    }

    // SmilesDrawer (化学结构式) — v2.x: parse 为异步回调 API
    const chems = el.querySelectorAll(".chem");
    if (chems.length && !(window as any).chemLoaded) {
      (window as any).chemLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/smiles-drawer@2.4.1/dist/smiles-drawer.min.js",
        () => {
          chems.forEach((c: any) => {
            const smiles = c.getAttribute("data-smiles");
            if (!smiles) return;
            const caption = c.getAttribute("data-caption");
            // 默认画布缩小；支持短代码指定 width/height
            const w = parseInt(c.getAttribute("data-width") || "220", 10);
            const h = parseInt(c.getAttribute("data-height") || "150", 10);
            try {
              (window as any).SmilesDrawer.parse(
                smiles,
                (tree: any) => {
                  const wrapper = document.createElement("div");
                  wrapper.style.cssText = "text-align:center;margin:1em 0;";
                  // 将尺寸传入 Drawer 构造函数，避免 draw 方法覆盖为默认 500x500
                  const drawer = new (window as any).SmilesDrawer.Drawer({ width: w, height: h });
                  const canvas = document.createElement("canvas");
                  // smiles-drawer 的 draw 方法接收 canvas 的 id 字符串（传 DOM 元素会失败）
                  const canvasId = `chem-canvas-${Math.random().toString(36).slice(2, 9)}`;
                  canvas.id = canvasId;
                  canvas.style.maxWidth = "100%";
                  canvas.style.height = "auto";
                  wrapper.appendChild(canvas);
                  if (caption) {
                    const cap = document.createElement("div");
                    cap.style.cssText = "font-size:0.85em;color:var(--text-secondary);margin-top:6px;";
                    cap.textContent = caption;
                    wrapper.appendChild(cap);
                  }
                  c.appendChild(wrapper);
                  drawer.draw(tree, canvasId, "light");
                },
                () => {
                  c.textContent = smiles;
                }
              );
            } catch (e) {
              c.textContent = smiles;
            }
          });
        },
        () => chems.forEach((c: any) => { c.textContent = c.getAttribute("data-smiles") || ""; })
      );
    }

    // Graphviz (viz.js) — 修正 await 优先级：先 await instance() 再调用方法
    const vizs = el.querySelectorAll(".graphviz");
    if (vizs.length && !(window as any).vizLoaded) {
      (window as any).vizLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/@viz-js/viz@3/lib/viz-standalone.js",
        async () => {
          for (const c of vizs) {
            const src = (c as any).getAttribute("data-src") || "";
            try {
              const viz = await (window as any).Viz.instance();
              const svg = viz.renderSVGElement(src);
              (c as any).appendChild(svg);
            } catch (e) {
              (c as any).textContent = "Graphviz 渲染失败";
            }
          }
        },
        () => vizs.forEach((c: any) => { c.textContent = "Graphviz 加载失败"; })
      );
    }

    // abc.js (乐谱)
    const abcs = el.querySelectorAll(".abc");
    if (abcs.length && !(window as any).abcLoaded) {
      (window as any).abcLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/abcjs@6.7.0/dist/abcjs-basic-min.js",
        () => {
          abcs.forEach((c: any) => {
            const src = c.getAttribute("data-src") || "";
            try {
              (window as any).ABCJS.renderAbc(c, src, {
                responsive: "resize",
                staffwidth: 600,
              });
            } catch (e) {
              c.textContent = "乐谱渲染失败";
            }
          });
        },
        () => abcs.forEach((c: any) => { c.textContent = "abc.js 加载失败"; })
      );
    }
  }, [html]);

  return <div className="article" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function loadScript(src: string, onLoad: () => void, onError?: () => void) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  s.onload = onLoad;
  if (onError) s.onerror = onError;
  document.head.appendChild(s);
}
