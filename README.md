# 温智钧的博客

我的个人博客，中英双语，记录我平时在看和在想的东西：

- **财经** —— 市场、宏观和投资笔记
- **商业案例** —— 公司、生意模式的拆解
- **系统设计** —— 架构与工程实践
- **编程技术** —— 写代码时的经验和踩坑
- **个人成长** —— 学习方法、习惯和思考

地址：<https://oqwn.github.io/wzj-blog/> ｜ RSS：<https://oqwn.github.io/wzj-blog/rss.xml>

用 Astro 生成纯静态页面，推送到 `main` 后由 GitHub Actions 自动构建并发布。

## 写作

中英文各一份，文件名相同即为同一篇文章：`content/posts/zh/<slug>.md` 和 `content/posts/en/<slug>.md`。新建草稿：

```bash
npm run new -- cache-design "缓存设计笔记" "Notes on cache design" --category=system-design
```

frontmatter 里 `title`、`category`、`date` 必填，`category` 取 `finance`、`business-cases`、`system-design`、`programming`、`personal-growth` 之一，中英文两份必须一致。新文章默认 `draft: true`，不会出现在网站上（但源文件在公开仓库里可见）。

确认内容后发布：

```bash
npm run publish-post -- cache-design
```

它会把两份改成非草稿、完整构建检查一遍，然后只提交这两个文件并推送。

## 本地预览

需要 Node.js 24（见 `.nvmrc`）：

```bash
nvm use
npm ci
npm run setup:diagrams
npm run dev
```

打开 <http://localhost:4321/wzj-blog/>。`npm run verify` 跑类型、渲染、构建和链接检查。

## 其他

- 分类名称和界面文案：`src/lib/i18n.ts`；博客名称和简介：`src/config.ts`；样式：`src/styles/`。
- 支持 Mermaid 图、数学公式、代码高亮和脚注，写法参考 `content/posts/zh/markdown-example.md`。
- 其他项目里的 AI 可以通过 `scripts/mcp-server.mjs`（MCP）帮我起草文章，但只能写草稿，发布仍然由我手动执行。
- 部署到其他平台或绑定域名：见 [部署说明](docs/deployment.md)。
