import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 类型与站点配置从 site.ts 导出（客户端安全）
export type { Lang, Post, PostFrontmatter, PostGroup } from "./site";
export { SITE, readingMinutes, WORDS_PER_MINUTE } from "./site";
import type { Lang, Post, PostFrontmatter, PostGroup } from "./site";

const CONTENT_ROOT = path.join(process.cwd(), "content");

function readMarkdown(filePath: string): { data: Record<string, any>; content: string } {
  const raw = fs.readFileSync(filePath, "utf8");
  // 支持 TOML frontmatter (+++) — 转成 YAML 给 gray-matter
  const tomlMatch = raw.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n?/);
  if (tomlMatch) {
    const tomlBlock = tomlMatch[1];
    const body = raw.slice(tomlMatch[0].length);
    const parsed = parseToml(tomlBlock);
    return { data: parsed, content: body };
  }
  const m = matter(raw);
  return { data: m.data as Record<string, any>, content: m.content };
}

// 简易 TOML 解析（仅支持本站用到的字段：string/number/array/boolean/date）
function parseToml(block: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = block.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    result[key] = parseTomlValue(val);
  }
  return result;
}

function parseTomlValue(val: string): any {
  // 字符串
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // 数组
  if (val.startsWith("[") && val.endsWith("]")) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((s) => parseTomlValue(s.trim()));
  }
  // boolean
  if (val === "true") return true;
  if (val === "false") return false;
  // number / date
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val;
  if (!isNaN(Number(val))) return Number(val);
  return val;
}

// 规范化日期：gray-matter 会把 YAML 中的 date 解析为 Date 对象，
// String(dateObj) 会输出 "Sun Aug 02 2026 00:00:00 GMT+0000..." 这种丑陋字符串。
// 统一转为 YYYY-MM-DD 字符串，便于排序、归档切片与一致显示。
function normalizeDate(date: any): string {
  if (date instanceof Date) {
    // YAML 时间戳按 UTC 解析，用 UTC getter 保证日期正确
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(date || "");
  // 提取 YYYY-MM-DD 部分（兼容 "2026-08-02 14:30" 等带时间的写法）
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : (s || "1970-01-01");
}

function wordCount(content: string): number {
  const zh = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (content.match(/[A-Za-z0-9]+/g) || []).length;
  return zh + en;
}

function isAI(author?: string): boolean {
  return !!author && author.toLowerCase() === "ai";
}

/* ===== 卡片缩略图 =====
   优先 frontmatter 的 cover.image；没写封面则回退到正文第一张图，
   这样已有文章不用逐个补封面就能看到效果。cover.hidden 为 true 时不展示。 */

/** 与 lib/markdown.ts 的 rehypeImages 保持同一套路径规则：
    绝对 URL / 站内绝对路径直接用，相对路径补成 /<lang>/posts/<slug>/<src> */
function resolveAsset(lang: Lang, slug: string, src: string): string {
  const s = src.trim();
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("/") || s.startsWith("data:")) return s;
  return `/${lang}/posts/${slug}/${s}`;
}

/* 按行剥掉围栏代码块与行内代码。

   为什么不用正则 replace(/```[\s\S]*?```/g)：
   本站文档里会用四个反引号包裹含三反引号的示例（````` ```` ```markdown … ``` ```` `````），
   而四个反引号里本身就包含三个反引号 —— 正则会先与它其中的三个配对，
   配对就此错位，把后面的真图片从代码块里“漏”出来，当成缩略图 → 碎图。
   按行处理、并要求闭合符字符相同且长度不短于开启符，才符合 CommonMark 的规则。 */
