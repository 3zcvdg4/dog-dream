---
name: dogdream-backup
description: 'dogdream 项目检查点/回退快照管理。Use when: 备份、回退、checkpoint、快照、恢复、保存当前状态、回退到某个版本、创建检查点。'
---

# Dogdream 检查点与回退管理

## 备份策略

| 类型 | 目录 | Git 跟踪 | 用途 |
|------|------|----------|------|
| 轻量 patch | `backups/checkpoint-*/` 下的 `.patch` 文件 | ✅ 推送 | 快速回退关键文件差异 |
| 整站快照 | `backups/checkpoint-*/` 下的完整目录 | ❌ 仅本地 | 完整恢复点 |
| 整站级目录 | `backups/` 下的整站快照文件夹 | ❌ 仅本地 | 不做 Git 同步 |

## 现有检查点

| 检查点 | 日期 | 内容 |
|--------|------|------|
| `checkpoint-20260516-before-dual-slot-lights` | 05-16 | 双槽灯光之前 |
| `checkpoint-20260516-corridor-confirmed` | 05-16 | 走廊确认版 |
| `checkpoint-20260516-corridor-current` | 05-16 | 走廊当前版 |
| `checkpoint-20260516-paw-gait-v1` | 05-16 | 狗步态 v1 |
| `checkpoint-20260519-home-issues-before-12-posters` | 05-19 | 首页问题/12海报前 |
| `checkpoint-20260520-before-corridor-shadow-pass` | 05-20 | 走廊阴影前 |
| `checkpoint-20260522-full-site-baseline` | 05-22 | 整站基线 |
| `checkpoint-20260523-full-code-current` | 05-23 | 整站当前代码 (Git tag) |
| `checkpoint-20260627-pre-publish-current` | 06-27 | 发布前当前版 |
| `checkpoint-20260627-pre-publish-final` | 06-27 | 发布前最终版 |
| `corridor-before-old-gallery-port` | — | 旧画廊入口前 |
| `responsive-baseline-20260509` | 05-09 | 响应式基线 |

## 每个检查点包含的文件

标准备份包含：
- `DEVELOPMENT_PLAN.md` — 当时的开发计划
- `DreamCorridor.jsx` / `FramePortal.jsx` / `Home.jsx` — 关键页面组件
- `global.css` — 样式
- `projects.js` — 项目数据
- `RESTORE_INSTRUCTION.txt` — 回退说明
- `poster/` / `public/` / `src/` — 整站快照（仅整站级检查点）

## 使用流程

### 在做高风险改动前创建检查点

1. 确认当前 `npm run dev` 正常
2. 在 `backups/` 下创建新目录：`checkpoint-YYYYMMDD-<简短描述>/`
3. 至少复制以下文件进去：
   - `DEVELOPMENT_PLAN.md`
   - `src/pages/DreamCorridor.jsx`
   - `src/pages/Home.jsx`
   - `src/pages/ProjectDream.jsx`
   - `src/components/FramePortal.jsx`
   - `src/styles/global.css`
   - `src/data/projects.js`
   - `src/App.jsx`
4. 写一个 `RESTORE_INSTRUCTION.txt` 说明回退步骤
5. 如果是轻量 patch，可以用 `git diff > backups/checkpoint-YYYYMMDD-xxx/current.patch` 生成差异

### 回退到某个检查点

1. 找到目标检查点目录
2. 阅读 `RESTORE_INSTRUCTION.txt`
3. 将检查点中的文件复制回对应位置覆盖
4. `npm run dev` 验证恢复结果
5. 如果检查点是 Git 提交（如 `checkpoint-20260523-full-code-current`，提交号 `99e30b1`），可用 `git checkout <commit> -- <file>` 恢复单个文件

### 日常不需要备份的内容

- `node_modules/` — `npm install` 即可恢复
- `dist/` — `npm run build` 即可生成
- `.venv/` — Python 虚拟环境
- 临时文件如 `.tmp-water-preview.png`、`cursor-mcp-test.pptx`

## 注意事项

- 轻量 patch 型文件可推送到 GitHub，整站快照目录仅本地保留
- `DEVELOPMENT_PLAN.md` 必须始终保留在根目录，缺失时第一时间从当前状态恢复
- Git 标签 `checkpoint-20260523-full-code-current` 指向提交 `99e30b1`
- 不要用检查点目录里的旧文件直接覆盖而不先确认差异
