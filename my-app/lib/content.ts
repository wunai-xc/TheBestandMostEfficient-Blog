import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 类型与站点配置从 site.ts 导出（客户端安全）
export type { Lang, Post, PostFrontmatter } from "./site";
export { SITE, readingMinutes, WORDS_PER_MINUTE } from "./site";
import type { Lang, Post, PostFrontmatter } from "./site";

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

/* 必须先去掉代码块与行内代码再找图片：
   否则像 Markdown 语法演示文章里那张语法表（`![alt](url "title")`）
   会把示例文本当成真图片，卡片上就会出现一个坏图。 */
function firstImageInMarkdown(content: string): string | undefined {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "");
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

function loadPostsForLang(lang: Lang): Post[] {
  const dir = path.join(CONTENT_ROOT, lang, "posts");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "_index.md");
  const posts: Post[] = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const { data, content } = readMarkdown(filePath);
    const fm = data as PostFrontmatter;
    if (fm.draft) continue;
    const slug = file.replace(/\.md$/, "");
    posts.push({
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
    });
  }
  // 排序：非 AI 在前，按日期降序；AI 在后，按日期降序
  const nonAI = posts.filter((p) => !p.isAI).sort((a, b) => b.date.localeCompare(a.date));
  const ai = posts.filter((p) => p.isAI).sort((a, b) => b.date.localeCompare(a.date));
  return [...nonAI, ...ai];
}

const _cache: Record<string, Post[]> = {};

export function getPosts(lang: Lang): Post[] {
  if (!_cache[lang]) _cache[lang] = loadPostsForLang(lang);
  return _cache[lang];
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
   已用作「关于」的文章（about）正文已在首屏，不再重复出现在这里。 */
export function getHomeShowcase(lang: Lang, limit = 3): Post[] {
  const pinned = getPinnedPosts(lang).filter((p) => !p.about);
  if (pinned.length) return pinned.slice(0, limit);
  return getPosts(lang)
    .filter((p) => !p.isAI && !p.hiddenInHomeList && !p.about)
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

export function getPrevNext(lang: Lang, slug: string): { prev?: Post; next?: Post } {
  const posts = getPosts(lang);
  const idx = posts.findIndex((p) => p.slug === slug);
  if (idx === -1) return {};
  return { prev: posts[idx + 1], next: posts[idx - 1] };
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

