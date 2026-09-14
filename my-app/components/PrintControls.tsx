"use client";

import { useEffect } from "react";
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
  /** 打印页脚左侧显示的标题 */
  printTitle?: string;
  /** 打印页眉显示的作者 */
  printAuthor?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 本地时间戳：2026-09-14 12:34 */
function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 制作PDF + Markdown 下载控制按钮
 * 制作PDF：调用 window.print()，用户在打印对话框中选择"另存为 PDF"
 * MD：用 Blob + a[download] 触发浏览器下载
 *
 * 另外负责把打印页眉/页脚要用的文本写进 CSS 自定义属性：@page 页边距盒里
 * 只能用 content 描述，取不到当前时间、也读不到 DOM 文本，所以由这里注入。
 * content 的值必须是合法的 <content-list>，字符串要带引号，故用 JSON.stringify
 * 生成（同时把标题里的引号/反斜杠转义掉）。
 */
export default function PrintControls({
  printLabel = "制作PDF",
  mdDownloadLabel = "下载 MD",
  mdContent,
  mdFileName,
  printTitle,
  printAuthor,
}: Props) {
  useEffect(() => {
    const root = document.documentElement;
    const header = () => [stamp(), printAuthor].filter(Boolean).join(" · ");

    const sync = () => root.style.setProperty("--print-header", JSON.stringify(header()));
    if (printTitle) root.style.setProperty("--print-title", JSON.stringify(printTitle));
    sync();

    // 用 beforeprint 刷新时间戳：走按钮和直接按 Ctrl+P 都能拿到接近打印时刻的时间
    window.addEventListener("beforeprint", sync);
    return () => {
      window.removeEventListener("beforeprint", sync);
      root.style.removeProperty("--print-header");
      root.style.removeProperty("--print-title");
    };
  }, [printTitle, printAuthor]);

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
