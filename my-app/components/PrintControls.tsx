"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

interface Props {
  /** 打印按钮文字 */
  printLabel?: string;
  /** MD 下载按钮文字 */
  mdDownloadLabel?: string;
  /** 要下载的 Markdown 完整内容（含 frontmatter） */
  mdContent?: string;
  /** 下载文件名（不含 .md） */
  mdFileName?: string;
}

/**
 * 打印 + Markdown 下载控制按钮
 * 打印：window.print()
 * 下载：用 Blob + a[download] 触发浏览器下载
 */
export default function PrintControls({
  printLabel = "打印",
  mdDownloadLabel = "下载 MD",
  mdContent,
  mdFileName,
}: Props) {
  // 打印结束后清理 body 上加的类
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("print-footer-mode-single", "print-footer-mode-duplex");
    };
    window.addEventListener("afterprint", cleanup);
    return () => window.removeEventListener("afterprint", cleanup);
  }, []);

  function handlePrint() {
    // 默认双面模式：标题在左，页码靠右
    document.body.classList.remove("print-footer-mode-single", "print-footer-mode-duplex");
    document.body.classList.add("print-footer-mode-duplex");
    setTimeout(() => window.print(), 30);
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
        <Icon icon={icons["mdi:printer-outline"]} width="1em" height="1em" />
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
