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
      loadScript("https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js", () => {
        (window as any).mermaid?.initialize({ startOnLoad: true, theme: "default" });
        (window as any).mermaid?.run?.();
      });
    }

    // ECharts
    const echarts = el.querySelectorAll(".echarts");
    if (echarts.length && !(window as any).echartsLoaded) {
      (window as any).echartsLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js", () => {
        echarts.forEach((c: any) => {
          const option = JSON.parse(c.getAttribute("data-option") || "{}");
          const chart = (window as any).echarts.init(c);
          chart.setOption(option);
        });
      });
    }

    // SmilesDrawer (化学结构式)
    const chems = el.querySelectorAll(".chem");
    if (chems.length && !(window as any).chemLoaded) {
      (window as any).chemLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/smiles-drawer@1.1.8/dist/smiles-drawer.min.js", () => {
        chems.forEach((c: any) => {
          const smiles = c.getAttribute("data-smiles");
          if (smiles && (window as any).SmilesDrawer) {
            try {
              const drawer = new (window as any).SmilesDrawer.Drawer();
              const tree = (window as any).SmilesDrawer.parse(smiles);
              const canvas = document.createElement("canvas");
              canvas.width = 300; canvas.height = 200;
              c.appendChild(canvas);
              drawer.draw(tree, canvas, "light", true);
            } catch (e) { c.textContent = smiles; }
          }
        });
      });
    }

    // Graphviz (viz.js)
    const vizs = el.querySelectorAll(".graphviz");
    if (vizs.length && !(window as any).vizLoaded) {
      (window as any).vizLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/@viz-js/viz@3/lib/viz-standalone.js", () => {
        vizs.forEach(async (c: any) => {
          const src = c.getAttribute("data-src") || "";
          const svg = await (window as any).Viz.instance().renderSVGElement(src);
          c.appendChild(svg);
        });
      });
    }

    // abc.js (乐谱)
    const abcs = el.querySelectorAll(".abc");
    if (abcs.length && !(window as any).abcLoaded) {
      (window as any).abcLoaded = true;
      loadScript("https://cdn.jsdelivr.net/npm/abcjs@6/dist/abcjs_basic_min.js", () => {
        abcs.forEach((c: any) => {
          const src = c.getAttribute("data-src") || "";
          (window as any).ABCJS.renderAbc(c, src, { responsive: "resize" });
        });
      });
    }
  }, [html]);

  return <div className="article" ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function loadScript(src: string, cb: () => void) {
  const s = document.createElement("script");
  s.src = src; s.async = true; s.onload = cb;
  document.head.appendChild(s);
}
