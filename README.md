# 温智钧的博客

用 Markdown 记录技术实践、学习笔记和所思所想。推送到 `main` 后，GitHub Actions 自动检查、构建并发布到 GitHub Pages。

## 在网页中写作

博客的 **写作** 入口和文章页的 **编辑** 链接会打开 [Pages CMS 写作后台](https://app.pagescms.org/oqwn/wzj-blog/main/collection/posts)。使用 GitHub 登录，无需另建 Cloudflare 账号或手动粘贴个人令牌。后台管理登录会话；退出、会话过期或更换设备时需要重新登录，不保证永久免登录。

首次连接：

1. 点击 **Sign in with GitHub**，用作者账号 `oqwn` 登录。
2. 按提示安装 Pages CMS 的 GitHub App。选择 **Only select repositories**，只勾选 **wzj-blog**。
3. 打开 `oqwn / wzj-blog` 的 **main** 分支，进入 **文章**。仓库已提供 `.pages.yml`，无需重新编写配置。

日常写作：

- 新建或打开一篇文章，在表单中填写标题、日期、摘要和标签。新文章默认开启 **草稿**。
- 正文的 **Source** 模式编辑 Markdown，**Editor** 模式查看和编辑排版。新建时可调整文件名，建议使用小写英文和连字符；发布后保持文件名不变，以免旧链接失效。
- 点击保存会提交 Markdown 到 GitHub。关闭 **草稿** 后保存，现有 CI 自动构建、发布到博客；可在 [Actions](https://github.com/oqwn/wzj-blog/actions/workflows/pages.yml) 查看进度。
- `draft: true` 不进入博客、RSS 或站点地图，**但源文件仍在公开仓库中可见**。

正文使用 Markdown 格式保存，可继续在本地修改。网页保存后，本地写作前先运行 `git pull --ff-only`。后台排版视图与博客主题不完全一致，最终阅读效果以发布后的博客为准。图片可以在 Markdown 源码中引用 HTTPS 图片，或继续通过本地 Git 添加；当前未配置 CMS 图片上传目录。

### 编辑权限

访客能看到「写作」入口，但不会因此获得保存权限。Pages CMS 与 GitHub 检查登录身份和仓库授权；请勿向其他人开放仓库写入权限或邀请 CMS 协作者。配置文件只定义文章编辑表单，不是 GitHub 仓库权限边界。

Pages CMS 是第三方托管服务，安装 GitHub App 相当于授权它访问所选仓库。只授权 `wzj-blog`，可在 [GitHub 已安装的应用](https://github.com/settings/installations) 随时调整或撤销。博客本身不接收或保存登录令牌，旧的个人令牌编辑器已移除；如果之前创建过专用个人令牌，可在 [GitHub 令牌设置](https://github.com/settings/personal-access-tokens) 手动撤销，移除编辑器不会自动撤销令牌。

官方文档：[首次登录与安装](https://pagescms.org/docs/quick-start/)、[权限校验](https://pagescms.org/docs/development/authentication/)、[Markdown 编辑模式](https://pagescms.org/docs/configuration/fields/rich-text/)。

- 博客地址：<https://oqwn.github.io/wzj-blog/>
- 发布状态：[GitHub Actions](https://github.com/oqwn/wzj-blog/actions/workflows/pages.yml)
- RSS：<https://oqwn.github.io/wzj-blog/rss.xml>
- 技术栈：Astro、TypeScript、纯静态 HTML/CSS，无需数据库。

## 开始写作

在 `content/posts/` 中新建一个 `.md` 文件，例如 `my-first-post.md`：

```markdown
---
title: "我的第一篇技术文章"
description: "用一两句话介绍这篇文章。"
date: 2026-09-06
tags: ["技术", "随笔"]
draft: false
---

这里开始写正文。

## 我遇到的问题

直接使用熟悉的 Markdown 语法。

## 我的思考

记录尝试的过程，也记录暂时没有答案的问题。
```

文件名决定文章地址，例如 `my-first-post.md` 对应 `/wzj-blog/posts/my-first-post/`。建议使用小写英文和连字符；发布后尽量保持文件名不变，以免旧链接失效。支持按子目录整理文章。

| 字段 | 说明 |
| --- | --- |
| `title` | 必填，文章标题 |
| `date` | 必填，发布日期，推荐 `YYYY-MM-DD` |
| `description` | 可选，列表、订阅和分享时的摘要 |
| `tags` | 可选，标签数组 |
| `draft` | 可选，默认 `false`；设为 `true` 时不生成网页，也不进入 RSS 和站点地图 |
| `updated` | 可选，修改日期，例如 `2026-09-10` |

`date` 用于展示和排序，不是定时发布开关。草稿通过 `draft` 控制，本地预览也会隐藏草稿；要预览正文，可临时改为 `false`，提交前恢复。

仓库是公开的，`draft: true` 只隐藏网站上的文章，**不会隐藏 GitHub 中的源文件**。不要把私密笔记、密码或 API 密钥提交到仓库。

也可以用命令生成一篇带当天日期的草稿（需要先安装依赖）：

```bash
npm run new -- learning-notes "最近的一些学习笔记"
```

这个命令不会覆盖同名文章。写好后把 `draft: true` 改为 `draft: false`。

目前的 `hello-world.md` 是可以自由修改或删除的开篇示例；`markdown-example.md` 是默认隐藏的写作模板。根目录原有的 `index.md` 已保留，Astro 不会将它作为博客文章发布。

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

不想使用命令行，也可以在 GitHub 的 `content/posts/` 目录选择 **Add file → Create new file**，填写文件名和正文，直接提交到 `main`。

第一次使用或重新配置 Pages 时，在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。本项目使用构建产物发布，不再使用根目录的 Jekyll 分支发布。

工作流触发规则：

- 推送到 `main`：检查、测试、构建，成功后部署。
- 向 `main` 发起 Pull Request：只检查和构建，不部署。
- Actions 页面手动运行：选择 `main` 才会部署。

自动部署 CI 无需添加个人访问令牌或自定义部署密钥。CI 使用 GitHub 提供的临时凭据，只有部署任务拥有 Pages 写入权限；构建失败时保留上一次成功发布的网站。网页编辑的作者授权与 CI 凭据彼此独立。

## 图片、链接和代码

图片建议放在 `content/images/`，在文章中使用相对路径。Astro 会处理本地图片并生成适合部署路径的资源地址：

```markdown
![示意图说明](../images/example.png)
```

文件名需要对应真实图片。子目录内文章要调整 `../` 的层级。普通附件可以放在 `public/`；引用它们时要考虑 GitHub Pages 的 `/wzj-blog/` 前缀。

同级文章链接推荐使用相对网页地址，而不是 `.md` 源文件地址：

```markdown
[第一篇文章](../hello-world/)
```

标题会生成可展开的文章目录，围栏代码块标注语言后在发布页面自动高亮。支持列表、引用、表格和任务列表。Pages CMS 的排版视图用于写作，代码高亮等细节以正式页面为准。

## Mermaid、draw.io 与数学公式

[完整的渲染测试文章](https://oqwn.github.io/wzj-blog/posts/markdown-rendering-lab/)包含三种 Mermaid 图、draw.io SVG、代码、表格对齐、合并单元格、任务列表、脚注、折叠和数学公式。它验证这些具体样例，不代表兼容所有 Markdown 方言。

使用 `mermaid` 代码块写图，推荐提供可访问性说明：

````markdown
```mermaid
flowchart LR
    accTitle: 文章发布流程
    accDescr: 写作后保存到仓库，再发布到博客。
    A[写作] --> B[保存] --> C[发布]
```
````

Mermaid 在构建时渲染成 SVG 图片，读者不需要运行脚本；大图可以在图框中横向滚动。错误语法会导致构建失败，保留上一次成功部署。

draw.io 先导出 SVG 或 PNG，再像普通图片一样引用。原始 `.drawio` 文件可与图片一起放在 `content/images/`，作为可编辑源文件保存，但它不是浏览器能直接显示的图片。示例图由 draw.io 官方嵌入接口导出，SVG 已存入仓库，后续构建不依赖 draw.io 服务。

公式使用 `$a^2+b^2=c^2$`（行内）或独占行的 `$$` 包住公式（独立公式）。支持 KaTeX 语法；公式样式和字体一起打包，不使用外部 CDN。显示美元金额时可以转义为 `\$19.99`。

本项目使用 Astro 7 的 `unified` Markdown 处理器，配置在 `src/lib/markdown.mjs`。网页后台编辑含 Mermaid、公式或复杂 HTML 的文章时，使用 **Source** 模式；后台的 Editor 模式不保证与博客的扩展兼容。MDX、Obsidian 双链、`:::note` 等私有语法尚未接入；代码块不执行，页面禁止脚本和 iframe。

`npm run verify` 会检查有效与无效 Mermaid、特殊字符、公式和 GFM，并用禁用 JavaScript 的浏览器在 1440、390、320px 宽度下检查测试文章。可以单独运行 `npm run test:render`；设置 `SCREENSHOT_DIR=/tmp/blog-rendering` 可保存图表截图。删除测试文章后，浏览器样本检查会跳过，独立的 Markdown 回归测试仍会运行。

## 修改个人信息与外观

- `src/config.ts`：博客名称、作者、介绍、GitHub 地址和写作后台链接。
- `.pages.yml`：Pages CMS 的文章字段、Markdown 编辑模式和草稿默认值。
- `src/pages/index.astro`：首页介绍。
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
