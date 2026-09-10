/**
 * 使用 pdfmake 生成文章 PDF
 * 页眉页脚位置由代码精确控制，不依赖浏览器打印引擎
 */

// pdfmake 在浏览器端需要动态导入（SSR 不支持）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfMakeContent = any;

interface ArticleMeta {
  title: string;
  date: string;
  author?: string;
  isAI?: boolean;
  aiWarning?: string;
}

/**
 * 从 DOM 提取文章内容并生成 PDF
 */
export async function generateArticlePdf(meta: ArticleMeta): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake: any = (await import("pdfmake/build/pdfmake")).default;
  // 字体：用内置 Helvetica（无需嵌入字体文件）
  const fonts = {
    Helvetica: { normal: "Helvetica", bold: "Helvetica-Bold", italics: "Helvetica-Oblique", bolditalics: "Helvetica-BoldOblique" },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vfs: any = (await import("pdfmake/build/vfs_fonts")).default;
  pdfMake.vfs = vfs.pdfMake ? vfs.pdfMake.vfs : vfs;

  const docDefinition = buildDocDefinition(meta);
  pdfMake.createPdf(docDefinition, undefined, fonts).download(`${meta.title}.pdf`);
}

/**
 * 从 DOM .article 元素中提取内容，转为 pdfmake 文档定义
 */
function buildDocDefinition(meta: ArticleMeta) {
  const article = document.querySelector(".article") || document.querySelector(".post-content");
  if (!article) return { content: [{ text: "无法找到文章内容", style: "body" }] };

  const content: PdfMakeContent[] = [];

  // 文章标题
  content.push({ text: meta.title, style: "articleTitle" });

  // 元信息行
  const metaLine = [meta.date, meta.author ? `  |  ${meta.isAI ? meta.aiWarning : meta.author}` : ""].join("");
  content.push({ text: metaLine, style: "metaLine", margin: [0, 4, 0, 12] });

  // 分割线
  content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }], margin: [0, 0, 0, 8] });

  // 遍历 DOM 节点，转为 pdfmake content
  const nodes = getArticleNodes(article);
  for (const node of nodes) {
    const item = domNodeToPdf(node);
    if (item) content.push(item);
  }

  return {
    content,
    pageSize: "A4",
    pageMargins: [56, 90, 56, 70], // [左, 上, 右, 下] (pt) ≈ 2cm 上、1.25cm 下
    header: (currentPage: number) => {
      if (currentPage === 1) return null; // 首页不显示页眉（标题已在内容中）
      return {
        margin: [56, 20, 56, 0],
        stack: [
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 483, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }] },
          {
            margin: [0, 2, 0, 0],
            columns: [
              { text: metaLine, fontSize: 8, color: "#666666" },
            ],
          },
        ],
      };
    },
    footer: (currentPage: number, pageCount: number) => ({
      margin: [56, 8, 56, 20],
      stack: [
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: 483, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }] },
        {
          margin: [0, 2, 0, 0],
          columns: [
            { text: meta.title, fontSize: 8, color: "#666666", width: "70%", noWrap: true, ellipsis: true },
            { text: `${currentPage} / ${pageCount}`, fontSize: 8, color: "#666666", alignment: "right", width: "30%" },
          ],
        },
      ],
    }),
    styles: {
      articleTitle: { fontSize: 22, bold: true, margin: [0, 0, 0, 4], lineHeight: 1.2 },
      metaLine: { fontSize: 9, color: "#666666" },
      h2: { fontSize: 16, bold: true, margin: [0, 14, 0, 4], lineHeight: 1.2 },
      h3: { fontSize: 14, bold: true, margin: [0, 10, 0, 3], lineHeight: 1.2 },
      h4: { fontSize: 12, bold: true, margin: [0, 8, 0, 2], lineHeight: 1.2 },
      body: { fontSize: 11, lineHeight: 1.35, margin: [0, 0, 0, 4] },
      code: { fontSize: 9, font: "Helvetica", color: "#333333", margin: [0, 2, 0, 2] },
      blockquote: { fontSize: 11, color: "#555555", margin: [8, 4, 8, 4], italics: true },
      listItem: { fontSize: 11, margin: [0, 1, 0, 1] },
    },
    defaultStyle: { font: "Helvetica", fontSize: 11, lineHeight: 1.35 },
  };
}

/**
 * 获取文章主体节点（跳过 header、nav 等非正文区域）
 */
function getArticleNodes(root: Element): Element[] {
  // 如果是 .article 直接取其子节点
  // 如果是 .post-content，找到 article.post-content 内的 PostBody 区域
  const article = root.classList.contains("article") ? root : root.querySelector(".article") || root;
  const nodes: Element[] = [];
  for (const child of Array.from(article.children)) {
    // 跳过非正文元素
    if (child.classList.contains("post-header") || child.classList.contains("post-nav") || child.classList.contains("breadcrumbs") || child.classList.contains("comments-section") || child.classList.contains("print-controls") || child.classList.contains("post-tags")) continue;
    nodes.push(child);
  }
  return nodes;
}

/**
 * 将单个 DOM 节点转为 pdfmake content item
 */
function domNodeToPdf(el: Element): PdfMakeContent | null {
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim() || "";

  switch (tag) {
    case "h1":
      return { text, style: "articleTitle", margin: [0, 14, 0, 4] };
    case "h2":
      return { text, style: "h2" };
    case "h3":
      return { text, style: "h3" };
    case "h4":
    case "h5":
      return { text, style: "h4" };
    case "p":
      return { text, style: "body" };
    case "blockquote": {
      const innerText = el.textContent?.trim() || "";
      return { text: innerText, style: "blockquote" };
    }
    case "pre": {
      const code = el.textContent || "";
      return { text: code, style: "code", margin: [0, 4, 0, 4] };
    }
    case "ul":
    case "ol": {
      const items = Array.from(el.children).map((li) => ({
        text: li.textContent?.trim() || "",
        style: "listItem",
      }));
      return {
        ol: tag === "ol" ? items : undefined,
        ul: tag === "ul" ? items : undefined,
      } as PdfMakeContent;
    }
    case "table": {
      const rows = Array.from(el.querySelectorAll("tr"));
      if (!rows.length) return null;
      const tableBody = rows.map((row) =>
        Array.from(row.querySelectorAll("th,td")).map((cell) => ({
          text: cell.textContent?.trim() || "",
          fontSize: 9,
          bold: cell.tagName.toLowerCase() === "th",
        }))
      );
      return { table: { body: tableBody }, margin: [0, 4, 0, 4] } as PdfMakeContent;
    }
    case "img": {
      const src = (el as HTMLImageElement).getAttribute("src") || "";
      if (!src) return null;
      return { image: src, width: 400, margin: [0, 4, 0, 4] } as PdfMakeContent;
    }
    case "hr":
      return { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: "#cccccc" }], margin: [0, 6, 0, 6] } as PdfMakeContent;
    default:
      // 其他块级元素：提取文本
      if (text) return { text, style: "body", margin: [0, 0, 0, 4] };
      return null;
  }
}
