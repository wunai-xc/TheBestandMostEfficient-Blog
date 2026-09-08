import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import remarkRehype from "remark-rehype";
// mhchem 扩展：为 KaTeX 注册 \ce{} 化学方程式语法（ESM 副作用导入，挂载到共享 katex 实例）
import "katex/contrib/mhchem";
import type { Post } from "./content";

// KaTeX 自定义宏：常用数学符号简写
const KATEX_MACROS: Record<string, string> = {
  "\\RR": "\\mathbb{R}",
  "\\CC": "\\mathbb{C}",
  "\\ZZ": "\\mathbb{Z}",
  "\\NN": "\\mathbb{N}",
  "\\QQ": "\\mathbb{Q}",
  "\\dd": "\\mathrm{d}",
};

// 安全遍历：跳过 undefined/null 节点（rehypeRaw 可能产生）
function walk(tree: any, type: string, fn: (node: any) => void) {
  if (!tree || typeof tree !== "object") return;
  if (tree.type === type) fn(tree);
  const children = tree.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child) walk(child, type, fn);
    }
  }
}

// 带 parent/index 的遍历（用于节点替换）
function walkWithParent(tree: any, type: string, fn: (node: any, parent: any, index: number) => void) {
  const children = tree?.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    if (child.type === type) fn(child, tree, i);
    walkWithParent(child, type, fn);
  }
}

