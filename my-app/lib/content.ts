import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type Lang = "zh" | "en";

export interface PostFrontmatter {
  title: string;
  date: string;
  draft?: boolean;
  author?: string;
  tags?: string[];
  categories?: string[];
  summary?: string;
  description?: string;
  pinned?: boolean;
  pinnedDescription?: string;
  hiddenInHomeList?: boolean;
  showToc?: boolean;
  cover?: { image?: string; caption?: string; hidden?: boolean; relative?: boolean };
  references?: { title: string; url?: string; author?: string; year?: string }[];
  keywords?: string[];
  canonicalURL?: string;
}

export interface Post {
  slug: string;
  lang: Lang;
  title: string;
  date: string;
  author?: string;
  tags: string[];
  categories: string[];
  summary: string;
  description?: string;
  pinned: boolean;
  pinnedDescription?: string;
  hiddenInHomeList: boolean;
  showToc: boolean;
  cover?: PostFrontmatter["cover"];
  references?: PostFrontmatter["references"];
  keywords?: string[];
  content: string;
  filePath: string;
  wordCount: number;
  isAI: boolean;
}

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

function wordCount(content: string): number {
  const zh = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const en = (content.match(/[A-Za-z0-9]+/g) || []).length;
  return zh + en;
}

function isAI(author?: string): boolean {
  return !!author && author.toLowerCase() === "ai";
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
      date: String(fm.date || "1970-01-01"),
      author: fm.author,
      tags: fm.tags || [],
      categories: fm.categories || [],
      summary: fm.summary || content.slice(0, 120).replace(/[#>*`\-\[\]]/g, "").trim(),
      description: fm.description,
      pinned: !!fm.pinned,
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

export function getHomePosts(lang: Lang): Post[] {
  return getPosts(lang).filter((p) => !p.hiddenInHomeList && !p.pinned);
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

export const SITE = {
  title: "wunai's blog",
  author: "wunai",
  url: "https://newblog.wunai.top",
  defaultLang: "zh" as Lang,
  description: "学习笔记与生活思考：数学、物理、化学、医学、技术文章集合",
  homeInfo: {
    zh: { title: "Hi there 👋", content: "欢迎来到我的博客，这里记录我的学习笔记与生活思考。" },
    en: { title: "Hi there 👋", content: "Welcome to my blog — notes on tech and life." },
  },
  menu: {
    zh: [
      { name: "首页", href: "/zh/" },
      { name: "文章", href: "/zh/posts/" },
      { name: "标签", href: "/zh/tags/" },
      { name: "搜索", href: "/zh/search/" },
      { name: "归档", href: "/zh/archives/" },
      { name: "DMCC", href: "https://dmcc.wunai.top/", external: true },
    ],
    en: [
      { name: "Home", href: "/en/" },
      { name: "Posts", href: "/en/posts/" },
      { name: "Tags", href: "/en/tags/" },
      { name: "Search", href: "/en/search/" },
      { name: "Archives", href: "/en/archives/" },
      { name: "DMCC", href: "https://dmcc.wunai.top/", external: true },
    ],
  },
  i18n: {
    zh: { home: "首页", posts: "文章", tags: "标签", search: "搜索", archives: "归档", categories: "分类", prev: "上一篇", next: "下一篇", readingTime: "分钟阅读", words: "字", pinned: "置顶", aiWarning: "注意⚠️ 本文由 AI 生成，可能存在误区，斟酌阅读！！", comments: "评论", searchPlaceholder: "输入关键词搜索", allPosts: "全部文章", onThisPage: "本页目录" },
    en: { home: "Home", posts: "Posts", tags: "Tags", search: "Search", archives: "Archives", categories: "Categories", prev: "Previous", next: "Next", readingTime: "min read", words: "words", pinned: "Pinned", aiWarning: "⚠️ This article was generated by AI and may contain inaccuracies. Read with caution!", comments: "Comments", searchPlaceholder: "Search posts...", allPosts: "All Posts", onThisPage: "On this page" },
  },
};
