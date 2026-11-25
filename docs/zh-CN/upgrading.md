# 版本升级

[英文原文](../upgrading.md)

本指南说明如何在 Astro 项目中升级 Vulse 并执行新增迁移。

## 常规升级

```bash
pnpm update vulse
npx vulse migrate                                        # 本地 D1
npx vulse migrate --remote -c wrangler.production.toml   # 生产 D1
```

安装后：

1. 重启开发服务器（Astro 仅在启动时加载集成的变更）。
2. 查看[发布说明](https://github.com/vulsecms/vulse/releases)，确认是否存在破坏性变更。
3. 部署前重新构建：`pnpm build`。

> 译注：上述包名和发布链接沿用英文原文。实际核心包名称为 `@vulsecms/core`，应核对项目依赖名称以及发布仓库是否可访问，再执行升级。

## 数据库迁移

每个版本均随 Vulse 包提供迁移文件。迁移只支持向前执行。

按原文说明，部署后 Worker 首次启动时，运行时会自动读取 `node_modules/@vulsecms/core/migrations/` 中的 SQL 文件并执行迁移。通常无须在生产环境手动执行 `vulse migrate`；但希望在首个请求到达新 Worker 前应用迁移，或需要使多环境迁移记录保持一致时，手动执行非常有用。

### `vulse migrate` 的工作过程

1. 通过 Wrangler 连接 D1 绑定（`DB`）。
2. 确认迁移记录表 `_vulse_migrations` 存在。
3. 对每个尚未记录的迁移执行 SQL，并插入迁移记录。

### 指定目标环境

```bash
npx vulse migrate                                        # 本地 Miniflare D1
npx vulse migrate --remote                               # 默认配置中的远程 D1
npx vulse migrate --remote -c wrangler.production.toml   # 生产 D1
```

未指定 `-c` 或 `WRANGLER_CONFIG` 时，命令读取自动检测到的 `wrangler.toml`，因此 `--remote` 指向该配置中的 `database_id`。若使用独立的生产配置，应传入 `-c wrangler.production.toml`，确保迁移应用于生产库。参见[部署（英文）](../deployment.md)。

### 查询迁移清单

当前内置迁移参见[目录结构（英文）](../directory-structure.md#migrations)。数据库中的记录表可以查询已执行的迁移：

```bash
wrangler d1 execute DB --local --command "SELECT id, applied_at FROM _vulse_migrations ORDER BY id;"
```

## 向后兼容升级

多数版本仅添加新表、添加具有安全默认值的字段或重构应用代码，不要求额外的数据迁移。

少数版本可能重构现有表，此时：

- 发布说明会明确标注。
- 随包提供的 SQL 迁移会处理结构变更。
- 软件包版本会反映破坏性变更。

## 安装钩子遗漏配置时

如果手动安装 Vulse，或升级到引入新脚手架文件（如 `src/content.config.ts`）的版本，可能需要重新执行部分安装步骤：

```bash
# 如果缺少 Cloudflare Adapter，则重新添加
pnpm astro add cloudflare

# 重新添加 Vulse（已安装的软件包不会重复安装，但会重新运行集成安装钩子，
# 更新 wrangler.toml 和 tsconfig.json）。
pnpm astro add @vulsecms/core
```

## 升级后是否重新生成集合页面？

如果此前使用过 `vulse collection:scaffold`，升级后不需要重新执行。生成的 Astro 页面与 `content.config.ts` 由你自行维护。如果希望使用新的模板，可以用 `--force` 覆盖：

```bash
npx vulse collection:scaffold blog --force
```

注意：覆盖会影响已有页面定制，执行前应确认已备份或提交变更。参见[CLI 参考（英文）](../cli.md)。

## 回滚

D1 没有内置的反向迁移。需要回滚时：

1. 从 Cloudflare 备份恢复生产 D1 数据库，或者删除本地 D1 文件后使用较早版本重新迁移（开发环境）。
2. 重新安装此前版本的 Vulse：

```bash
pnpm install vulse@<previous-version>
```

3. 执行旧版本的迁移（`npx vulse migrate`）；已应用的迁移 ID 会被跳过。

如果仅回滚代码、不涉及数据库结构变更，原文说明重新安装此前版本即可。

> 生产回滚前应先确认备份、数据库兼容性及实际包名；以上为原文翻译，不代表已验证回滚流程。
