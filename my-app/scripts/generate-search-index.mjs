// 生成搜索索引到 public/ 目录
import fs from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PUBLIC_ROOT = path.join(process.cwd(), "public");

function readMarkdown(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const tomlMatch = raw.match(/^\+\+\+\s*\n([\s\S]*?)\n\+\+\+\s*\n?/);
  if (tomlMatch) {
    const body = raw.slice(tomlMatch[0].length);
    return { data: parseToml(tomlMatch[1]), content: body };
  }
  // 简易 YAML frontmatter 解析
  const yamlMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (yamlMatch) {
    const body = raw.slice(yamlMatch[0].length);
    return { data: parseYaml(yamlMatch[1]), content: body };
  }
  return { data: {}, content: raw };
}

function parseYaml(block) {
  const result = {};
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf(":");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    result[key] = parseVal(val);
  }
  return result;
}

function parseToml(block) {
  const result = {};
  for (const line of block.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    result[t.slice(0, i).trim()] = parseVal(t.slice(i + 1).trim());
  }
  return result;
}

function parseVal(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    return inner ? inner.split(",").map((s) => parseVal(s.trim())) : [];
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (!isNaN(Number(v))) return Number(v);
  return v;
}

for (const lang of ["zh", "en"]) {
  const dir = path.join(CONTENT_ROOT, lang, "posts");
  if (!fs.existsSync(dir)) continue;
  const docs = fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "_index.md")
    .map((file) => {
      const { data, content } = readMarkdown(path.join(dir, file));
      if (data.draft) return null;
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title || file,
        summary: data.summary || "",
        tags: data.tags || [],
        content: content.replace(/[#>*`\-\[\]]/g, " ").slice(0, 2000),
      };
    })
    .filter(Boolean);
  fs.writeFileSync(
    path.join(PUBLIC_ROOT, `search-index.${lang}.json`),
    JSON.stringify(docs)
  );
  console.log(`Generated search-index.${lang}.json (${docs.length} docs)`);
}
