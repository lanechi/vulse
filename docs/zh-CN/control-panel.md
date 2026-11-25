# 管理后台

[英文原文](../control-panel.md)

Vulse 的管理界面由你自己的 Astro 应用通过 `/admin` 提供（可使用集成选项 `adminPath` 配置）。它与网站终端用户登录流程使用相同的会话存储，但要求用户角色为 `admin` 或 `editor`。

## 路由表

| 路由 | 用途 |
|---|---|
| `/admin` | 仪表盘，提供内容集合的快捷入口 |
| `/admin/login` | 工作人员登录 |
| `/admin/collections/:name` | 集合条目列表或树形视图 |
| `/admin/collections/:name/new` | 新建条目 |
| `/admin/collections/:name/:id` | 编辑条目（启用时提供实时预览） |
| `/admin/collections/:name/:id/revisions` | 条目版本历史 |
| `/admin/schema/:handle` | Blueprint 内容模型编辑器（包含前台脚手架面板） |
| `/admin/schema/new` | 新建集合模型 |
| `/admin/media` | 媒体资源库 |
| `/admin/forms` | 表单构建器 |
| `/admin/forms/:handle` | 编辑表单 |
| `/admin/forms/:handle/submissions` | 表单提交记录列表 |
| `/admin/forms/:handle/submissions/:id` | 提交记录详情 |
| `/admin/users` | 用户管理（仅管理员） |
| `/admin/account` | 个人资料及安全设置（含双因素认证） |
| `/admin/settings` | 站点设置（站点名称、部署钩子、语言） |
| `/admin/settings/auth` | 认证设置（注册开关、邮箱域名白名单） |
| `/admin/settings/redirects` | URL 重定向（仅管理员） |
| `/admin/settings/sets` | 可复用区块字段组 |
| `/admin/settings/globals` | 全站内容集合（页脚、联系信息等） |

## 侧边栏结构

- **Collections（内容集合）**：每个集合模型对应一个链接。
- **Forms（表单）**：表单构建器。
- **Media（媒体）**：媒体资源库。
- **Schema（模型）**：可折叠的集合模型列表，以及 Sets 和 Globals（仅管理员）。
- **Users（用户）**：用户管理（仅管理员）。
- **Settings（设置）**：站点与认证设置（仅管理员）。

## 角色及权限

| 能力 | `admin` | `editor` | `member` |
|---|:---:|:---:|:---:|
| 登录 `/admin` | 是 | 是 | 否 |
| 列出和读取条目 | 是 | 是 | 依访问规则 |
| 创建、编辑、发布条目 | 是 | 是 | 否 |
| 删除条目 | 是 | 依访问规则 | 否 |
| 管理媒体 | 是 | 是 | 否 |
| 查看表单提交 | 是 | 是 | 否 |
| 编辑模型、字段组、全局内容 | 是 | 否 | 否 |
| 管理用户 | 是 | 否 | 否 |
| 编辑设置 | 是 | 否 | 否 |

Blueprint 中每个集合的访问规则可以覆盖默认权限，详见[内容建模：访问规则（英文）](../content-modeling.md#access-rules)。

## 编辑条目

条目编辑器根据 Blueprint 模型生成字段。主要界面行为：

- **URL Slug** 默认折叠。在手动输入之前，根据 `titleField` 自动生成。保存时若 Slug 重复，系统会追加 `-2`、`-3` 等后缀，以保证在同一集合（及语言）内唯一。
- **状态标识**：启用草稿时显示 `draft`（草稿）、`published`（已发布）或 `published · changes`（已发布、有变更）。
- **保存按钮**：启用草稿时，显示 Save draft（保存草稿）及 Save & publish（保存并发布）；已发布条目另有草稿时还会显示 Publish（发布）。未启用草稿时，只有 Save（保存）按钮及状态选择（`draft` / `published`）。
- **验证错误**：显示在对应字段下方。必填项未填写时提示「此字段为必填项」；Slug 无效时提示「仅使用小写字母、数字及连字符」。这里是提示语的中文释义，原界面仍为英文。
- **语言切换器**：配置多个语言时出现在顶部。切换时访问 `?locale=xx`，加载该语言的内容；不存在时显示空表单以便录入翻译。参见[多语言内容（英文）](../content-modeling.md#locales-i18n)。

## 编辑 Blueprint（内容模型）

`/admin/schema/:handle` 允许在运行时编辑集合模型：

- 修改显示名称（label）。
- 添加、删除和重命名字段。保存时，重命名操作会迁移现有条目 JSON（`content` 和 `draft_content`）。
- 设置 `singleton`（单实例）、`tree`（树形结构）、`drafts`（草稿）及 `maxDepth`（最大深度）。
- 点击 **Scaffold frontend** 生成 Astro 页面模板，参见[CLI 参考（英文）](../cli.md#vulse-collectionscaffold)。

创建后 **Handle** 字段锁定。修改它会破坏后台 URL、公开 API 路径及按名称引用该集合的前台代码。如需重命名，请创建新集合并迁移条目。

## 媒体库

`/admin/media` 列出所有已上传资源。条目编辑器的媒体字段和区块编辑器复用同一个媒体选择器。

- 上传文件存放在 R2 的 `media/<id>` 路径。
- 上传时提取图片尺寸，用于 `<img>` 的宽高提示。
- 软删除的资源保留 7 天，之后由 Cron 定时处理器彻底清除。参见[部署：Cron（英文）](../deployment.md#cron)。

## 表单

`/admin/forms` 提供表单构建器。每个表单包含：

- Handle（用于 `<FormRenderer form="…">`）。
- 字段定义（类型、标签、必填及验证）。
- 成功提示或重定向地址。
- 通知邮件收件人（由队列消费者发送）。

提交记录位于 `/admin/forms/:handle/submissions`，支持详情、批量删除及 CSV 导出。完整功能参见[表单文档（英文）](../forms.md)。

## 设置

- **Site（站点）**：站点名称、部署钩子 URL、支持的语言及默认语言。
- **Auth（认证）**：公开注册开关、允许的邮箱域名。
- **Account（账户，`/admin/account`）**：个人资料及双因素认证（2FA）。2FA 可选，已登录用户可以随时启用或关闭。注册使用标准 TOTP 流程：确认密码、用认证应用（Google Authenticator、1Password、Authy 等）扫描二维码并输入验证码。启用后，每次登录需要验证码或设置时仅显示一次的 10 个备用验证码之一。可在同一页面重新生成备用验证码。
- **Redirects（重定向）**：Vulse 中间件在渲染页面之前处理 URL 重定向。每条规则包含来源路径（不区分大小写，兼容末尾斜杠）、目标 URL（站内相对路径 `/foo` 或绝对地址 `https://…`）及 HTTP 状态码（`301`、`302`、`307` 或 `308`）。若目标未包含查询字符串，则保留原查询字符串。禁用规则会被跳过。每条规则记录命中次数和最后命中时间。仅管理员可管理。
- **Sets（字段组）**：富文本编辑器中可使用的复用区块（例如引用、提示框）。
- **Globals（全局内容）**：通过 `/api/vulse/public/globals` 提供全站数据，供布局调用。

## 实时预览

当集合模型启用预览（`preview.live !== false`）时，条目编辑器包含分栏实时预览。输入内容时，iframe 根据未保存的预览会话重新渲染。工具栏的 Preview（预览）按钮还可在新标签页打开已保存的草稿。

参见[实时预览](live-preview.md)，了解具体机制及 Astro 页面接入方式。
