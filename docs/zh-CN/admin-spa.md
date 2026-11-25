# 管理后台 SPA 改造

## 架构

此分支将默认的 `/admin` 管理后台改为 Vue 3 单页应用。公开网站继续使用 Astro SSR；不修改 D1、R2 数据库结构、Better Auth 认证系统或既有业务 API。

- `admin/pages/spa.astro`：仅提供 HTML 壳及客户端 Vue 挂载点；不读取具体后台页面的数据。
- `admin/components/AdminSpa.vue`：单一 Vue 根组件、持久侧栏、异步加载业务组件、Vue Router 4 路由。
- `admin/client/spa-routes.ts`：浏览器和服务器共享的路由定义，覆盖原有 28 个路由模式。
- `admin/client/spa-navigation.ts`：客户端导航入口，旧 Astro 页面仍可回退至原有整页跳转。
- `server/endpoints/api-vulse-admin-page.ts`：受会话及角色保护的页面初始化数据 API；每次请求验证权限，不缓存私有数据。

使用 Vue Router 4.6.3 的 Web History、RouterView、路由记录及异步页面组件；同步更新 pnpm 锁文件。不引入 Pinia。后台业务组件继续复用 Tailwind CSS 4、Tiptap 及现有 API 客户端。

## 路由与部署

默认 `/admin` 及 `/admin/*` 均加载同一 Astro 壳，页面切换由客户端管理；直接访问深层路径仍通过 Worker 和原认证中间件。登录及退出后保留完整页面加载以重建会话边界。公开网站和 API 路由不进入 SPA。

自定义 `adminPath` 暂时保留原有 Astro 路由，不宣称解决原项目对 /admin 硬编码的问题。本方案不是独立静态文件部署的 Vite SPA；仍通过 Astro 集成和同一个 Worker 提供后台。

## GitHub Pages 静态演示

演示位于 `packages/vulse/demo/`，直接复用实际 Vue 后台组件与 Vue Router（Hash History），通过隔离的浏览器内存 Mock API 提供示例数据。无需真实登录，所有修改在刷新页面时重置。模拟 API 不会写入 D1、R2、发送邮件、调用真实认证或执行部署钩子。示例公开站点由 Vue 渲染，**不是 Astro SSR 的线上实例**。树形集合、导入模板、真实预览、真实认证等依赖服务器的能力不在此演示范围内。

```bash
pnpm install --frozen-lockfile
pnpm --filter @vulsecms/core demo:dev
pnpm --filter @vulsecms/core demo:build
```

静态输出：`packages/vulse/demo/dist/`。GitHub Pages 发布方式见 [演示网站部署](demo-deployment.md)。

## 验证步骤（尚待运行）

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm --filter @vulsecms/core typecheck
pnpm --filter @vulsecms/core test
pnpm --filter @vulsecms/core build
cd playground/vulse-play
pnpm build
pnpm dev
```

如果尚未初始化开发数据库，请参阅 [安装指南](installation.md)。

手动测试：

1. 登录、退出、未登录直接访问后台、编辑者与会员权限、2FA。
2. 从内容列表、媒体库、设置等菜单切换页面，确认 Network 中没有新的 Document 请求；刷新深层 URL 后正常恢复。
3. 新建内容、编辑草稿、发布、切换语言、历史恢复及实时预览。
4. 表单、提交记录、媒体、用户、模型、字段组、全局内容、重定向管理。
5. 浏览器前进后退、快速切换、API 失败重试及会话过期。
6. 公开网站 SSR、API、直接访问不存在的路由及 Cloudflare Worker 生产构建。
7. 使用管理员和编辑者分别验证草稿、多语言和跨集合 ID 的访问隔离。

新增路由匹配单元测试；尚未执行全量构建、浏览器测试、真实 D1 或 Cloudflare 部署。保留原始 Astro 页面文件以便回滚和比对。
