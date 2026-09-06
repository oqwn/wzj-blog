# 温智钧的博客

用 Markdown 记录技术实践、学习笔记和所思所想。推送到 `main` 后，GitHub Actions 自动检查、构建并发布到 GitHub Pages。

## 在网页中写作

打开博客的 **写作** 入口，或文章页上的 **编辑** 链接，即可直接编辑 Markdown 并查看预览。可以新建文章、修改现有文章、下载 Markdown，并保存到 GitHub。名称、日期、标签和 `draft` 在文本顶部修改。

保存之前，展开 **连接作者账号 → 首次如何授权**，按提示在 GitHub 创建细粒度令牌：只选择 `wzj-blog` 仓库，赋予 **Contents: Read and write** 权限，设置短期有效期。请把令牌粘贴到博客编辑页，**不要粘贴到文章或聊天里**。每次重新打开编辑页都需要重新连接。

点击 **保存到 GitHub** 会提交到 `main`，随后由现有 CI 自动发布。`draft: true` 的文章只保存在公开仓库，不会出现在博客列表中。若 GitHub 里的文章已被其他途径修改，保存会报告冲突，不会强行覆盖；先下载当前内容，再重新载入远端文章并合并。

网页修改保存后，本地写作前先运行 `git pull --ff-only`，让本地仓库同步最新内容。

### 编辑权限与安全边界

- 编辑页面可以被访问，但保存需要有效的 GitHub 凭据。界面只接受作者账号 `oqwn`；真正阻止未授权修改的是 GitHub 服务端的仓库权限校验，前端按钮或账号检查不能代替它。
- 程序不会把令牌写入源码、GitHub 仓库、URL、Cookie、localStorage 或 sessionStorage。令牌仅在当前页面内存中使用，只发送到 `api.github.com`，断开连接或离开页面时清除。清除页面里的令牌**不等于撤销 GitHub 令牌**，可随时在 GitHub 设置中撤销。
- Markdown 预览使用不允许脚本和同源访问的 iframe 沙箱，原始 HTML 显示为文本。发布后的阅读页面也用内容安全策略禁止脚本、表单和嵌入页面。编辑器使用本地打包的依赖，没有外部脚本 CDN。
- 编辑器只提供 `content/posts/*.md` 及子目录的读写入口，但令牌的 Contents 权限是**仓库级**，并非目录级。如果令牌泄露，攻击者仍可能修改该仓库的其他普通文件。不要授予所有仓库、管理或工作流权限。
- 浏览器扩展、设备恶意软件或同域其他网站的恶意脚本仍可能威胁页面中的凭据。GitHub 项目 Pages 共用 `oqwn.github.io` 域名，不是彼此独立的安全来源。仅内存保存不能消除这些风险；有更高安全要求时，建议使用独立域名与具备服务端会话的 GitHub OAuth 后台。
- 不希望在博客中输入令牌时，可以在站内写作和预览、下载 Markdown，再通过 GitHub 官方网页编辑器或本地 Git 提交。

参考：[GitHub 文件写入权限](https://docs.github.com/en/rest/repos/contents#create-or-update-file-contents)、[细粒度令牌管理](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)。

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
npm run dev
```

打开终端显示的地址，并加上 `/wzj-blog/`，通常是 <http://localhost:4321/wzj-blog/>。保存 Markdown 后即可查看更新。

```bash
npm run verify    # 类型检查、写作脚本测试、生产构建、链接和草稿检查
npm run build     # 生成 dist/ 静态网站
npm run preview   # 预览生产构建
```

Astro 7 的开发服务可能在后台运行；可使用 `npx astro dev stop` 停止。

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

标题会生成可展开的文章目录，围栏代码块标注语言后在发布页面自动高亮。支持列表、引用、表格和任务列表。网页预览展示常见 Markdown 排版，代码高亮等细节以正式页面为准；原始 HTML 在预览中按文本展示。

## 修改个人信息与外观

- `src/config.ts`：博客名称、作者、介绍、GitHub 地址。
- `src/pages/index.astro`：首页介绍。
- `src/styles/global.css`：颜色、布局、导航及响应式样式。
- `src/styles/prose.css`：正文、代码、表格等阅读样式。
- `public/favicon.svg`：浏览器标签页图标。
- `astro.config.mjs`：站点域名和部署路径。

默认使用系统中文字体，页面阅读不依赖外部字体、脚本 CDN 或 JavaScript 框架运行时。

## 部署到其他平台或绑定域名

完整配置和免费平台对比见 [部署说明](docs/deployment.md)。

任何静态托管平台都可使用以下配置：

| 设置 | 值 |
| --- | --- |
| Node.js | `24` |
| 安装命令 | `npm ci` |
| 构建命令 | `npm run build` |
| 输出目录 | `dist` |
| 环境变量 `SITE_URL` | 最终网站的域名，例如 `https://blog.example.com` |
| 环境变量 `BASE_PATH` | 根域名部署填 `/`；GitHub 项目 Pages 默认 `/wzj-blog` |

域名和路径配置必须与实际访问地址一致，否则样式、文章链接和 RSS 会指向错误位置。
