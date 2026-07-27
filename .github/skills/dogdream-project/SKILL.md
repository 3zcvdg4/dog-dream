---
name: dogdream-project
description: '管理 dogdream 项目内容：添加新项目、编辑三级详情页、更新项目元信息。Use when: 添加项目、编辑项目内容、三级页、project-XX、projects.js、projectContents、海报封面、content schema。'
---

# Dogdream 项目内容管理

## 内容架构

12 个项目共用一套内容协议：

| 层级 | 文件 | 内容 |
|------|------|------|
| 元信息 | `src/data/projects.js` | 走廊画框基础信息 |
| 详情内容 | `src/data/projectContents/project-XX.js` | 三级页结构化长内容 |
| 内容索引 | `src/data/projectContents/index.js` | 聚合导出与查询 |
| Schema | `src/data/projectContents/schema.js` | 类型定义 |
| 封面海报 | `poster/` | 走廊画框封面图 |
| 三级页配图 | `public/projects/project-XX/` | 详情页运行时图片 |
| 源稿 | `content/projects/project-XX/` | Markdown 策划文档 |

## 元信息字段（projects.js）

每个项目至少包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID，如 `project-01` |
| `slug` | string | URL 路径，如 `dogdream` |
| `title` | string | 项目标题 |
| `published` | boolean | 是否发布 |
| `year` | string | 年份 |
| `role` | string | 角色 |
| `services` | string | 服务内容 |
| `color` | string | 主题色 HEX |
| `imageUrl` | string | 走廊画框封面，用 `posterUrl(fileName)` |
| `summary` | string | 聚焦页右侧摘要 |
| `detail` | string | 简短描述 |

封面图用辅助函数：
```js
const posterUrl = (fileName) => `${import.meta.env.DEV ? '/__poster' : '/poster'}/${fileName}`;
```

## 详情内容结构（project-XX.js）

```js
export default {
  id: 'project-01',        // 与 projects.js 一致
  layout: 'editorial-dream', // 页面编排风格
  sections: [ ... ],       // 有序模块列表
  theme: { ... },          // 可选主题配置
};
```

### layout 可选值

| layout | 风格 | 适用场景 |
|--------|------|----------|
| `editorial-dream` | 长文叙事 | 过程型项目 (project-01) |
| `project-02-ortur` | ORTUR 品牌风格 | 品牌案例 |
| `project-03-parallax` | 视差滚动 | 视觉项目 |
| `project-04-seer` | Seer 风格 | 科技产品 |
| `gallery-first` | 大图优先 | 视觉作品集 |
| `split-story` | 左右分栏 | 对比叙事 |
| `timeline-heavy` | 时间线为主 | 过程记录 |
| `minimal-case` | 极简展示 | 轻量案例 |
| `stage-dual` | 双栏切换 | 多维度展示 |

### section 模块类型（15 种）

| type | 用途 | 关键字段 |
|------|------|----------|
| `intro` | 开篇段落 | `paragraphs[]` |
| `heading` | 章节标题 | `text`, `level` (2/3) |
| `paragraph` | 单段正文 | `text` |
| `paragraphs` | 多段正文 | `items[]` |
| `steps` | 编号步骤 | `items[{title?, text}]` |
| `quote` | 引用/强调 | `text`, `cite?` |
| `divider` | 分隔线 | — |
| `subheading` | 小标题 | `text` |
| `bulletList` | 无序列表 | `items[]` |
| `table` | 表格 | `headers[]`, `rows[][]` |
| `timeline` | 时间线 | `items[{date, phase, event, tool?}]` |
| `gallery` | 图片组 | `columns`, `images[{src, alt, caption?}]` |
| `progress` | 进度概览 | `label`, `value`, `items[{label, value}]` |
| `callout` | 提示框 | `text`, `variant?` ('note'/'warn') |
| `stageToggle` | 多标签切换 | `title`, `subtitle`, `tabs[]` |

## 添加新项目的完整流程

1. 在 `content/projects/project-XX/` 整理 Markdown 源稿
2. 将结构化内容写入 `src/data/projectContents/project-XX.js`
3. 在 `src/data/projectContents/index.js` 中 import 并加入数组
4. 在 `src/data/projects.js` 中添加元信息条目（id, slug, title, imageUrl, summary 等）
5. 配图放入 `public/projects/project-XX/`
6. 封面海报放入 `poster/` 目录
7. 在 `src/App.jsx` 中确认 `resolveProjectNavTheme` 覆盖了新 layout

## 导航主题映射（App.jsx）

```js
function resolveProjectNavTheme(projectId) {
  const layout = getProjectContent(projectId)?.layout;
  if (layout === 'project-02-ortur') return 'ortur';
  if (layout === 'project-03-parallax') return 'ortur';
  if (layout === 'project-04-seer') return 'seer';
  if (layout === 'project-01-editorial') return 'editorial';
  return 'light';
}
```

## 注意事项

- `id` 必须在 projects.js 和 project-XX.js 中保持一致
- 新增 project-XX.js 后必须同时在 index.js 中 import 和注册
- 封面图通过 Vite 开发服务器 `__poster` 路由提供，构建后复制到 `dist/poster/`
- 项目详情页路由为 `/project/:slug`，由 App.jsx 手动解析

## 使用流程

### 添加全新项目时

1. 确认新项目的 `id`（如 `project-13`）和 `slug`（URL 路径）
2. 在 `poster/` 放入封面海报图
3. 在 `src/data/projects.js` 中添加元信息条目
4. 创建 `src/data/projectContents/project-13.js`，选择合适 layout，编写 sections
5. 在 `src/data/projectContents/index.js` 中 import + 注册
6. 在 `src/App.jsx` 的 `resolveProjectNavTheme` 中添加新 layout 映射（如需要）
7. 配图放入 `public/projects/project-13/`
8. `npm run dev` 验证走廊画框显示和三级页渲染

### 编辑已有项目内容时

1. 找到 `src/data/projectContents/project-XX.js`
2. 对照 `schema.js` 确认 section type 和字段格式
3. 修改 sections 数组或 theme 配置
4. 同步更新 `src/data/projects.js` 中的 summary/detail（如有变化）
5. `npm run dev` 验证

### 修改走廊画框信息时

1. 编辑 `src/data/projects.js` 中的对应条目
2. 检查 `imageUrl`、`title`、`summary`、`color` 等字段
3. 验证走廊中的画框展示和聚焦卡片内容
