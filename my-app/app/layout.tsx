import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/content";

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
        {/* KaTeX 样式 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        {/* highlight.js 主题（monokai） */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/monokai.min.css"
          media="(prefers-color-scheme: dark)"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css"
          media="(prefers-color-scheme: light)"
        />
        <link rel="alternate" type="application/rss+xml" title="wunai's blog RSS" href="/rss.xml" />
      </head>
      <body>
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
