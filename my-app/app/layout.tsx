import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/content";
import RouteLoading from "@/components/RouteLoading";
import InteractiveBackground from "@/components/InteractiveBackground";

export const metadata: Metadata = {
  title: { default: SITE.title, template: `%s | ${SITE.title}` },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: "/",
    languages: { "zh-CN": "/zh/", "en-US": "/en/" },
  },
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.title,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* 主题/字号 初始化（避免闪烁） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  try {
    var t = localStorage.getItem('theme') || 'auto';
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    var fs = localStorage.getItem('fontscale');
    if (fs) document.documentElement.setAttribute('data-font-scale', fs);
  } catch(e){}
})();
`,
          }}
        />
        {/* KaTeX 样式（版本与 rehype-katex 使用的 katex 实例保持一致） */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.47/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        {/* highlight.js 主题：monokai（深色背景 + 浅色文字，日/夜间模式均清晰可读） */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/monokai.min.css"
        />
        <link rel="alternate" type="application/rss+xml" title="wunai's blog RSS" href="/rss.xml" />
      </head>
      <body>
        {/* 动态可互动背景：固定铺满视口、位于所有内容之下 */}
        <InteractiveBackground />

        {/* ===== SVG 滤镜定义（全局复用） ===== */}
        <svg
          aria-hidden="true"
          style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
        >
          <defs>
            {/* 液态扭曲：hover 时按钮表面产生有机液态波动 */}
            <filter id="filter-liquid" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" result="displaced" xChannelSelector="R" yChannelSelector="G">
                <animate attributeName="scale" values="0;6;3;6;0" dur="0.6s" begin="indefinite" fill="freeze" id="anim-liquid" />
              </feDisplacementMap>
            </filter>
            {/* 辉光脉冲：按钮 hover 时从内部向外发散柔和光晕 */}
            <filter id="filter-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur2" />
              <feFlood floodColor="var(--accent)" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur2" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* 深度阴影：点击时按钮下陷的 3D 投影 */}
            <filter id="filter-depth" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.15" />
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.08" />
            </filter>
            {/* 卡片立体阴影：多层投影模拟物理光照 */}
            <filter id="filter-card3d" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.04" result="s1" />
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.06" result="s2" />
              <feDropShadow dx="0" dy="12" stdDeviation="24" floodColor="#000000" floodOpacity="0.08" result="s3" />
              <feMerge>
                <feMergeNode in="s1" />
                <feMergeNode in="s2" />
                <feMergeNode in="s3" />
              </feMerge>
            </filter>
            {/* 涟漪扩散：点击按钮时的波纹 */}
            <filter id="filter-ripple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
              <feMorphology operator="dilate" radius="0" in="blur" result="dilated">
                <animate attributeName="radius" values="0;20;30" dur="0.5s" begin="indefinite" fill="freeze" id="anim-ripple" />
              </feMorphology>
              <feFlood floodColor="var(--accent)" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="dilated" operator="in" result="ripple" />
              <feMerge>
                <feMergeNode in="ripple" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <RouteLoading />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(){});
  });
}
`,
          }}
        />
      </body>
    </html>
  );
}
