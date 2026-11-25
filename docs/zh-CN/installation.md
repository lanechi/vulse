# 安装指南

[英文原文](../installation.md)

本指南介绍如何在新建或现有 Astro 项目中安装 Vulse、配置 Cloudflare 资源并创建第一个管理员。

## 环境要求

- **Node.js 22+**：Vulse 和 Astro 6 均要求此版本。
- **pnpm 9+**：Monorepo 和集成的安装钩子均使用 pnpm。
- **Cloudflare 账户**：免费套餐足以开始使用。
- **Wrangler CLI**，并已登录：

```bash
npm i -g wrangler
wrangler login
```

- 使用 Cloudflare Adapter 且采用服务端输出模式（`output: 'server'`）的 Astro 6 项目。如果尚未创建：

```bash
pnpm create astro@latest -- --template minimal my-site
cd my-site
pnpm astro add cloudflare
```

也可以参考可运行的示例项目 [playground/vulse-play](../../playground/vulse-play)。

## 1. 在 Astro 项目中添加 Vulse

```bash
pnpm astro add @vulsecms/core
pnpm add @astrojs/vue vue
```

Vulse 在内部为管理后台配置了 `@astrojs/vue`，但项目自身也必须直接依赖 `@astrojs/vue` 和 `vue`，以便 Cloudflare 开发运行器解析 `@astrojs/vue/server.js`。

安装钩子会：

- 修改 `wrangler.toml`，加入 D1（`DB`）和 R2（`BUCKET`）绑定。
- 生成初始内容模型 `src/vulse/collections/page.ts`。
- 创建接入 `vulseLoader()` 的 `src/content.config.ts`。
- 将 `.vulse/types.d.ts` 添加至 `tsconfig.json` 的 `include` 列表。

`astro.config.mjs` 应类似以下配置：

```js
import { defineConfig } from 'astro/config'
import cloudflare from '@astrojs/cloudflare'
import vulse from '@vulsecms/core/integration'

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    // 生产或 CI 构建时选择配置，无须覆盖 wrangler.toml。
    // 开发时不设置：Adapter 自动检测 wrangler.toml。
    ...(process.env.WRANGLER_CONFIG ? { configPath: process.env.WRANGLER_CONFIG } : {}),
  }),
  integrations: [vulse()],
})
```

`platformProxy: { enabled: true }` 用于让开发服务器根据本地 Wrangler 状态解析 D1 和 R2 绑定。通过 `configPath`，生产构建可以使用 `WRANGLER_CONFIG=… pnpm build` 选择 `wrangler.production.toml`，无需覆盖开发配置。参见[部署（英文）](../deployment.md)。

## 2. 运行安装向导（推荐）

如果不希望手动编辑 `wrangler.toml` 和 `.dev.vars`，可以让安装向导完成本指南第 2 至 4 节的操作：

```bash
npx vulse setup
```

向导会创建 D1 数据库，将 `database_id` 写入 `wrangler.toml`，创建 R2 Bucket，在 `.dev.vars` 生成 `BETTER_AUTH_SECRET` 和 `VULSE_PREVIEW_SECRET`（并加入 `.gitignore`），执行迁移并创建初始管理员。

