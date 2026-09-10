"use client";

import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

interface Props {
  /** PDF 按钮文字 */
  printLabel?: string;
  /** MD 下载按钮文字 */
  mdDownloadLabel?: string;
  /** 要下载的 Markdown 完整内容（含 frontmatter） */
  mdContent?: string;
  /** 下载文件名（不含 .md） */
  mdFileName?: string;
}

/**
 * 制作PDF + Markdown 下载控制按钮
 * 制作PDF：调用 window.print()，用户在打印对话框中选择"另存为 PDF"
 * MD：用 Blob + a[download] 触发浏览器下载
 */
export default function PrintControls({
  printLabel = "制作PDF",
  mdDownloadLabel = "下载 MD",
  mdContent,
  mdFileName,
}: Props) {
  function handlePrint() {
    window.print();
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
      >
        <Icon icon={icons["mdi:file-pdf-box"]} width="1em" height="1em" />
        <span>{printLabel}</span>
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