// 自定义 remark 插件：处理 ==高亮==、[reference:N]、chem/color/mark 短代码
function remarkCustomShortcodes() {
  return (tree: any) => {
    walk(tree, "text", (node: any) => {
      if (!node.value) return;
      let text = node.value;
      // ==text== -> <mark>text</mark>
      text = text.replace(/==([^=]+)==/g, '<mark>$1</mark>');
      // [reference:N] -> <sup><a href="#ref-N">[N]</a></sup>
      text = text.replace(/\[reference:(\d+)\]/g, '<sup><a href="#ref-$1" class="ref-link">[$1]</a></sup>');
      // chem 短代码：支持三种格式
      // 1. {{< chem "SMILES" >}}
      // 2. {{< chem SMILES >}}
      // 3. {{< chem smiles="SMILES" caption="..." width="W" height="H" >}}
      text = text.replace(/\{\{< chem "([^"]+)" >\}\}/g, '<span class="chem" data-smiles="$1"></span>');
      text = text.replace(/\{\{< chem ([^ >]+) >\}\}/g, '<span class="chem" data-smiles="$1"></span>');
      text = text.replace(
        /\{\{< chem smiles="([^"]+)"(?:\s+caption="([^"]*)")?(?:\s+width="(\d+)")?(?:\s+height="(\d+)")?\s*>\}\}/g,
        (_m: string, smiles: string, caption: string, w: string, h: string) => {
          const attrs = [`class="chem"`, `data-smiles="${smiles}"`];
          if (caption) attrs.push(`data-caption="${caption}"`);
          if (w) attrs.push(`data-width="${w}"`);
          if (h) attrs.push(`data-height="${h}"`);
          return `<span ${attrs.join(" ")}></span>`;
        }
      );
      // {{< color "text" "#hex" >}} -> <span style="color:#hex">text</span>
      text = text.replace(/\{\{< color "([^"]+)" "([^"]+)" >\}\}/g, '<span style="color:$2">$1</span>');
      // {{< mark "text" >}} -> <mark>text</mark>
      text = text.replace(/\{\{< mark "([^"]+)" >\}\}/g, '<mark>$1</mark>');
      if (text !== node.value) {
        node.type = "html";
        node.value = text;
      }
    });
  };
}

// 图片懒加载 + 相对路径解析
function rehypeImages(post: Post) {
  return (tree: any) => {
    walk(tree, "element", (node: any) => {
      if (node.tagName === "img") {
        const src = node.properties?.src || "";
        node.properties = node.properties || {};
        node.properties.loading = "lazy";
        node.properties.decoding = "async";
        if (!src.startsWith("http") && !src.startsWith("/")) {
          node.properties.src = `/${post.lang}/posts/${post.slug}/${src}`;
        }
        if (!node.properties.alt) node.properties.alt = "";
      }
      if (node.tagName === "a") {
        const href = node.properties?.href || "";
        // .md 相对链接 -> 文章链接
        if (href.endsWith(".md") && !href.startsWith("http")) {
          const target = href.replace(/\.md$/, "");
          node.properties.href = `/${post.lang}/posts/${target}/`;
        }
      }
    });
  };
}

// XSS 过滤：拦截 javascript:/vbscript:/data: 协议
function rehypeXssFilter() {
  return (tree: any) => {
    walk(tree, "element", (node: any) => {
      const props = node.properties || {};
      for (const key of Object.keys(props)) {
        const val = String(props[key]);
        if (/^(javascript|vbscript|data):/i.test(val.trim())) {
          props[key] = "#";
        }
      }
    });
  };
}

// 图表代码块转换：mermaid/echarts/graphviz/abc -> div 容器
function rehypeDiagramBlocks() {
  return (tree: any) => {
    walkWithParent(tree, "element", (node: any, parent: any, index: number) => {
      if (node.tagName !== "pre" || !parent) return;
      const code = node.children?.[0];
      if (!code || code.tagName !== "code") return;
      const cls: string = code.properties?.className?.join(" ") || "";
      const lang = (cls.match(/language-(\w+)/) || [])[1] || "";
      const text = code.children?.[0]?.value || "";
      if (["mermaid", "echarts", "graphviz", "abc"].includes(lang)) {
        const div: any = {
          type: "element",
          tagName: "div",
          properties: {
            class: lang,
            ...(lang === "echarts" ? { "data-option": text } : {}),
            ...(lang === "graphviz" ? { "data-src": text } : {}),
            ...(lang === "abc" ? { "data-src": text } : {}),
          },
          children: lang === "mermaid" ? [{ type: "text", value: text }] : [],
        };
        parent.children[index] = div;
      }
    });
  };
}

// 中文文本优化：CJK 与英文/数字之间加空格、标点转换
// 关键：跳过 KaTeX 渲染出的 HTML 内部文本，避免破坏公式排版
function rehypeCjkOpt() {
  const PUNCT: Record<string, string> = {
    ",": "，", ".": "。", "?": "？", "!": "！", ";": "；", ":": "：",
    "(": "（", ")": "）", "[": "【", "]": "】",
  };
  // 判断节点的 className 是否含 katex（KaTeX 渲染容器）
  const hasKatexClass = (node: any): boolean => {
    const cls = node?.properties?.className;
    if (!cls) return false;
    const s = Array.isArray(cls) ? cls.join(" ") : String(cls);
    return s.includes("katex") || s.includes("MathJax");
  };
  // 带祖先链遍历，跳过 katex 内部文本
  function walkCjk(node: any, ancestors: any[]) {
    if (!node || typeof node !== "object") return;
    // 当前节点若是 katex 容器，其子树全部跳过
    const inKatex = hasKatexClass(node) || ancestors.some(hasKatexClass);
    if (node.type === "text" && node.value && !inKatex) {
      let s = node.value;
      // CJK 与 ASCII 之间加空格
      s = s.replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2")
           .replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2");
      // 行内标点转换（只在中文语境）
      if (/[\u4e00-\u9fff]/.test(s)) {
        s = s.replace(/([\u4e00-\u9fff]),\s?/g, "$1，")
             .replace(/([\u4e00-\u9fff])\.\s?/g, "$1。")
             .replace(/([\u4e00-\u9fff])\?\s?/g, "$1？")
             .replace(/([\u4e00-\u9fff])!\s?/g, "$1！");
      }
      node.value = s;
    }
    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child) walkCjk(child, [...ancestors, node]);
      }
    }
  }
  return (tree: any) => walkCjk(tree, []);
}

// 提取 TOC（标题列表）：兼容 id 在标签任意位置的情况
export function extractToc(html: string): { id: string; text: string; level: number }[] {
  const toc: { id: string; text: string; level: number }[] = [];
  const regex = /<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    if (text) toc.push({ id: m[2], text, level: Number(m[1]) });
  }
  return toc;
}

export async function renderMarkdown(post: Post): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBreaks)
    .use(remarkCustomShortcodes as any)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeDiagramBlocks as any)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeKatex, { throwOnError: false, errorColor: "#cc0000", macros: KATEX_MACROS, strict: false })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(rehypeImages(post) as any)
    .use(rehypeXssFilter as any)
    .use(rehypeCjkOpt as any)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(post.content);

  let html = String(file);

  // 参考文献列表（如 frontmatter 有 references）
  if (post.references && post.references.length) {
    const items = post.references
      .map((r, i) => {
        const title = r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${r.title}</a>` : r.title;
        const meta = [r.author, r.year].filter(Boolean).join(", ");
        return `<li id="ref-${i}">${title}${meta ? ` <span class="ref-meta">— ${meta}</span>` : ""}</li>`;
      })
      .join("");
    html += `\n<section class="references"><h2>参考文献</h2><ol>${items}</ol></section>`;
  }

  return html;
}
