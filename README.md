# The Best and Most Efficient Blog

一个双语（中文 / English）、纯静态、Markdown 驱动的轻量级技术博客。基于 **Next.js 16 App Router** 构建，通过 `output: "export"` 导出为纯静态文件，部署在 **Cloudflare Pages**。

> 在线地址：<https://newblog.wunai.top>

---

## 目录

- [核心特性](#核心特性)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速开始](#快速开始)
- [写作指南](#写作指南)
  - [文章 Frontmatter](#文章-frontmatter)
  - [短代码](#短代码)
  - [图表与可视化](#图表与可视化)
  - [数学与化学公式](#数学与化学公式)
- [站点配置](#站点配置)
- [构建产物与脚本](#构建产物与脚本)
- [部署](#部署)
- [性能与可访问性](#性能与可访问性)
- [常见问题](#常见问题)
- [许可](#许可)

---

## 核心特性

**内容**

- Markdown 写作，YAML（`---`）或 TOML（`+++`）两种 frontmatter 均可
- GitHub Flavored Markdown：表格、任务列表、删除线、自动链接
- 代码高亮（highlight.js，monokai 主题）
- KaTeX 数学公式，内置 `mhchem` 化学式扩展与自定义宏
- 五类图表：Mermaid 流程图、ECharts 数据图、Graphviz DOT 图、abc.js 乐谱、SmilesDrawer 化学结构式
- 参考文献区（frontmatter `references`）+ 正文角标引用 `[reference:N]`
- 中文排版自动优化：CJK 与半角字符之间自动加空格、中文标点自动转换
- 站内搜索（Fuse.js，构建期预生成索引，零运行时后端）
- RSS 订阅、站点地图、robots.txt、PWA（Service Worker + 离线页）

**阅读体验**

- 深色 / 浅色 / 跟随系统三态主题，`localStorage` 持久化且首屏无闪烁
- 7 档正文字号调节
- 动态可互动背景（点网格 + 细连线：网格被光标 / 触点拨动后自行回弹，明暗主题自适应，详见[性能与可访问性](#性能与可访问性)）
- 友链页：卡片列表（图片 / 名称 / 一句话介绍），数据在 `lib/links.ts`
- 页脚：欢迎语 + 邮箱 / GitHub / 本站仓库三个联系方式卡片（数据在 `SITE.contact`）
- 首页：首屏只露一屏「关于」文章（底部渐隐 + 继续阅读），下方是滚动到位渐入的展示位
- 文章页单栏居中，无侧栏；文章目录 / 阅读进度 / 回到顶部以浮动导航形式提供
- 正文亚克力阅读面：半透底 + 毛玻璃，让交互背景只在两侧留白与侧栏隐约可见，不影响正文阅读
- 卡片与上下篇同样为亚克力材质，与阅读面同一套材质语言；暗色下只保留毛玻璃，无白色渐变
- 打印 / 另存为 PDF（专用 `@media print` 样式），一键下载 Markdown 原文
- 评论区（giscus，滚动到可见区域才加载）
- 路由切换过渡动画、元素入场动画，完整支持 `prefers-reduced-motion`
- 中英双语路由与语言切换

---

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Next.js 16.3（App Router，`output: "export"` 静态导出） |
| UI | React 19.2、Tailwind CSS 4（`@tailwindcss/postcss`）+ 自定义 `globals.css` |
| 语言 | TypeScript 5 |
| Markdown | unified / remark（parse、gfm、math、breaks）+ rehype（raw、highlight、katex、slug、autolink、stringify） |
| 公式 | KaTeX 0.16 + `katex/contrib/mhchem` |
| 检索 | Fuse.js 7 |
| 图标 | Iconify（`@iconify/react/offline` + `@iconify/icons-mdi`，离线打包，无运行时请求） |
| 评论 | giscus（GitHub Discussions） |
| 部署 | Cloudflare Pages（wrangler + GitHub Actions） |

> 说明：Mermaid / ECharts / Graphviz / abc.js / SmilesDrawer 均在页面出现对应图表时才从 jsDelivr CDN 按需加载，不进入主包。

---

## 目录结构

```
.
├── .github/
│   └── workflows/deploy.yml        # 推送到 main/master 自动构建并发布到 Cloudflare Pages
├── my-app/                         # Next.js 应用主体
│   ├── app/
│   │   ├── layout.tsx              # 根布局：元数据、主题引导脚本、SVG 滤镜、动态背景、SW 注册
│   │   ├── globals.css             # 全部样式：主题变量、动画引擎、组件样式、打印样式
│   │   ├── page.tsx                # 根路径，重定向到 /zh/
│   │   ├── not-found.tsx
│   │   ├── robots.ts / sitemap.ts  # 静态生成的 robots 与 sitemap
│   │   └── [lang]/                 # zh | en 双语路由
│   │       ├── layout.tsx          # Header + main + Footer
│   │       ├── page.tsx            # 首页（博客介绍 + 展示位）
│   │       ├── posts/page.tsx      # 文章列表
│   │       ├── posts/[slug]/page.tsx  # 文章详情（单栏正文、TOC、上下篇、评论、JSON-LD）
│   │       ├── tags/、categories/  # 标签 / 分类索引与详情
│   │       ├── archives/           # 按年份归档
│   │       ├── links/              # 友链（卡片列表，数据在 lib/links.ts）
│   │       └── search/             # 站内搜索
│   ├── components/
│   │   ├── InteractiveBackground.tsx  # 点网格交互背景（Canvas）
│   │   ├── PostBody.tsx            # 正文渲染 + 复制按钮 + 图表按需加载
│   │   ├── ScrollReveal.tsx        # 滚动到位后渐入（IntersectionObserver）
│   │   ├── Header.tsx / Footer.tsx / PostCard.tsx / PostNav.tsx
│   │   ├── ThemeToggle.tsx / FontSizeControl.tsx / LangSwitcher.tsx
│   │   ├── Comments.tsx / PrintControls.tsx / Search.tsx / RouteLoading.tsx
│   ├── content/                    # 站点内容
│   │   ├── zh/posts/*.md
│   │   └── en/posts/*.md
│   ├── lib/
│   │   ├── content.ts              # 文章读取、frontmatter 解析、排序、聚合
│   │   ├── links.ts                # 友链数据（名称 / 地址 / 图片 / 介绍）
│   │   ├── markdown.ts             # unified 渲染管线、短代码、TOC 提取
│   │   ├── site.ts                 # 站点配置与 i18n 文案（客户端安全）
│   │   └── icons.ts                # Iconify 图标集合
│   ├── public/                     # 静态资源（含构建期生成的搜索索引与 RSS）
│   ├── scripts/
│   │   ├── generate-search-index.mjs  # 生成 search-index.{zh,en}.json
│   │   └── generate-rss.mjs           # 生成 rss.xml
│   ├── next.config.ts              # 静态导出、trailingSlash
│   ├── wrangler.toml               # Cloudflare Pages 项目配置
│   └── package.json
└── README.md
```

---

## 快速开始

### 环境要求

- Node.js **20+**（CI 使用 20）
- npm（仓库包含 `package-lock.json`）

### 本地开发

```bash
cd my-app
npm ci          # 或 npm install
npm run dev     # http://localhost:3000
```

> `dev` 模式不会执行 `prebuild`，因此搜索索引与 RSS 用的是仓库里已有的 `public/` 产物。新增文章后想在本地点验搜索，先跑一次 `npm run prebuild`。

### 构建与本地预览

```bash
cd my-app
npm run build       # 自动先执行 prebuild，产物在 my-app/out/
npx serve out       # 或任意静态服务器
```

### 代码检查

```bash
cd my-app
npm run lint
```

---

## 写作指南

文章放在 `my-app/content/<lang>/posts/` 下，文件名即 URL slug（中文文件名会被 URL 编码）。`_index.md` 会被忽略，`draft: true` 的文章不会进入任何列表与索引。

### 文章 Frontmatter

YAML 写法：

```markdown
---
title: 文章标题
date: 2026-08-02
author: wunai
tags: [数学, 笔记]
categories: [学习]
summary: 列表页与搜索结果显示的摘要
pinned: false
showToc: true
---

正文……
```

TOML 写法（`+++` 包裹，字段名相同，用 `=` 赋值）同样支持。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | string | 标题，缺省时使用文件名 |
| `date` | date | `YYYY-MM-DD`，用于排序、归档与 sitemap `lastModified` |
| `author` | string | 作者。填 `AI`（不区分大小写）会标记为 AI 生成、展示警示徽章，并在列表中排在人类文章之后 |
| `tags` | string[] | 标签，生成标签页与标签云 |
| `categories` | string[] | 分类 |
| `summary` | string | 摘要，缺省时截取正文前 120 字 |
| `description` | string | 更长的描述，用于元信息 |
| `pinned` | bool | 置顶。首页展示位优先取置顶（最多 3 篇，且不显示“置顶”字样）；无置顶时取最新的非 AI 文章 |
| `about` | bool | 标记为「关于」文章：正文直接渲染在首页首屏，并从首页展示位中排除（全站只应有一篇） |
| `pinnedDescription` | string | 置顶说明文案 |
| `hiddenInHomeList` | bool | 不在首页列表显示（仍可通过 URL 与归档访问） |
| `showToc` | bool | 是否显示目录，默认 `true` |
| `draft` | bool | 草稿，不参与构建 |
| `keywords` | string[] | 关键词，写入 JSON-LD |
| `canonicalURL` | string | 规范链接 |
| `cover` | object | 封面：`{ image, caption, hidden, relative }` |
| `references` | array | 参考文献：`[{ title, url, author, year }]`，自动渲染为文末「参考文献」区块 |

排序规则：**非 AI 文章在前、AI 文章在后，各自按日期降序**。阅读时长按 `字数 / 400` 估算，字数统计为「汉字数 + 英文单词数」。

### 短代码

在正文任意位置使用（会先被转成 HTML 再渲染）：

| 语法 | 效果 |
| --- | --- |
| `==高亮文字==` | `<mark>` 高亮 |
| `[reference:3]` | 上标引用角标，跳转到文末第 3 条参考文献 |
| `{{< color "文字" "#e11d48" >}}` | 指定颜色文字 |
| `{{< mark "文字" >}}` | 高亮（等效 `==`） |
| `{{< chem "CCO" >}}` | 化学结构式（SMILES） |
| `{{< chem smiles="CCO" caption="乙醇" width="260" height="180" >}}` | 带说明与尺寸的结构式 |

### 图表与可视化

用带语言标记的围栏代码块书写，正文渲染时会自动替换为对应容器并在需要时加载脚本：

````markdown
```mermaid
graph LR; A[开始] --> B{判断} --> C[结束]
```

```echarts
{ "xAxis": { "type": "category", "data": ["A", "B"] },
  "yAxis": { "type": "value" },
  "series": [{ "type": "bar", "data": [3, 7] }] }
```

```graphviz
digraph { a -> b; b -> c; }
```

```abc
X:1
T:Scale
K:C
C D E F G A B c
```
````

- `echarts` 代码块的内容必须是合法的 ECharts option JSON；容器最小高度 360px，并随容器尺寸自适应重绘。
- 加载失败时容器内会显示中文错误提示，不会阻断页面其余内容。

### 数学与化学公式

- 行内公式 `$...$`，块级公式 `$$...$$`
- 内置宏：`\RR \CC \ZZ \NN \QQ \dd`（分别是 `\mathbb{R}` 等与正体 d）
- 化学式用 mhchem：`$\ce{2H2 + O2 -> 2H2O}$`
- 公式渲染失败不会抛错，会以红色错误色显示，便于定位

### 图片与链接

- 相对路径图片 `![图](./img/a.png)` 会自动解析为 `/<lang>/posts/<slug>/img/a.png`，并加上 `loading="lazy"` 与 `decoding="async"`
- 指向 `xxx.md` 的链接会自动改写成 `/posts/xxx/` 的站内链接
- 正文 HTML 会经过协议过滤，`javascript:` / `vbscript:` / `data:` 一律被替换为 `#`

---

## 站点配置

### 页脚联系方式

页脚的联系方式与欢迎语在 **`my-app/lib/site.ts`** 的 `SITE.contact`：

```ts
contact: {
  label: "欢迎随时来友好交流",
  body: "仓库完全公开，欢迎 clone、参考与自定义修改（文章内容请注明出处）。……",
  email: "3234319738@qq.com",
  github: "https://github.com/wunai-xc",
  repo: "https://github.com/wunai-xc/TheBestandMostEfficient-Blog",
  repoLabel: "本站仓库",
},
```

- 三个按钮分别渲染为 `mailto:`、GitHub 主页、仓库地址（后两个新窗口打开）；显示文本会自动去掉 `https://` 前缀
- 按钮文案（邮箱 / GitHub）与「感谢你的阅读 :D」在 `SITE.i18n.<lang>` 的 `email` / `github` / `thanks`

### 友链

友链数据在 **`my-app/lib/links.ts`** 的 `FRIEND_LINKS` 数组里，页面位于 `/{lang}/links/`，菜单入口在 `SITE.menu`：

```ts
{
  name: "朋友的站",                       // 卡片上显示的名称
  url: "https://example.com/",           // 点击跳转地址（新窗口打开）
  avatar: "/avatars/friend.png",         // 可选：图片地址，绝对 URL 或 public/ 下的路径
  description: { zh: "一句话介绍", en: "One-line intro" },
}
```

- `avatar` 留空时用名称首字生成占位方块，不会出现碎图
- 卡片图片用原生 `<img>` 而非 `next/image`：友链图片可能来自任意域名，`next/image` 需要预先声明 `remotePatterns` 且这里也不需要优化
- 友链页面顶部的介绍文案是 `SITE.i18n.<lang>.linksIntro`

### 站点信息

站点标题、作者、域名、菜单、首页文案与全部界面文案集中在 **`my-app/lib/site.ts`** 的 `SITE` 对象中：

```ts
export const SITE = {
  title: "wunai's blog",
  author: "wunai",
  url: "https://newblog.wunai.top",   // 影响 metadataBase、canonical、JSON-LD
  defaultLang: "zh",
  description: "……",
  homeInfo: { zh: { title, content }, en: { title, content } },
  menu: { zh: [...], en: [...] },     // 导航菜单，external: true 会新窗口打开
  i18n: { zh: {...}, en: {...} },     // 界面文案
};
```

另外两处域名是**硬编码**的，换域名时别忘了同步修改：

- `my-app/scripts/generate-rss.mjs` 中的 `BASE`
- `my-app/app/sitemap.ts` 中的 `base`

评论区配置（仓库、Discussion 分类）在 `my-app/components/Comments.tsx` 中。

---

## 构建产物与脚本

`npm run build` 会先触发 `prebuild`：

| 脚本 | 作用 | 输出 |
| --- | --- | --- |
| `scripts/generate-search-index.mjs` | 遍历 `content/*/posts`，提取标题、摘要、标签与前 2000 字正文 | `public/search-index.zh.json`、`public/search-index.en.json` |
| `scripts/generate-rss.mjs` | 取全站最近 20 篇非草稿文章 | `public/rss.xml` |

随后 Next.js 以 `output: "export"` 静态导出，所有页面在构建期完成渲染（`dynamicParams = false` + `generateStaticParams`），产物位于 `my-app/out/`，完整目录树含 `zh/`、`en/` 两套页面、`sitemap.xml`、`robots.txt`、`rss.xml` 与搜索索引 JSON。

---

## 部署

### Cloudflare Pages（当前使用）

`my-app/wrangler.toml` 已声明输出目录：

```toml
name = "thebestandmostefficient-blog"
pages_build_output_dir = "out"
```

**自动部署**：向 `main` 或 `master` 分支推送即触发 `.github/workflows/deploy.yml`——安装依赖（Node 20，启用 npm 缓存）→ `npm run build` → `wrangler pages deploy out --project-name=thebestandmostefficient-blog`。

需要在仓库 Settings → Secrets and variables → Actions 中配置两个 Secret：

| Secret | 说明 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 具备 Cloudflare Pages 编辑权限的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID |

也可以本地手动发布：

```bash
cd my-app
npm run build
npx wrangler pages deploy out --project-name=thebestandmostefficient-blog
```

> 若同时启用了 Cloudflare Pages 的 Git 集成构建，每次推送会构建两次。两条管线请只保留一条：要么断开 Pages 的 Git 集成、只跑 GitHub Actions；要么在 Pages 的 Build configuration 里把**根目录**设为 `my-app`、构建命令设为 `npm run build`、输出目录设为 `out`（否则安装步骤会在仓库根目录找不到 `package.json`，构建报 `next: not found`）。

### 其他静态托管

`my-app/out/` 是纯静态目录，可直接放到任意静态托管（对象存储 + CDN、Nginx、GitHub Pages 等）。注意：

- 站点使用 `trailingSlash: true`，目录以 `index.html` 结尾，需保证服务器优先返回目录下的 `index.html`
- 需将 404 映射到导出的 `404.html`
- 若部署到子路径，需相应调整 `next.config.ts` 的 `basePath`/`assetPrefix`，并同步 `SITE.url`

---

## 性能与可访问性

**动态可互动背景**（`my-app/components/InteractiveBackground.tsx`）

- 全屏网格点背景：按间距铺满视口，静止时是规整的细网格（点 + 相邻点之间 0.6px 的细线），明暗两种主题下都启用
- 网格连线：只连接上下 / 左右相邻点（所以不会出现跨格的长斜线），点被推开后线段被拉长拉斜，形成“网格被拨动”的形变；静止区用前景色极淡（透明度 0.05），被拉动区转强调色并提亮（0.17）
- 交互：光标移动 / 触屏拖动时，影响半径内的点被推离指针位置，越近推得越远；指针离开或抬指后由弹簧自然回弹归位
- 视觉反馈：位移分 4 档，被推得越远的点越大、越亮，并从前景色过渡到强调色
- 颜色取自 CSS 变量（`--fg` 作静止点、`--accent` 作被推开的点），切换主题时自动重读；暗色下再乘一个透明度系数（`alphaScale`）压低亮度，保持与浅色模式相近的“若有若无”观感
- 手感与网格密度无关：推力、最大位移均按间距等比缩放，窄屏自动缩小间距
- 性能约束：设备像素比上限 2、总点数上限 3000（超出自动放大间距；连线数约为点数的 2 倍）、连线不分段而是按位移分 2 档各一次 `stroke`（无论多少条线，每帧只需 2 次描边）、描点分 4 档各一次 `fill`、每个点的位移与速度存在同一个 `Float32Array` 里避免每帧产生垃圾；每点的位移平方每帧刷一次到 `mag2` 数组，供连线分档与描点共用，热循环里不做开方
- 省电策略：网格静止（含指针悬停不动、位移已达平衡）时彻底停帧，下一个指针 / 触屏事件才唤起重绘；页面切到后台（`visibilitychange`）同样停帧
- 无障碍：`aria-hidden` 装饰性图层、`pointer-events: none` 不拦截任何点击/选中、打印时自动隐藏
- 尊重 `prefers-reduced-motion: reduce`：只绘制一帧静态网格，不启动动画循环、不绑定指针交互

想要关闭或调参：在 `my-app/app/layout.tsx` 移除 `<InteractiveBackground />` 即可关闭；间距、点数上限、影响半径、推力、弹簧刚度、阻尼、分档透明度、暗色亮度系数、线宽与连线透明度（`LINE_WIDTH` / `LINE_ALPHA_REST` / `LINE_ALPHA_ACTIVE`）等都在该组件顶部的常量区集中定义。

**首页与布局**

- 首页首屏有两种形态：存在 `about: true` 的文章时，只露一屏该文正文（底部渐变渐隐），下方给「继续阅读」入口指向文章页；否则退回 `SITE.homeInfo` 的一句简介并撑满一屏（`100svh - header`）
- 首屏渐入 `home-intro-in` 各 2s，标题先、正文延后 0.25s，不会齐刷刷地出现
- 关于版首屏的正文裁剪是纯 CSS（`.home-about-body` 的 `max-height: clamp(320px, 100svh - 300px, 620px)` + `overflow: hidden` + 底部 `mask-image` 渐隐），不切割 HTML，因此不会把标签切坏；代价是首页仍会带上整篇 HTML（这篇约 3.5k 字，无额外资源请求）。打印时自动取消裁切并隐藏「继续阅读」
- 向下滑动图标：锚点到 `#home-posts`，复用 `html { scroll-behavior: smooth }`；在简介版首屏钉在底部，在关于版里跟在正文之后正常排版（`.scroll-hint` 按父级切换定位）
- 展示位取数见 `getHomeShowcase()`：有置顶则取置顶（首页不显示“置顶”徽标，由 `PostCard` 的 `hidePinnedBadge` 控制）；没有置顶则取日期最新的 3 篇非 AI 文章，跳过 `hiddenInHomeList` 与 `about`，保证首页不会全是 AI 稿、也不会与首屏重复
- 文章页为单栏居中（`.post-layout` 最大宽 800px，与原先“侧栏 + 正文”时的正文实测宽度一致），已移除左侧“全部文章”列表；目录 / 阅读进度 / 回到顶部仍以浮动形式提供，不占布局宽度
- `ScrollReveal` 的初始隐藏态写在 CSS 里，组件内附 `<noscript>` 兜底样式，禁用 JS 时内容不会永远不可见；无 `IntersectionObserver` 的浏览器直接显示，不做动画

**其他性能与无障碍细节**

- 亚克力材质由半透底 + `backdrop-filter: blur()` 为基础，浅色额外叠内高光描边与顶部光泽层；取值统一在 `--reading-*`（阅读面）与 `--card-acrylic-*`（卡片）两组自定义属性里，亮/暗各一套，随主题类一起切换（比用 `@media` 复写干净，跟随系统主题时不会出现不一致）
- 两级浓度是刻意的，且亮/暗分别调过：
  - **浅色**：阅读面 0.965、卡片 0.82。正文是深色文字，背底亮点穿透字形会明显干扰阅读，所以阅读面接近不透明，材质感靠毛玻璃 + 内高光 + 顶部光泽 + 投影拿。
  - **暗色**：阅读面 0.68、卡片 0.62（玻璃色抬亮到 `#2c2c33` / `#36363e`），模糊 22px / 16px。暗色下**不要任何白色渐变**——白高光/顶部光泽在深底上会显脏，而原来的面板色与页面底色几乎相同、根本看不出是块“面”，所以改成“抬升的亮玻璃 + 大模糊”。卡片背后原先那层白色发光雾团（`--fog-*`）也一并删除，同理。
- 阅读面自身不带变换：正文入场动画（`unfold-from-title`）作用在内层 `.article` 上，因此 `backdrop-filter` 所在的元素始终零变换，只有其子元素在跑 `transform/opacity` 动画，避免在长文上逐帧重采样背景模糊
- 卡片（`.post-card`）的亚克力放在 `::after` 伪元素上，而不是直接加到卡片：卡片有 JS 驱动的行内 `transform`（鼠标 3D 倾斜）与 `transform-style: preserve-3d`，而 `backdrop-filter` 属于分组属性，与变换同元素会强制扁平化，子元素的 `translateZ(10px)` 深度会失效；放进伪元素两者才能共存。卡片自身保持 `background: transparent`，否则 `backdrop-filter` 会把卡片自己的底当作背景来模糊，不透出背后网格
- 上下篇导航（`.post-nav a`）没有 3D 子元素，亚克力直接加在 `<a>` 上；hover 的 SVG 液态滤镜作用在合成结果之上，与毛玻璃不冲突。浮动的移动端目录面板（`.toc-panel`）刻意保持不透明：它覆盖在正文之上，透出正文会难以辨读
- 打印时卡片与阅读面的亚克力全部重置（`background: none`、取消 `backdrop-filter`、`position/z-index` 归零），避免 PDF 背景发灰或分页错乱
- 暗色下 `post-content::before`（顶部光泽层）直接 `display: none`：它在暗色已是全透明，留着只是白白的合成层
- 主题在 `<head>` 中用一个内联脚本完成引导，避免深色模式闪烁（FOUC）
- 评论区、Mermaid / ECharts / Graphviz / abc.js / SmilesDrawer 全部懒加载，仅在进入视口或正文实际用到时才请求
- 动画统一基于 `transform` / `opacity`，并对系统「减弱动态效果」偏好做全局降级
- 语义化结构：`header` / `main` / `article` / `nav`、面包屑、文章 JSON-LD 结构化数据

---

## 常见问题

**在本地搜索不到新文章？**
`dev` 模式不跑 `prebuild`，执行 `npm run prebuild` 重新生成 `public/search-index.*.json`。

**首页没有出现某篇文章？**
检查该文章的 `draft`、`hiddenInHomeList`、`pinned`（置顶文章只出现在置顶区），以及文件名是否以 `_index.md` 结尾。

**文章排序看起来不对？**
排序先按「是否为 AI 作者」分组，再按日期倒序；`author: AI` 会同时置底并显示 AI 警示徽章。

**中英文之间多出空格？**
这是有意为之的排版优化（CJK 与半角字符间自动加空格）。公式内部的文本会被跳过，不会破坏 KaTeX 排版。

**打包体积里为什么没有 Mermaid / ECharts？**
它们通过 `<script>` 从 CDN 按需注入，仅在页面确实用到对应图表时加载，属于设计取舍：换取更小的主包与更快的首屏。

**新增语言怎么办？**
需要同步新增：`content/<lang>/posts/`、`lib/site.ts` 中的 `menu` / `homeInfo` / `i18n` 条目、`app/[lang]/layout.tsx` 的 `generateStaticParams`、以及两个构建脚本里的 `["zh", "en"]` 数组。

---

## 许可

仓库当前未附带 `LICENSE` 文件，默认保留所有权利。文章内容版权归作者所有；如需转载或复用，请先联系作者获得许可。
