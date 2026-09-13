"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import { SITE, type Lang } from "@/lib/site";
import {
  PALETTES,
  READ_WIDTHS,
  BG_MODES,
  MOTIONS,
  DEFAULTS,
  KEYS,
  deriveAccents,
  type PaletteId,
  type ReadWidth,
  type BgMode,
  type Motion,
} from "@/lib/settings";

type State = {
  palette: PaletteId;
  customLight: string;
  customDark: string;
  readWidth: ReadWidth;
  bgMode: BgMode;
  acrylic: boolean;
  motion: Motion;
};

/** 只读 localStorage 的当前值；缺失则回落到默认值 */
function readState(): State {
  const get = (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const pal = (get(KEYS.palette) as PaletteId) || DEFAULTS.palette;
  const light = get(KEYS.accentLight) || "#2563eb";
  return {
    palette: pal,
    customLight: light,
    // 旧数据里可能没有暗色变体，用换算补一个
    customDark: get(KEYS.accentDark) || deriveAccents(light)?.dark || "#60a5fa",
    readWidth: (get(KEYS.readWidth) as ReadWidth) || DEFAULTS.readWidth,
    bgMode: (get(KEYS.bgMode) as BgMode) || DEFAULTS.bgMode,
    acrylic: get(KEYS.acrylic) !== "off",
    motion: (get(KEYS.motion) as Motion) || DEFAULTS.motion,
  };
}

/**
 * 把所有设置同步到 <html>。
 * 与 app/layout.tsx 的内联引导脚本用的是同一套键名与属性名，两者必须一致。
 * 行内变量只在自定义配色时写入，切回预设要移除，避免残留污染其他方案。
 */
function applyToDom(s: State) {
  const el = document.documentElement;
  el.setAttribute("data-palette", s.palette);
  el.setAttribute("data-width", s.readWidth);
  el.setAttribute("data-bg", s.bgMode);
  el.setAttribute("data-acrylic", s.acrylic ? "on" : "off");
  el.setAttribute("data-motion", s.motion);
  if (s.palette === "custom") {
    el.style.setProperty("--accent-custom", s.customLight);
    el.style.setProperty("--accent-custom-dark", s.customDark);
  } else {
    el.style.removeProperty("--accent-custom");
    el.style.removeProperty("--accent-custom-dark");
  }
}

const DEFAULT_STATE: State = {
  palette: DEFAULTS.palette,
  customLight: "#2563eb",
  customDark: "#60a5fa",
  readWidth: DEFAULTS.readWidth,
  bgMode: DEFAULTS.bgMode,
  acrylic: DEFAULTS.acrylic,
  motion: DEFAULTS.motion,
};

export default function SiteSettings({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const [s, setS] = useState<State | null>(null);

  // 首帧不渲染选中态，等读完 localStorage 再渲染，避免水合不一致
  useEffect(() => {
    setS(readState());
  }, []);

  function update(patch: Partial<State>) {
    // 若首次渲染的 useEffect 还没跑（s 为 null），从默认值起步，避免点击被吞掉
    const next = { ...(s ?? DEFAULT_STATE), ...patch };
    setS(next);
    applyToDom(next);
    try {
      localStorage.setItem(KEYS.palette, next.palette);
      localStorage.setItem(KEYS.accentLight, next.customLight);
      localStorage.setItem(KEYS.accentDark, next.customDark);
      localStorage.setItem(KEYS.readWidth, next.readWidth);
      localStorage.setItem(KEYS.bgMode, next.bgMode);
      localStorage.setItem(KEYS.acrylic, next.acrylic ? "on" : "off");
      localStorage.setItem(KEYS.motion, next.motion);
    } catch {
      /* 隐私模式下写盘可能失败，界面照常工作 */
    }
  }

  function pickCustom(input: string) {
    const derived = deriveAccents(input);
    if (!derived) return;
    // 换算后的两个色值既回显到色块，也写进存储 —— 所见即所得
    update({ palette: "custom", customLight: derived.light, customDark: derived.dark });
  }

  function reset() {
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* 忽略 */
    }
    // 字号与主题不归本页管，保持不动
    setS(DEFAULT_STATE);
    applyToDom(DEFAULT_STATE);
  }

  const widthLabel: Record<ReadWidth, string> = {
    narrow: t.widthNarrow,
    normal: t.widthNormal,
    wide: t.widthWide,
  };
  const bgLabel: Record<BgMode, string> = {
    full: t.bgFull,
    dim: t.bgDim,
    off: t.bgOff,
  };
  const motionLabel: Record<Motion, string> = {
    full: t.motionFull,
    lite: t.motionLite,
    off: t.motionOff,
  };

  /* key 必须由调用方给：下面几个 .map 都会渲染成列表 */
  function opt(key: string, active: boolean, label: string, onClick: () => void) {
    return (
      <button
        key={key}
        type="button"
        className="settings-opt"
        aria-pressed={active}
        onClick={onClick}
      >
        <Icon icon={icons["mdi:check"]} className="opt-check" width="1em" height="1em" />
        {label}
      </button>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: "1.6rem", margin: "24px 0 12px" }}>{t.settings}</h1>
      <p className="settings-hint">{t.settingsHint}</p>

      <section className="settings-panel">
        <span className="settings-label">
          <Icon icon={icons["mdi:palette-outline"]} width="1em" height="1em" /> {t.palette}
        </span>
        <div className="settings-swatches">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className="settings-swatch"
              aria-pressed={s?.palette === p.id}
              aria-label={p.id}
              title={p.id}
              onClick={() => update({ palette: p.id })}
            >
              <span style={{ background: p.swatch }} />
            </button>
          ))}

          {/* 自定义：取色器 + 换算后的实际色块，两者一起给用户看到"最终会变成什么颜色" */}
          <input
            type="color"
            className="settings-color"
            aria-label={t.customAccent}
            title={t.customAccent}
            value={s?.customLight || DEFAULT_STATE.customLight}
            onChange={(e) => pickCustom(e.target.value)}
          />
          <button
            type="button"
            className="settings-opt"
            aria-pressed={s?.palette === "custom"}
            onClick={() => s && update({ palette: "custom" })}
          >
            <Icon icon={icons["mdi:check"]} className="opt-check" width="1em" height="1em" />
            <span
              aria-hidden="true"
              style={{
                width: "0.8em",
                height: "0.8em",
                display: "inline-block",
                background: s?.customLight || DEFAULT_STATE.customLight,
              }}
            />
            {t.paletteCustom}
          </button>
        </div>
      </section>

      <section className="settings-panel">
        <span className="settings-label">{t.readWidth}</span>
        <div className="settings-row">
          {READ_WIDTHS.map((w) =>
            opt(w, s?.readWidth === w, widthLabel[w], () => update({ readWidth: w }))
          )}
        </div>
      </section>

      <section className="settings-panel">
        <span className="settings-label">{t.bgEffect}</span>
        <div className="settings-row">
          {BG_MODES.map((m) =>
            opt(m, s?.bgMode === m, bgLabel[m], () => update({ bgMode: m }))
          )}
        </div>
      </section>

      <section className="settings-panel">
        <span className="settings-label">{t.acrylic}</span>
        <div className="settings-row">
          {opt("on", s?.acrylic === true, t.acrylicOn, () => update({ acrylic: true }))}
          {opt("off", s?.acrylic === false, t.acrylicOff, () => update({ acrylic: false }))}
        </div>
      </section>

      <section className="settings-panel">
        <span className="settings-label">{t.motion}</span>
        <div className="settings-row">
          {MOTIONS.map((m) =>
            opt(m, s?.motion === m, motionLabel[m], () => update({ motion: m }))
          )}
        </div>
      </section>

      <button type="button" className="settings-opt settings-reset" onClick={reset}>
        <Icon icon={icons["mdi:restore"]} width="1em" height="1em" />
        {t.resetSettings}
      </button>
    </div>
  );
}
