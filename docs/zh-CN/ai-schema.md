# AI 内容模型文档

[英文原文](../ai-schema.md)

Vulse 可以将内容模型导出为 AI 编程工具可直接读取的静态文件，无须 MCP 服务器。

## 何时导出

在以下情况下运行模型导出：

- 在 `src/vulse/collections/` 中新增或修改内容集合。
- 在管理后台编辑 Sets（可复用字段组）或 Globals（全局内容）。
- 希望 AI 根据当前内容模型生成 Astro 页面与组件。

## 命令

在 Astro 项目根目录运行：

```bash
npx vulse schema:export              # 本地 D1（包括 sets/globals）
npx vulse schema:export --remote     # 生产 D1
```

生成的文件：

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | AI 工具快速入门：集合摘要、前台开发规则 |
| `docs/vulse-schema.md` | 完整的可读模型参考 |
| `docs/vulse-schema.json` | 机器可读的模型快照（`version: 1`） |

将这些文件提交到版本控制，让团队和 AI 共享相同的模型上下文。

如果 D1 不可用（没有 `wrangler.toml` 或本地数据库），命令仍会仅使用**代码中定义的 Blueprint**运行。此时不包含 Sets 和 Globals，并在输出中给出警告。

## 与 AI 工具配合使用

在 Cursor、Claude Code 等工具中：

1. 使用 `@` 引用 `AGENTS.md`，快速提供项目上下文。
2. 生成必须符合字段名称、类型和关联关系的页面时，引用 `docs/vulse-schema.md`（或对应的 JSON 文件）。

提示词示例：

> 阅读 `AGENTS.md` 和 `docs/vulse-schema.md`，然后根据每个集合的预览路径，为所有集合生成列表页及详情页。

## 自动重新生成（可选）

在每次 `astro dev` 或 `astro build` 时启用导出：

```js
// astro.config.mjs
import vulse from '@vulsecms/core/integration'

export default defineConfig({
  integrations: [vulse({ schemaDocs: true })],
})
```

默认**关闭**。已提交的文档应在主动执行 `vulse schema:export` 或启用此选项后更新。

## 导出内容

- **Collections（集合）**：字段、控件、验证规则、后台配置及预览路径。
- **Sets（字段组）**：区块类型的字段结构，供 `BlockRenderer` 使用。
- **Globals（全局内容）**：站点全局数据的结构。
- **Relationships（关联关系）**：集合之间的条目、引用及链接关系。
- **前台开发示例**：Content Layer loader 与运行时 SDK 的使用模式。

v1 不包含表单（表单属于独立业务领域，与页面代码生成关系较小）。

命令参数参见[CLI 参考（英文）](../cli.md)。