function stripCodeBlocks(md: string): string {
  const out: string[] = [];
  let fence: string | null = null; // 开启时的围栏标记，如 "```" 或 "````"
  for (const line of md.split("\n")) {
    const m = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      // 块内：只有同字符且不短于开启符的围栏才算闭合
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      continue;
    }
    if (m) {
      fence = m[1];
      continue;
    }
    out.push(line);
  }
  // 行内代码（示例文本如 `![alt](url)`）同样要去掉
  return out.join("\n").replace(/`[^`\n]*`/g, "");
}

function firstImageInMarkdown(content: string): string | undefined {
  const stripped = stripCodeBlocks(content);
  const md = stripped.match(/!\[[^\]]*\]\(\s*([^)\s]+)/);
  if (md) return md[1];
  const html = stripped.match(/<img[^>]*\ssrc=["']([^"']+)/i);
  return html ? html[1] : undefined;
}

function pickThumbnail(
  fm: PostFrontmatter,
  content: string,
  lang: Lang,
  slug: string
): string | undefined {
  if (fm.cover?.hidden) return undefined;
  const declared = fm.cover?.image;
  if (declared) return resolveAsset(lang, slug, declared);
  const fromBody = firstImageInMarkdown(content);
  return fromBody ? resolveAsset(lang, slug, fromBody) : undefined;
}

/* ===== 内容加载：平铺文章 + 单篇文件夹 + 卡组 =====

   支持三种写法（都在 content/<lang>/posts/ 下）：
     ① 平铺：  我的文章.md                                  → slug = 文件名
     ② 单篇文件夹：我的文章/index.md                        → slug = 目录名
     ③ 卡组：   我的文章/_index.md + 若干 .md             → 文件夹名即组名

   卡组内的文章在全局仍是普通文章（归档 / 标签 / 搜索 / RSS 照旧能用），
   只是多带一个 group 字段；首页与文章列表页会把它折叠成一张卡组卡片。 */

/** 组内排序：order 优先；没有 order 时按文件名数字前缀（如 01-xxx）；
    再没有就按 slug 字典序。 */
function compareGroupMembers(a: Post, b: Post): number {
  if (a.order != null || b.order != null) {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
  }
  const ar = numericPrefix(a.slug);
  const br = numericPrefix(b.slug);
  if (ar != null && br != null && ar !== br) return ar - br;
  if (ar != null && br == null) return -1;
  if (ar == null && br != null) return 1;
  return a.slug.localeCompare(b.slug);
}

function numericPrefix(slug: string): number | null {
  const m = slug.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** 卡组封面：绝对 URL / 站内绝对路径直接用，相对路径按 /<lang>/groups/<组名>/ 解析 */
function resolveGroupAsset(lang: Lang, group: string, src: string): string {
  const s = src.trim();
  if (/^(https?:)?\/\//i.test(s) || s.startsWith("/") || s.startsWith("data:")) return s;
  return `/${lang}/groups/${group}/${s}`;
}

function parsePost(
  filePath: string,
  lang: Lang,
  slug: string,
  group?: string
): Post | null {
  const { data, content } = readMarkdown(filePath);
  const fm = data as PostFrontmatter;
  if (fm.draft) return null;
  return {
    slug,
    lang,
    title: fm.title || slug,
    date: normalizeDate(fm.date),
    author: fm.author,
    tags: fm.tags || [],
    categories: fm.categories || [],
    summary: fm.summary || content.slice(0, 120).replace(/[#>*`\-\[\]]/g, "").trim(),
    description: fm.description,
    pinned: !!fm.pinned,
    about: !!fm.about,
    group,
    order: typeof fm.order === "number" ? fm.order : undefined,
    thumbnail: pickThumbnail(fm, content, lang, slug),
    pinnedDescription: fm.pinnedDescription,
    hiddenInHomeList: !!fm.hiddenInHomeList,
    showToc: fm.showToc !== false,
    cover: fm.cover,
    references: fm.references,
    keywords: fm.keywords,
    content,
    filePath,
    wordCount: wordCount(content),
    isAI: isAI(fm.author),
  };
}

interface ContentBundle {
  posts: Post[];
  groups: PostGroup[];
}

