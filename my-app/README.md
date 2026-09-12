# my-app

博客的 Next.js 应用主体（App Router，静态导出）。完整的项目说明、写作指南与部署文档见仓库根目录的 [`../README.md`](../README.md)。

## 常用命令

```bash
npm ci                # 安装依赖（建议使用 package-lock.json）
npm run dev           # 开发服务器 http://localhost:3000
npm run prebuild      # 重新生成搜索索引 public/search-index.*.json 与 RSS public/rss.xml
npm run build         # 静态导出到 out/（会自动先执行 prebuild）
npm run lint          # ESLint
```

## 约定

- 内容全部在 `content/<lang>/posts/*.md`，文件名即 URL slug
- 站点标题、域名、菜单与界面文案集中在 `lib/site.ts`
- Markdown 渲染管线与短代码在 `lib/markdown.ts`，文章读取与排序在 `lib/content.ts`
- 样式集中在 `app/globals.css`（主题变量、动画、打印样式）
