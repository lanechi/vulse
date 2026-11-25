# 实时预览

[英文原文](../live-preview.md)

Vulse 提供两种相互配合的预览机制：

| 机制 | 触发方式 | 内容来源 | 是否写入数据库 |
|---|---|---|---|
| 实时预览面板 | 在条目编辑器输入 | 短期预览会话（令牌 `vulse_live_preview`） | 不写入正式内容 |
| Preview 按钮 | 点击编辑器工具栏的 Preview | 已保存草稿（令牌 `vulse_preview`） | 仅在保存后 |

两种机制可同时启用。运行时辅助函数 `resolvePreviewContent()` 按以下优先级选择内容：**实时会话 → 已保存草稿 → 已发布内容**。

## 实时面板工作机制

1. 条目编辑器挂载时向 `/api/vulse/preview/sessions` 发送 POST，获得会话 ID 和预览 URL，例如 `/blog/my-post?vulse_live_preview=<token>`。
2. 编辑字段时，编辑器将新内容通过 PUT 发送至 `/api/vulse/preview/sessions/:id`（防抖处理）。会话有效期为 1 小时，每次更新时续期。
3. iframe 加载预览 URL，即普通 Astro 页面附带预览令牌的查询参数。
4. 页面中的 `resolvePreviewContent()` 读取令牌、获取会话内容，并返回该内容而不是已保存条目。
5. 每次 PUT 后，编辑器通过 `postMessage` 向 iframe 发送 `vulse.preview.updated`，页面的预览桥接机制对 DOM 进行平滑更新，避免 iframe 闪烁。

会话内容仅对编辑者可见，不参与搜索、不触发发布任务，也不修改已发布记录。

## Preview 按钮工作机制

工具栏的 Preview 按钮打开 `/api/vulse/preview/start?to=<page>`，设置签名 Cookie（`vulse_preview`）后跳转至目标页面。Cookie 存在时，`resolvePreviewContent()` 优先返回已保存草稿而不是已发布内容。Cookie 有效期较短，通过 `/api/vulse/preview/stop` 清除。

## 接入 Astro 页面

```astro
---
import {
  getRuntimeEnv,
  getRuntime,
  createDb,
  registryForRequest,
  resolvePreviewContent,
} from '@vulsecms/core/server'

const env = getRuntimeEnv()
const db = createDb(env.DB)
const rt = await getRuntime(env, await registryForRequest(db), Astro.url.origin)
const session = await rt.auth.api.getSession({ headers: Astro.request.headers })

const entry = await rt.sdk.collections.findBySlug('post', Astro.params.slug!, {
  audience: session?.user ?? null,
})
if (!entry) return new Response(null, { status: 404 })

const content = resolvePreviewContent(entry, Astro.locals)
---
<h1>{content.title}</h1>
```

`resolvePreviewContent` 从 Vulse 中间件填充的 `Astro.locals` 读取令牌，并返回本次请求对应的内容对象。不存在预览令牌时，返回已发布的 `entry.content`。

## Blueprint 选项

```ts
preview: {
  path: '/blog/{slug}',
  rootSelector: 'article',   // DOM 更新目标，默认 'main'
  live: false,               // 隐藏内嵌预览面板，Preview 按钮仍可使用
}
```

`{slug}` 将被替换为条目当前的 Slug。如果布局不使用 `<main>` 包裹正文，可设置 `rootSelector`。对于仅需要已保存草稿预览的集合，设置 `live: false` 禁用内嵌面板。

## 内嵌面板要求 SSR

实时预览面板只能用于服务端渲染页面（在 `astro.config.mjs` 设置 `output: 'server'`）。仅依赖 Loader 的 SSG 页面不会在每次请求执行，因此无法反映尚未保存的会话状态。

如果提供 SSR 回退页面，Preview 按钮流程（签名 Cookie + 已保存草稿）仍有可能用于 SSG 网站，因为 Cookie 跳转时草稿已写入数据库。

## 常见问题

- **预览面板显示 Failed to start live preview**：创建会话要求登录 `admin` 或 `editor` 账户。先访问 `/admin/login`。
- **输入时 iframe 不更新**：确认 `rootSelector` 与布局元素匹配，DOM 更新要求渲染后的 HTML 中存在相应元素。
- **显示已发布内容而不是草稿**：必须使用包含预览 Cookie 或实时预览查询令牌的请求所提供的 `Astro.locals` 调用 `resolvePreviewContent`。SSR 页面自动得到这些信息，SSG 页面则不会。
- **希望关闭集合预览**：在 Blueprint 设置 `preview.live: false` 关闭实时面板；或移除整个 `preview` 配置，隐藏面板及 Preview 按钮。仅设置 `live: false` 时仍保留已保存草稿的预览按钮（见上文）。

## 生命周期及清理

预览会话位于 `vulse_preview_sessions` 表中，有效期 1 小时。Cron 定时处理器运行时清理过期会话，参见[部署（英文）](../deployment.md#cron)。

正常关闭编辑器时，表单的 `beforeUnload` 发送 DELETE，显式删除会话。

其他用户尝试读取会话时，`findById` 检查 `userId`，若会话不属于该用户则返回 null。

> 翻译说明：英文原文最后一项将其他用户读取会话也列在显式删除的情形中，但同时仅描述了返回 null 的行为。这里保留已描述的访问限制，不将其解读为已验证的删除行为。