完成后跳至第 5 节验证安装。非交互模式（`--yes`、`--email`、`--password`）参见[CLI 参考（英文）](../cli.md#vulse-setup)。

> **仅供开发环境使用**：`npx vulse setup` 创建本地开发数据库，并将 `wrangler.toml` 作为开发配置。生产站点使用单独的 D1 数据库。同一套迁移适用于两者；对生产库执行 `npx vulse migrate --remote -c wrangler.production.toml` 即可更新 Schema，而无需重新创建资源。不要覆盖 `wrangler.toml`，保留独立的 `wrangler.production.toml`，并在每个命令中通过 `-c` 或 `WRANGLER_CONFIG` 选择配置。

以下各节介绍相同操作的手动执行方式，适合需要完整控制或恢复部分安装的场景。

## 2b. 手动创建 Cloudflare 资源

```bash
wrangler d1 create vulse-db
wrangler r2 bucket create vulse-media
```

将 D1 命令输出的 `database_id` 复制到 `wrangler.toml`。最小配置示例：

```toml
[[d1_databases]]
binding = "DB"
database_name = "vulse-db"
database_id = "<your-database-id>"
migrations_dir = "node_modules/@vulsecms/core/migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "vulse-media"

[vars]
BETTER_AUTH_SECRET = "dev-secret-change-me-in-production-32chars"
```

生产环境应使用 Wrangler Secret 管理 `BETTER_AUTH_SECRET`，参见[部署（英文）](../deployment.md)。不要将示例密钥用于生产。

## 3. 手动执行迁移

将随包提供的 SQL 迁移应用到本地 D1（Miniflare）：

```bash
npx vulse migrate
```

迁移的完整列表及用途参见[目录结构（英文）](../directory-structure.md#migrations)。

## 4. 手动创建第一个管理员

Vulse 默认禁用公开注册。任选以下三种方式创建第一个管理员。

### 方案 A：先注册，再提升权限（推荐用于本地开发）

1. 在启动开发服务器之前，在数据库中启用注册：

```bash
wrangler d1 execute DB --local --command \
  "INSERT INTO vulse_settings (key, value, updated_at) VALUES ('allowMemberSignUp', true, $(date +%s)000) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;"
```

2. 运行 `pnpm dev`，在 `/sign-in` 创建账户（或者使用 `SignUpForm.astro` 构建自己的注册页面，参见[前台开发（英文）](../frontend.md#end-user-auth)）。
3. 将新用户提升为管理员：

```bash
wrangler d1 execute DB --local --command \
  "UPDATE user SET role = 'admin' WHERE email = 'you@example.com';"
```

4. 在 `/admin/login` 登录。完成后在 Settings → Auth 中关闭公开注册。

### 方案 B：使用 CLI 的 `vulse seed:admin`

在 Astro 项目根目录（`wrangler.toml` 所在目录）执行：

```bash
npx vulse migrate
npx vulse seed:admin --email you@example.com
# 或在生产环境：
npx vulse seed:admin --email you@example.com --remote
# 指定密码（否则会生成并输出随机密码）：
npx vulse seed:admin --email you@example.com --password 'your-secure-password'
```

命令通过 Better Auth 创建用户（使用正确的密码哈希），将其提升为 `admin`，并在生成临时密码时输出密码。

### 方案 C：使用 API 初始化（可脚本化）

启用注册（方案 A 的第 1 步）并运行开发服务器：

```bash
curl -X POST http://localhost:4321/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"your-secure-password","name":"Admin"}'

wrangler d1 execute DB --local --command \
  "UPDATE user SET role = 'admin' WHERE email = 'admin@example.com';"
```

### 角色

| 角色 | 权限 |
|---|---|
| `admin` | 完整访问权限：管理模型、用户及设置 |
| `editor` | 内容管理：创建、编辑、发布条目，管理媒体，查看表单提交 |
| `member` | 网站终端用户账户：登录公开网站 |

可随时在 Admin → Users 修改用户角色。

## 5. 验证安装

```bash
pnpm dev
```

访问以下地址：

- `/`：网站首页（没有现有内容时，安装钩子会留下占位页面）。
- `/admin`：后台界面；未登录时跳转至 `/admin/login`。
- `/api/vulse/public/globals`：尚未定义全局内容时应返回 `{"ok":true,"data":{}}`。

若访问失败，参见[故障排查（英文）](../troubleshooting.md)。

## 6. 清空本地数据

**警告：以下命令删除本地 D1 内容和账户，仅保留数据库结构。先确认目标是本地开发库并备份必要数据。**

```bash
wrangler d1 execute DB --local --command "
  DELETE FROM vulse_entry_locales;
  DELETE FROM vulse_entries;
  DELETE FROM vulse_entry_revisions;
  DELETE FROM vulse_media;
  DELETE FROM vulse_settings;
  DELETE FROM vulse_collections;
  DELETE FROM vulse_sets;
  DELETE FROM vulse_forms;
  DELETE FROM vulse_form_submissions;
  DELETE FROM vulse_global_sets;
  DELETE FROM vulse_global_values;
  DELETE FROM session;
  DELETE FROM account;
  DELETE FROM user;
"
```

如果要彻底删除本地 D1 文件并重新迁移，删除项目中的 `.wrangler/state/v3/d1/`，再执行 `npx vulse migrate`。

## 下一步

- 定义第一个集合：[内容建模（英文）](../content-modeling.md)。
- 在 Astro 页面接入条目：[前台开发（英文）](../frontend.md)。
- 熟悉后台：[管理后台](control-panel.md)。

> 以上命令和配置依据当前仓库英文文档翻译，未在此仓库的实际运行环境中重新测试；请以当前依赖和配置为准。
