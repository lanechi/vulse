# Astro 前台 CSS 与 Tailwind

[英文原文](../css.md)

## 在 Astro 网站中使用 Tailwind

创建自己的样式表，并在布局中导入：

```css
/* src/styles/site.css */
@import "tailwindcss";
@source "../**/*.{astro,vue,js,ts}";
```

```astro
---
/* src/layouts/BaseLayout.astro */
import '../styles/site.css'
---
```

不需要再次安装 Tailwind，也不需要安装 `@astrojs/tailwind` 集成，因为 Vulse 已经添加 Tailwind v4 的 Vite 插件。

## 另一种方式：前台不使用 Tailwind

Playground 示例在 `src/styles/site.css` 中使用普通 CSS 和自定义属性，公开网站完全没有使用 Tailwind 工具类。如果只希望在 `/admin` 内使用 Tailwind，这也是有效的选择。

| 目标 | 操作 |
|---|---|
| 在公开网站中使用 Tailwind | 自行添加 `site.css`，包含 `@import "tailwindcss"` 与 `@source` |
| 仅后台使用 Tailwind | 无须额外操作，Vulse 已处理 |
| 前台不使用 Tailwind | 像 Playground 一样使用普通 CSS |

避免在后台路由之外导入 `@vulsecms/core/admin.css`，因为该样式表针对管理后台，并使用后台专用的设计令牌。
