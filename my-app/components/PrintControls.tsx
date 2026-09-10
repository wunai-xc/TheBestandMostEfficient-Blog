"use client";

import { useState } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import { generateArticlePdf } from "@/lib/print-pdf";

interface Props {
  /** 打印按钮文字 */
  printLabel?: string;
  /** MD 下载按钮文字 */
  mdDownloadLabel?: string;
  /** 要下载的 Markdown 完整内容（含 frontmatter） */
  mdContent?: string;
  /** 下载文件名（不含 .md） */
  mdFileName?: string;
  /** 文章元信息（用于 PDF 页眉页脚） */
  articleTitle?: string;
  articleDate?: string;
  articleAuthor?: string;
  articleIsAI?: boolean;
  aiWarningText?: string;
}

/**
 * 打印 + Markdown 下载控制按钮
 * 打印：用 pdfmake 生成 PDF（页眉页脚位置代码控制，不依赖浏览器打印引擎）
 * 下载：用 Blob + a[download] 触发浏览器下载
 */
export default function PrintControls({
  printLabel = "打印",
  mdDownloadLabel = "下载 MD",
  mdContent,
  mdFileName,
  articleTitle = "",
  articleDate = "",
  articleAuthor,
  articleIsAI = false,
  aiWarningText = "AI生成",
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handlePrint() {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await generateArticlePdf({
        title: articleTitle || mdFileName || "article",
        date: articleDate,
        author: articleAuthor,
        isAI: articleIsAI,
        aiWarning: aiWarningText,
      });
    } catch (err) {
      console.error("PDF 生成失败，回退到浏览器打印", err);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownload() {
    if (!mdContent) return;
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mdFileName || "article"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="print-controls">
      <button
        type="button"
        className="print-btn"
        onClick={handlePrint}
        title={printLabel}
        aria-label={printLabel}
        disabled={isGenerating}
      >
        <Icon icon={icons["mdi:printer-outline"]} width="1em" height="1em" />
        <span>{isGenerating ? "生成中..." : printLabel}</span>
      </button>
      <button
        type="button"
        className="print-btn"
        onClick={handleDownload}
        title={mdDownloadLabel}
        aria-label={mdDownloadLabel}
      >
        <Icon icon={icons["mdi:file-download-outline"]} width="1em" height="1em" />
        <span>{mdDownloadLabel}</span>
      </button>
    </div>
  );
}
