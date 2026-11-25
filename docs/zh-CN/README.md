# Vulse 简体中文文档

[项目中文介绍](../../README.zh-CN.md) · [英文文档索引](../README.md)

Vulse 是原生集成 Astro、运行于 Cloudflare 的无头内容管理系统（Headless CMS）。

本目录保留独立的中文译文；英文原文仍位于 `docs/`。尚未翻译的条目直接链接到英文资料。

## 快速入门

1. [安装指南](installation.md)：环境要求、安装 Vulse、Cloudflare 资源、创建首个管理员。
2. [配置（英文）](../configuration.md)：`wrangler.toml` 绑定、环境变量及运行时设置。
3. [管理后台](control-panel.md)：后台界面、路由、权限及操作方式。

## 内容建设

- [内容建模（英文）](../content-modeling.md)：Blueprint、Sets、Replicators、Globals 和多语言。
- [前台开发（英文）](../frontend.md)：Astro Content Layer loader、运行时 SDK、区块渲染、认证组件。
- [实时预览](live-preview.md)：编辑器实时预览及已保存草稿预览。
- [表单（英文）](../forms.md)：表单构建、提交记录、防垃圾、文件上传与异步处理。
- [插件（英文）](../plugins.md)：表单、认证、CRM、邮件及注册流程的原生插件。
- [CSS 与 Tailwind](css.md)：前台样式配置。

## 开发参考

- [API 参考（英文）](../api-reference.md)：`/api/vulse/*` 接口。
- [CLI 参考（英文）](../cli.md)：迁移、管理员初始化、集合脚手架等命令。
- [目录结构（英文）](../directory-structure.md)：项目文件及目录职责。
- [Schema 定义（英文）](../schema-definitions.md)：内容模型定义资料。
- [AI 内容模型文档](ai-schema.md)：为 AI 编程工具导出模型。

## 后台 SPA 与演示

- [管理后台 SPA 改造](admin-spa.md)：Vue Router、客户端路由及验证清单。
- [演示网站部署](demo-deployment.md)：GitHub Pages 静态演示及完整 Cloudflare Worker 部署说明。

## 运维

- [版本升级](upgrading.md)：更新 Vulse 与数据库迁移。
- [部署（英文）](../deployment.md)：Cloudflare Workers / Pages、密钥、Cron 及队列。
- [故障排查（英文）](../troubleshooting.md)：常见错误及解决方法。

## 仓库结构

```text
packages/vulse/          Vulse npm 软件包
playground/vulse-play/   接入 Vulse 的可运行 Astro 示例
docs/                    英文用户文档
docs/zh-CN/              简体中文用户文档
docs/superpowers/        内部设计规范及实施计划
```

中文文档基于本仓库对应英文文件整理，保留代码标识符、API 路径、配置键及命令。译文不是对后台 UI 的语言修改，也不代表对安装、部署或安全性的实际测试。
