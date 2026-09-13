// 生成"最近更新"数据到 public/changelog.json
//
// 为什么优先走 GitHub API 而不是 `git log`：
// GitHub Actions（actions/checkout 默认 fetch-depth: 1）与 Cloudflare Pages
// 都是浅克隆，本地能拿到的历史往往只有触发那一次提交，`git log` 取不到 5 条。
//
// 本脚本任何时候都不会让构建失败：两个来源都失败时保留上一次的文件不动；
// 连旧文件都没有就写空数组，首页会自动隐藏该区块。
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const REPO = "wunai-xc/wunai-blog";
const LIMIT = 5;
const OUT = path.join(process.cwd(), "public", "changelog.json");

function normalize(entry) {
  if (!entry || !entry.message) return null;
  const sha = String(entry.sha || "").slice(0, 8);
  return {
    sha,
    date: entry.date || null,
    message: String(entry.message).split("\n")[0].trim(),
    url: entry.url || `https://github.com/${REPO}/commit/${sha}`,
  };
}

async function fromGitHub() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=${LIMIT}`, {
    headers: {
      Accept: "application/vnd.github+json",
      // GitHub API 要求带 User-Agent
      "User-Agent": "wunai-blog-changelog",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("unexpected payload");
  return data
    .map((c) =>
      normalize({
        sha: c.sha,
        date: c.commit?.author?.date ? String(c.commit.author.date).slice(0, 10) : null,
        message: c.commit?.message,
        url: c.html_url,
      })
    )
    .filter(Boolean);
}

function fromGit() {
  const raw = execSync(
    `git log -${LIMIT} --pretty=format:%h%x09%ad%x09%s --date=short`,
    { encoding: "utf8" }
  );
  return raw
    .split("\n")
    .map((line) => {
      const [sha, date, message] = line.split("\t");
      return normalize({ sha, date, message });
    })
    .filter(Boolean);
}

async function resolve() {
  try {
    const list = await fromGitHub();
    if (list.length) {
      console.log(`changelog: ${list.length} commits (GitHub API)`);
      return list;
    }
  } catch (e) {
    console.warn(`changelog: GitHub API 不可用（${e.message}），尝试 git log`);
  }
  try {
    const list = fromGit();
    if (list.length) {
      console.log(`changelog: ${list.length} commits (git log)`);
      return list;
    }
  } catch (e) {
    console.warn(`changelog: git log 也不可用（${e.message}）`);
  }
  return null;
}

const list = await resolve();

if (list) {
  fs.writeFileSync(OUT, JSON.stringify(list, null, 2));
} else if (fs.existsSync(OUT)) {
  console.warn("changelog: 两个来源都失败，保留已有文件");
} else {
  fs.writeFileSync(OUT, "[]");
  console.warn("changelog: 两个来源都失败，写入空数组（首页会隐藏该区块）");
}
