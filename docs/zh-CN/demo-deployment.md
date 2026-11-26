# Vulse 演示网站部署

## 1. 静态界面演示（GitHub Pages）

演示源代码位于 `packages/vulse/demo/`。它复用真实的 Vue 管理界面和 Vue Router，使用浏览器内存中的模拟数据接口，并提供可切换中英文的示例网站。

- 访问预计地址：`https://lanechi.github.io/vulse/`（GitHub Pages 发布成功后）。
- 后台预计地址：`https://lanechi.github.io/vulse/#/admin`。
- 不使用真实 D1、R2、Better Auth 或 SSR，所有修改在刷新时重置。
- 不输入真实密码、客户资料或任何敏感信息；演示不发送邮件、不执行部署钩子，也不允许真正重置账户密码。
- 模拟实现不等同于服务端业务验证，树形集合、真实预览、导入模板、真实权限及身份认证不在静态演示范围。

### 启用 GitHub Pages

1. 打开 [仓库 Settings → Pages](https://github.com/lanechi/vulse/settings/pages)。
2. 在 Build and deployment 的 Source 中选择 GitHub Actions。
3. 打开 [仓库 Actions](https://github.com/lanechi/vulse/actions)，选择 Vulse demo — GitHub Pages 工作流。
4. 点击 Run workflow，工作流所在分支选择 `main`，参数 `demo_ref` 选择 `feature/admin-spa`（合并后可选择 `main`）。
5. 查看 build 和 deploy 作业。只有部署成功并返回 GitHub Pages 地址后，才能确认演示网站已经上线。

工作流存放在主分支，使其可以在不合并 SPA 草稿 PR 的情况下手动构建指定演示分支。构建作业只有仓库读取权限，部署作业使用 GitHub Pages 所需的短期身份认证。

### 本地构建

从仓库根目录执行：

```bash
git switch feature/admin-spa
pnpm install --frozen-lockfile
pnpm --filter @vulsecms/core demo:dev
# 或构建静态输出
pnpm --filter @vulsecms/core demo:build
```

输出目录：`packages/vulse/demo/dist/`。路由使用 Hash History，适配 GitHub Pages 项目路径及深层链接。

## 2. 完整功能在线演示（Cloudflare Workers）

GitHub Pages 不能直接运行 Vulse 的 Astro SSR、D1、R2 或服务器端认证。要演示完整功能，应为演示专门创建 Cloudflare Worker、D1 数据库和 R2 Bucket，并使用独立的开发/演示资源和密钥。

参阅 [安装指南](installation.md) 和 [生产部署英文原文](../deployment.md)。建议先运行本地 Playground，并验证后台 SPA、权限、数据库迁移、发布、预览及表单。生产部署使用独立的 Wrangler 配置，禁用不需要的公开注册，禁止匿名管理员写入，不公开任何真实账户凭证。

静态演示与生产程序隔离；Mock API 仅从演示入口导入，不能用于生产环境。完整线上 Worker 部署尚未配置或执行。
