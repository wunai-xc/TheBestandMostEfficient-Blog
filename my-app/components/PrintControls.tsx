"use client";

import { useEffect } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

interface Props {
  /** 单面打印按钮文字 */
  singleLabel?: string;
  /** 双面打印按钮文字 */
  duplexLabel?: string;
}

/**
 * 打印控制按钮：单面 / 双面
 * 单面：页码居中
 * 双面：页码始终在右侧（左右页相同）
 */
export default function PrintControls({ singleLabel = "单面打印", duplexLabel = "双面打印" }: Props) {
  // 打印结束后清理 body 上加的类
  useEffect(() => {
    const cleanup = () => {
      document.body.classList.remove("print-footer-mode-single", "print-footer-mode-duplex");
    };
    window.addEventListener("afterprint", cleanup);
    return () => window.removeEventListener("afterprint", cleanup);
  }, []);

  function printWith(mode: "single" | "duplex") {
    document.body.classList.remove("print-footer-mode-single", "print-footer-mode-duplex");
    document.body.classList.add(`print-footer-mode-${mode}`);
    // 给浏览器一点时间应用 class
    setTimeout(() => window.print(), 30);
  }

  return (
    <div className="print-controls">
      <button
        type="button"
        className="print-btn"
        onClick={() => printWith("single")}
        title={singleLabel}
        aria-label={singleLabel}
      >
        <Icon icon={icons["mdi:printer-outline"]} width="1em" height="1em" />
        <span>{singleLabel}</span>
      </button>
      <button
        type="button"
        className="print-btn"
        onClick={() => printWith("duplex")}
        title={duplexLabel}
        aria-label={duplexLabel}
      >
        <Icon icon={icons["mdi:book-open-outline"]} width="1em" height="1em" />
        <span>{duplexLabel}</span>
      </button>
    </div>
  );
}
