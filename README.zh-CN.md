# Vulseastro

[English](README.md) | 简体中文

**Vulse** 是原生集成 Astro、运行于 Cloudflare 的无头内容管理系统（Headless CMS）。一次部署即可提供公开网站、位于 `/admin` 的管理界面，以及位于 `/api/vulse/*` 的 REST API。

内容存储于 D1，媒体资源存储于 R2，搜索使用 SQLite FTS5。内容交付使用 Astro Content Layer（构建及同步）以及运行时 SDK（SSR 和会员专属内容）。

Vulse 仍处于密集开发阶段，可能存在缺陷及尚未达到预期的功能。

## 仓库组成

| 路径 | 用途 |
|---|---|
| `packages/vulse/` | `@vulsecms/core` npm 软件包 |
| `playground/vulse-play/` | 接入 Vulse 的可运行 Astro 参考项目 |
| `docs/` | 英文用户文档 |
| `docs/zh-CN/` | 简体中文用户文档 |
| `docs/superpowers/` | 内部设计规范及实施计划 |

## 快速启动

```bash
pnpm install
pnpm --filter @vulsecms/core build
cd playground/vulse-play
npx vulse migrate
pnpm dev
```

打开终端输出的 URL（通常是 `http://localhost:4321`）。管理后台登录地址：`/admin/login`。

完整设置及创建首个管理员的方法见[安装指南](docs/zh-CN/installation.md)。

## 文档

[简体中文文档总目录](docs/zh-CN/README.md) | [英文文档总目录](docs/README.md)

| 文档 | 用途 |
|---|---|
| [安装](docs/zh-CN/installation.md) | 环境要求、安装、Cloudflare 资源及首个管理员 |
| [升级](docs/zh-CN/upgrading.md) | 更新 Vulse、运行迁移 |
| [配置（英文）](docs/configuration.md) | Wrangler 绑定、环境变量及运行时设置 |
| [管理后台](docs/zh-CN/control-panel.md) | 管理界面操作指南 |
| [内容建模（英文）](docs/content-modeling.md) | Blueprint、Sets、Replicators、Globals、Locales |
| [前台开发（英文）](docs/frontend.md) | Astro Loader、SSR SDK、区块渲染、认证 |
| [实时预览](docs/zh-CN/live-preview.md) | 实时预览与已保存草稿预览 |
| [表单（英文）](docs/forms.md) | 表单构建、防垃圾、队列及钩子 |
| [插件（英文）](docs/plugins.md) | 表单、认证、CRM、邮件工作流 |
| [API 参考（英文）](docs/api-reference.md) | REST 接口 |
| [CLI 参考（英文）](docs/cli.md) | 迁移、管理员初始化及脚手架命令 |
| [部署（英文）](docs/deployment.md) | Cloudflare Workers / Pages、密钥、Cron |
| [目录结构（英文）](docs/directory-structure.md) | 文件及文件夹职责 |
| [故障排查（英文）](docs/troubleshooting.md) | 常见问题 |
| [AI 模型导出](docs/zh-CN/ai-schema.md) | AI 辅助开发的模型文档 |
| [CSS 与 Tailwind](docs/zh-CN/css.md) | 公开网站样式配置 |

## 参与开发

```bash
pnpm install
pnpm --filter @vulsecms/core test              # 单元测试
pnpm --filter @vulsecms/core test:integration  # D1 / Miniflare 集成测试
pnpm --filter @vulsecms/core typecheck
pnpm --filter @vulsecms/core build
```

Playground（`playground/vulse-play`）是端到端验证修改最方便的方式。

## 许可证

参见 [LICENSE](LICENSE)（MIT）。保留原项目版权及许可声明。

## 中文文档说明

本文件及 `docs/zh-CN/` 为原仓库文档的简体中文翻译。未完成翻译的文档明确标记为英文。翻译不改变应用代码、运行时配置或管理后台语言。
