# 三级页内容协议（Content Schema）

12 个项目共用一套内容协议：元信息在 `src/data/projects.js`，长内容在 `src/data/projectContents/project-XX.js`。

## 元信息（projects.js）

每个画框项目至少包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 ID，如 `project-01` |
| `title` | string | 项目标题 |
| `year` | string | 年份 |
| `role` | string | 角色 |
| `services` | string | 服务内容 |
| `color` | string | 主题色 HEX |
| `imageUrl` | string | 走廊画框封面 |
| `summary` | string | 聚焦页右侧摘要 |

## 详情内容（projectContents/project-XX.js）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 与 projects.js 一致 |
| `layout` | string | 页面编排风格，影响 CSS 类名 |
| `sections` | array | 有序模块列表 |

### layout 可选值

- `editorial-dream` — 长文叙事，适合过程型项目（project-01）
- `gallery-first` — 大图优先，文字为辅
- `split-story` — 左右分栏交替
- `timeline-heavy` — 时间线为主
- `minimal-case` — 极简案例展示

### section 模块类型

| type | 用途 | 主要字段 |
|------|------|----------|
| `intro` | 开篇段落组 | `paragraphs[]` |
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
| `callout` | 提示框 | `text`, `variant?` |

## 素材目录

```
content/projects/project-XX/     # 文档源稿（markdown / 纯文本）
public/projects/project-XX/      # 三级页配图（运行时引用）
poster/                          # 走廊画框封面（已有）
```

## 同步流程

1. 在 `content/projects/project-XX/` 整理 markdown 源稿
2. 将结构化内容写入 `src/data/projectContents/project-XX.js`
3. 更新 `src/data/projects.js` 中的元信息与 summary
4. 配图放入 `public/projects/project-XX/`