function loadContent(lang: Lang): ContentBundle {
  const dir = path.join(CONTENT_ROOT, lang, "posts");
  if (!fs.existsSync(dir)) return { posts: [], groups: [] };

  const groupMetas: { group: PostGroup; members: Post[] }[] = [];
  const standalone: Post[] = [];
  const used = new Set<string>();

  // 组内成员若与已有 slug 撞名，加上组名前缀，保证 URL 唯一且构建可重现
  const uniqueSlug = (base: string, group?: string): string => {
    if (!used.has(base)) return base;
    if (group && !used.has(`${group}--${base}`)) return `${group}--${base}`;
    let i = 2;
    while (used.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const groupIndex = path.join(sub, "_index.md");
      const leafIndex = path.join(sub, "index.md");

      // ① 单篇文件夹（leaf bundle）：index.md 就是这篇文章，slug 用目录名
      if (!fs.existsSync(groupIndex)) {
        if (fs.existsSync(leafIndex)) {
          const post = parsePost(leafIndex, lang, uniqueSlug(entry.name));
          if (post) {
            used.add(post.slug);
            standalone.push(post);
          }
        }
        continue;
      }

      // ② 卡组：_index.md 是组元信息，同目录下其它 .md 是组内文章
      const meta = readMarkdown(groupIndex).data as PostFrontmatter;
      const members: Post[] = [];
      for (const f of fs.readdirSync(sub).filter((f) => f.endsWith(".md"))) {
        if (f === "_index.md" || f === "index.md") continue;
        const base = f.replace(/\.md$/, "");
        const post = parsePost(path.join(sub, f), lang, uniqueSlug(base, entry.name), entry.name);
        if (post) {
          used.add(post.slug);
          members.push(post);
        }
      }
      if (members.length < 2) {
        // 组内不足 2 篇就不算卡组，避免把单篇当组白添一层
        for (const m of members) standalone.push({ ...m, group: undefined });
        continue;
      }
      members.sort(compareGroupMembers);
      const coverDeclared = meta.cover?.image;
      groupMetas.push({
        group: {
          slug: entry.name,
          lang,
          title: meta.title || entry.name,
          description: meta.description || meta.summary,
          date: members.reduce((d, m) => (m.date > d ? m.date : d), members[0].date),
          cover:
            meta.cover?.hidden || !coverDeclared
              ? undefined
              : resolveGroupAsset(lang, entry.name, coverDeclared),
          posts: members,
          wordCount: members.reduce((n, m) => n + m.wordCount, 0),
        },
        members,
      });
      continue;
    }

    if (!entry.name.endsWith(".md") || entry.name === "_index.md") continue;
    const base = entry.name.replace(/\.md$/, "");
    const post = parsePost(path.join(dir, entry.name), lang, uniqueSlug(base));
    if (post) {
      used.add(post.slug);
      standalone.push(post);
    }
  }

  const all = [...standalone, ...groupMetas.flatMap((g) => g.members)];
  // 排序：非 AI 在前，按日期降序；AI 在后，按日期降序
  const nonAI = all.filter((p) => !p.isAI).sort((a, b) => b.date.localeCompare(a.date));
  const ai = all.filter((p) => p.isAI).sort((a, b) => b.date.localeCompare(a.date));
  const groups = groupMetas
    .map((g) => g.group)
    .sort((a, b) => b.date.localeCompare(a.date));

  return { posts: [...nonAI, ...ai], groups };
}

const _cache: Record<string, ContentBundle> = {};

function bundle(lang: Lang): ContentBundle {
  if (!_cache[lang]) _cache[lang] = loadContent(lang);
  return _cache[lang];
}

export function getPosts(lang: Lang): Post[] {
  return bundle(lang).posts;
}

/** 卡组列表，已按组内最新文章日期降序 */
export function getGroups(lang: Lang): PostGroup[] {
  return bundle(lang).groups;
}

/**
 * output: ".export" 要求每个动态路由至少产出一个页面，而 generateStaticParams
 * 返回空数组会直接令构建失败（如“一个卡组都还没有”时）。
 * 列表为空时改写回这个占位参数，页面里查不到对应实体就会走 notFound()，
 * 最终只多生成一个 404 页，站点照常可构建。
 */
