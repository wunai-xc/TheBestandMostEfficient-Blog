<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 工作流约定

- **改代码前先拉取远端。** 每次动手修改前先执行 `git pull`，确认本地与 `origin/main` 同步后再改；避免出现非快进推送失败或与他人手动改动冲突。
- 提交信息用中文，一次改动一个主题；完成后推送并确认工作区干净。
