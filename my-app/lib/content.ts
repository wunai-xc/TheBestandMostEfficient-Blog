import fs from "fs";
import path from "path";
import matter from "gray-matter";

// 类型与站点配置从 site.ts 导出（客户端安全）
export type { Lang, Post, PostFrontmatter } from "./site";
export { SITE } from "./site";
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

