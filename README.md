# 温智钧的博客

用 Markdown 记录技术实践、学习笔记和所思所想。推送到 `main` 后，GitHub Actions 自动检查、构建并发布到 GitHub Pages。

- 博客地址：<https://oqwn.github.io/wzj-blog/>
- 发布状态：[GitHub Actions](https://github.com/oqwn/wzj-blog/actions/workflows/pages.yml)
- RSS：<https://oqwn.github.io/wzj-blog/rss.xml>
- 技术栈：Astro、TypeScript、纯静态 HTML/CSS，无需数据库。

## 开始写作

博客首页按 **财经**、**系统设计**、**编程技术** 三个分类展示，页头的 `EN` / `中文` 按钮切换语言。每篇文章写两份：中文版和英文版分别放在 `content/posts/zh/` 与 `content/posts/en/`，**文件名相同**即视为同一篇文章的两个版本，页面会自动互相链接。

```text
content/posts/
├── zh/cache-design.md   → /wzj-blog/posts/cache-design/
└── en/cache-design.md   → /wzj-blog/en/posts/cache-design/
```

推荐用命令同时生成中英文两份草稿（需要先安装依赖）：

```bash
npm run new -- cache-design "缓存设计笔记" "Notes on cache design" --category=system-design
```

也可以手动新建，例如 `content/posts/zh/cache-design.md`：

```markdown
---
title: "缓存设计笔记"
description: "用一两句话介绍这篇文章。"
category: system-design
date: 2026-09-19
tags: ["缓存"]
draft: false
---

这里开始写正文。
```

英文版 `content/posts/en/cache-design.md` 使用相同的 `category`，标题、摘要和正文写英文即可。

| 字段 | 说明 |
| --- | --- |
| `title` | 必填，文章标题 |
| `category` | 必填，`finance`（财经）、`system-design`（系统设计）或 `programming`（编程技术）；中英文两份必须一致 |
| `date` | 必填，发布日期，推荐 `YYYY-MM-DD` |
| `description` | 可选，列表、订阅和分享时的摘要 |
| `tags` | 可选，标签数组 |
| `draft` | 可选，默认 `false`；设为 `true` 时不生成网页，也不进入 RSS 和站点地图 |
| `updated` | 可选，修改日期，例如 `2026-09-10` |

文件名决定文章地址，建议使用小写英文和连字符；发布后尽量保持文件名不变，以免旧链接失效。支持按子目录整理文章，但中英文两边的子目录要一致。只写了一种语言也能发布，只是切换语言时会回到另一语言的首页；构建时会提示缺少的版本。两份分类不一致会导致构建失败。

`date` 用于展示和排序，不是定时发布开关。草稿通过 `draft` 控制，本地预览也会隐藏草稿；要预览正文，可临时改为 `false`，提交前恢复。中英文两份的 `draft` 分别控制。

仓库是公开的，`draft: true` 只隐藏网站上的文章，**不会隐藏 GitHub 中的源文件**。不要把私密笔记、密码或 API 密钥提交到仓库。

`zh/markdown-example.md` 和 `en/markdown-example.md` 是默认隐藏的写作模板。根目录原有的 `index.md` 已保留，Astro 不会将它作为博客文章发布。

中文 RSS 为 `rss.xml`，英文 RSS 为 `en/rss.xml`。

## 在本地预览

使用 Node.js 24（项目提供 `.nvmrc`）：

```bash
nvm install
nvm use
npm ci
npm run setup:diagrams
npm run dev
```

打开终端显示的地址，并加上 `/wzj-blog/`，通常是 <http://localhost:4321/wzj-blog/>。保存 Markdown 后即可查看更新。

```bash
npm run verify    # 类型、Markdown 渲染、生产构建、链接、草稿和浏览器检查
npm run build     # 生成 dist/ 静态网站
npm run preview   # 预览生产构建
```

Astro 7 的开发服务可能在后台运行；可使用 `npx astro dev stop` 停止。

`setup:diagrams` 首次下载用于生成 Mermaid 图片的 Chromium。更新 Playwright 版本后需要再运行一次。Linux 若缺少系统依赖，执行 `npx playwright install --with-deps chromium --only-shell`，并安装中文字体（例如 `fonts-noto-cjk`）。GitHub Actions 已配置好这些步骤。

## 发布文章

```bash
git add content/
git commit -m "docs: add a new post"
git push origin main
```

打开仓库的 **Actions** 查看 `Build and deploy blog`。绿色成功后刷新博客即可看到更新。修改其他网站文件时，把对应文件一起提交。只在本地保存不会更新线上网站。

不想使用命令行，也可以在 GitHub 的 `content/posts/zh/` 和 `content/posts/en/` 目录选择 **Add file → Create new file**，填写文件名和正文，直接提交到 `main`。

第一次使用或重新配置 Pages 时，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。本项目使用构建产物发布，不再使用根目录的 Jekyll 分支发布。

工作流触发规则：

- 推送到 `main`：检查、测试、构建，成功后部署。
- 向 `main` 发起 Pull Request：只检查和构建，不部署。
- Actions 页面手动运行：选择 `main` 才会部署。

自动部署 CI 无需添加个人访问令牌或自定义部署密钥。CI 使用 GitHub 提供的临时凭据，只有部署任务拥有 Pages 写入权限；构建失败时保留上一次成功发布的网站。

## 图片、链接和代码

图片建议放在 `content/images/`，在文章中使用相对路径。Astro 会处理本地图片并生成适合部署路径的资源地址：

```markdown
![示意图说明](../../images/example.png)
```

文件名需要对应真实图片，中英文两份可以共用同一张图。文章位于 `zh/` 或 `en/` 下，所以是 `../../images/`；更深的子目录要继续调整 `../` 的层级。普通附件可以放在 `public/`；引用它们时要考虑 GitHub Pages 的 `/wzj-blog/` 前缀。

同级文章链接推荐使用相对网页地址，而不是 `.md` 源文件地址：

```markdown
[另一篇文章](../my-post/)
```

标题会生成可展开的文章目录。围栏代码块标注语言后，发布页面会显示语言标签、行号和接近 IDEA 的深色语法高亮；`ts`、`py` 等常见缩写也支持。未指定或无法识别的语言按纯文本显示。右上角“复制”可复制完整源码并显示反馈，保留换行和缩进，不带行号；展开后的 Mermaid 源码同样支持。自动复制不可用时会选中源码并提示手动复制。长代码在框内横向滚动。代码样式配置在 `src/lib/code-blocks.mjs`。支持列表、引用、表格和任务列表。

## Mermaid、draw.io 与数学公式

博客支持 Mermaid 图、draw.io 导出的 SVG、代码高亮、表格对齐、合并单元格、任务列表、脚注、折叠和数学公式。Markdown 回归测试保留在 `tests/markdown.test.mjs`，不代表兼容所有 Markdown 方言。

使用 `mermaid` 代码块写图，推荐提供可访问性说明：

````markdown
```mermaid
flowchart LR
    accTitle: 文章发布流程
    accDescr: 写作后保存到仓库，再发布到博客。
    A[写作] --> B[保存] --> C[发布]
```
````

Mermaid 在构建时渲染成 SVG 图片，读者不需要运行脚本；大图可以在图框中横向滚动，图下的“查看 Mermaid 源码”可展开带高亮的原始代码。错误语法会导致构建失败，保留上一次成功部署。

draw.io 先导出 SVG 或 PNG，再像普通图片一样引用。原始 `.drawio` 文件可与图片一起放在 `content/images/`，作为可编辑源文件保存，但它不是浏览器能直接显示的图片。示例图由 draw.io 官方嵌入接口导出，SVG 已存入仓库，后续构建不依赖 draw.io 服务。

公式使用 `$a^2+b^2=c^2$`（行内）或独占行的 `$$` 包住公式（独立公式）。支持 KaTeX 语法；公式样式和字体一起打包，不使用外部 CDN。显示美元金额时可以转义为 `\$19.99`。

本项目使用 Astro 7 的 `unified` Markdown 处理器，配置在 `src/lib/markdown.mjs`。MDX、Obsidian 双链、`:::note` 等私有语法尚未接入；代码块不执行，页面禁止文章脚本和 iframe。CSP 仅按 SHA-256 内容哈希放行本站的复制脚本，不开放任意脚本或 API 请求。关闭 JavaScript 时复制按钮隐藏，文章、图表和手动选择复制仍可正常使用。

`npm run verify` 会检查有效与无效 Mermaid、特殊字符、公式和 GFM，并用禁用 JavaScript 的浏览器在 1440、390、320px 宽度下检查测试文章。可以单独运行 `npm run test:render`；设置 `SCREENSHOT_DIR=/tmp/blog-rendering` 可保存图表截图。删除测试文章后，浏览器样本检查会跳过，独立的 Markdown 回归测试仍会运行。

## 修改个人信息与外观

- `src/config.ts`：中英文博客名称、作者、介绍和 GitHub 地址。
- `src/lib/i18n.ts`：分类名称和界面中英文文案。
- `src/components/PostIndex.astro`：首页与分类页；`src/components/PostArticle.astro`：文章页。
- `src/styles/global.css`：颜色、布局、导航及响应式样式。
- `src/styles/prose.css`：正文、代码、表格等阅读样式。
- `public/favicon.svg`：浏览器标签页图标。
- `astro.config.mjs`：站点域名和部署路径。

默认使用系统中文字体，页面阅读不依赖外部字体、脚本 CDN 或 JavaScript 框架运行时。

## 部署到其他平台或绑定域名

完整配置和免费平台对比见 [部署说明](docs/deployment.md)。

任何静态托管平台都可使用以下配置：

以下构建命令要求环境已安装上述 Chromium 及系统依赖。受限平台若无法安装，可由 GitHub Actions 构建，再将 `dist/` 静态产物上传到该平台；不要直接沿用缺少图表渲染环境的构建步骤。

| 设置 | 值 |
| --- | --- |
| Node.js | `24` |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 环境变量 `SITE_URL` | 最终网站的域名，例如 `https://blog.example.com` |
| 环境变量 `BASE_PATH` | 根域名部署填 `/`；GitHub 项目 Pages 默认 `/wzj-blog` |

域名和路径配置必须与实际访问地址一致，否则样式、文章链接和 RSS 会指向错误位置。
