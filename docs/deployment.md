# 部署与访问说明

当前 GitHub Pages 地址：<https://oqwn.github.io/wzj-blog/>。

## GitHub Pages 自动发布

1. 在仓库 [Pages 设置](https://github.com/oqwn/wzj-blog/settings/pages) 中将 Source 设为 **GitHub Actions**。
2. 将网站代码和 `package-lock.json` 推送到 `main`。
3. 查看 [发布工作流](https://github.com/oqwn/wzj-blog/actions/workflows/pages.yml)，等待 build 和 deploy 成功。
4. 打开博客。之后每次推送 `main` 都自动重复这个过程。

工作流在 `.github/workflows/pages.yml`。它使用官方的 Node.js 和 Pages Actions，不需要自己维护 `gh-pages` 分支，也不需要个人令牌。

工作流会安装 Playwright Chromium 与中文字体，供 Mermaid 在构建时生成静态图片，并运行桌面、手机宽度的文章渲染检查。图表语法错误、公式错误或页面检查失败会阻止部署，线上保留上一次成功版本。draw.io 的 SVG 已随源文件提交，构建时不需要连接 draw.io。

首次发布可能需要等待 Pages 地址生效。如果失败，先查看 Actions 的报错步骤；常见原因是 Pages Source 未改为 GitHub Actions、Markdown 的日期或字段格式错误、图片或链接目标不存在。不要通过放宽工作流权限绕过这些问题。

参考：[GitHub 自定义 Pages 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[Astro 的 Pages 部署说明](https://docs.astro.build/en/guides/deploy/github/)。

## 中国大陆访问与免费平台

应关注读者所在网络的实际可达性，而非国籍。海外托管服务在不同运营商、地区和时间的访问体验可能不同；本项目没有进行全国多运营商实测，不能保证所有读者都能稳定访问。

以下信息核实于 **2026-09-06**，免费额度和域名规则以平台最新说明为准。域名注册通常单独收费。

| 平台 | 免费方案与适用情况 | 需要留意 |
| --- | --- | --- |
| GitHub Pages | 与当前仓库和 GitHub Actions 配合，适合先把个人博客跑起来 | 实际访问质量需要按读者网络测试 |
| Cloudflare Pages | 免费方案每月 500 次构建，适合纯静态博客，也可连接 GitHub 自动部署 | 不保证中国大陆各网络稳定可达；默认域名和自定义域名均应实测 |
| 腾讯 EdgeOne Pages / Makers | 提供免费版、静态托管与自定义域名能力；希望面向国内读者时可重点评估 | 大陆访问系统项目域名有预览链接限制，长期公开访问建议绑定自有域名；选大陆或含大陆节点时需满足平台备案要求 |
| Vercel Hobby | 免费个人非商业方案，支持 GitHub 导入及 Astro 静态构建 | 留意个人非商业使用范围；访问质量仍需测试 |
| Netlify Free | 有免费方案，支持 GitHub 自动部署；当前采用每月额度模式 | 部署、带宽和请求会消耗额度，不应当作无限免费服务 |

官方来源：[Cloudflare Pages 限制](https://developers.cloudflare.com/pages/platform/limits/)、[EdgeOne 免费额度](https://edgeone.ai/document/211893332490612736)、[EdgeOne 域名与大陆访问规则](https://pages.edgeone.ai/document/domain-overview)、[Vercel Hobby](https://vercel.com/docs/plans/hobby)、[Netlify 免费额度规则](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/)。

建议先使用 GitHub Pages。若读者反馈访问不稳定，可再将同一仓库连接到 Cloudflare Pages 或 EdgeOne；主要读者在大陆时，优先了解 EdgeOne 的自有域名和节点要求，再决定是否值得购买域名。完全零预算与面向所有国内网络的稳定访问，不能直接划等号。

## 在另一个静态平台部署

以 Cloudflare Pages 为例：

先确认平台构建环境能安装 Chromium 和系统依赖。Mermaid 的构建需要这些依赖；若平台受限，推荐在 GitHub Actions 中构建 `dist/`，再把静态产物上传到目标平台。

1. 登录平台，创建 Pages 项目，连接 GitHub 的 `oqwn/wzj-blog`。
2. 选择生产分支 `main`，框架选 Astro 或静态网站。
3. 安装依赖后准备图表渲染环境：`npx playwright install --with-deps chromium --only-shell`，并安装中文字体。构建命令填 `npm run build`，输出目录填 `dist`，Node.js 版本设为 `24`。
4. 环境变量设为 `BASE_PATH=/` 和 `SITE_URL=https://你的最终域名`。
5. 部署后检查首页、文章、图片、RSS 和 404 页面。

如果平台首次部署后才提供域名，拿到域名后更新 `SITE_URL` 并重新部署一次。纯静态模式不需要 Cloudflare、Vercel 或 Netlify 的服务端适配器。

EdgeOne、Vercel、Netlify 使用相同的构建命令、输出目录和环境变量。平台上的变量只影响该平台构建，不会改变 GitHub Pages 的地址。使用自定义域名还需要按平台提示配置 DNS。

本地模拟根路径部署：

```bash
SITE_URL=https://blog.example.com BASE_PATH=/ npm run verify
```

恢复 GitHub Pages 构建：

```bash
npm run verify
```

## 给 GitHub Pages 绑定自定义域名

1. 在 GitHub Pages 设置中添加自定义域名，并按 GitHub 提示配置 DNS、验证所有权及 HTTPS。
2. 在仓库 **Settings → Secrets and variables → Actions → Variables** 中设置：
   - `SITE_URL`：`https://blog.example.com`
   - `BASE_PATH`：`/`
3. 手动运行发布工作流，或推送一次更新。

工作流会把这两个变量传给 Astro。默认留空时使用 `https://oqwn.github.io` 和 `/wzj-blog`。

如希望本地预览也使用新的域名配置，可以同步修改 `astro.config.mjs` 的默认值。改仓库名或账号名时也要更新该文件、工作流默认值以及 README 地址。

参考：[GitHub 自定义域名管理](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