export const EMPTY_PARAM = "__none__";

export function getGroup(lang: Lang, slug: string): PostGroup | undefined {
  return getGroups(lang).find((g) => g.slug === slug);
}

/** 不属于任何卡组的文章，供首页与列表页混排使用 */
export function getLoosePosts(lang: Lang): Post[] {
  return getPosts(lang).filter((p) => !p.group);
}

export function getPost(lang: Lang, slug: string): Post | undefined {
  return getPosts(lang).find((p) => p.slug === slug);
}

export function getAllSlugs(lang: Lang): string[] {
  return getPosts(lang).map((p) => p.slug);
}

export function getAllTags(lang: Lang): string[] {
  const set = new Set<string>();
  getPosts(lang).forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

export function getAllCategories(lang: Lang): string[] {
  const set = new Set<string>();
  getPosts(lang).forEach((p) => p.categories.forEach((c) => set.add(c)));
  return Array.from(set).sort();
}

export function getPostsByTag(lang: Lang, tag: string): Post[] {
  return getPosts(lang).filter((p) => p.tags.includes(tag));
}

export function getPostsByCategory(lang: Lang, category: string): Post[] {
  return getPosts(lang).filter((p) => p.categories.includes(category));
}

export function getPinnedPosts(lang: Lang): Post[] {
  return getPosts(lang).filter((p) => p.pinned);
}

/* 首页展示位（最多 3 篇）：
   有置顶则只展示置顶；没有置顶时取最新的非 AI 文章（AI 文不占首页位）。
   已用作「关于」的文章（about）正文已在首屏，不再重复出现在这里。
   卡组内文章一律不上首页——卡组只出现在文章列表页。 */
export function getHomeShowcase(lang: Lang, limit = 3): Post[] {
  const pinned = getPinnedPosts(lang).filter((p) => !p.about && !p.group);
  if (pinned.length) return pinned.slice(0, limit);
  return getPosts(lang)
    .filter((p) => !p.isAI && !p.hiddenInHomeList && !p.about && !p.group)
    .slice(0, limit);
}

/* 「关于」文章：首页首屏直接渲染它的正文 */
export function getAboutPost(lang: Lang): Post | undefined {
  return getPosts(lang).find((p) => p.about);
}

export interface ChangelogEntry {
  /** 短 sha */
  sha: string;
  /** YYYY-MM-DD；来源拿不到时为 null */
  date: string | null;
  /** 提交信息首行 */
  message: string;
  /** 提交在 GitHub 上的地址 */
  url: string;
}

/* 首页「最近更新」：数据由 scripts/generate-changelog.mjs 在构建前写入。
   文件缺失或损坏时返回空数组，首页会自动隐藏该区块（本地 dev 未跑 prebuild 时就属于这种情况）。 */
export function getChangelog(): ChangelogEntry[] {
  try {
    const file = path.join(process.cwd(), "public", "changelog.json");
    const list = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(list)) return [];
    return list.filter((e) => e && typeof e.message === "string" && e.message);
  } catch {
    return [];
  }
}

/* 上一篇 / 下一篇：
   卡组内文章只在组内接续，不与组外文章互通；
   组外文章同理，不会走到卡组里去。 */
export function getPrevNext(lang: Lang, slug: string): { prev?: Post; next?: Post } {
  const post = getPost(lang, slug);
  if (!post) return {};

  if (post.group) {
    const members = getGroup(lang, post.group)?.posts ?? [];
    const idx = members.findIndex((p) => p.slug === slug);
    if (idx === -1) return {};
    return { prev: members[idx + 1], next: members[idx - 1] };
  }

  const loose = getLoosePosts(lang);
  const idx = loose.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return { prev: loose[idx + 1], next: loose[idx - 1] };
}

export function getArchives(lang: Lang): Record<string, Post[]> {
  const byYear: Record<string, Post[]> = {};
  for (const p of getPosts(lang)) {
    const year = p.date.slice(0, 4);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(p);
  }
  return byYear;
}

