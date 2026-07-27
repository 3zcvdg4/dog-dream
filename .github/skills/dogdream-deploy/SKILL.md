---
name: dogdream-deploy
description: '部署 dogdream 网站到 Cloudflare Pages 或 Netlify。Use when: 发布上线、部署到生产环境、上传 dist、Cloudflare Pages、Netlify deploy、dogdreamspace.com 更新、构建后发布。'
---

# Dogdream 部署发布

## 部署目标

| 目标 | 地址 |
|------|------|
| 生产域名 | `https://dogdreamspace.com/` |
| Cloudflare Pages | `https://dogdreamspace.pages.dev/` |
| 项目名 (Cloudflare) | `dogdreamspace` |

## 首选方案：Cloudflare Pages 手动上传

> **不要**反复重试 `npx wrangler pages deploy` 的 OAuth localhost 回调流程，除非用户明确要求且已有新的可用认证配置。

### 部署前检查

1. 确认本地有实际更新需要发布
2. 确认更新页面/功能在本地可正常工作
3. 重新构建：`npm run build`（确保 `dist` 是最新的）
4. 确认构建产物来自当前工作区状态

### 部署步骤

1. 确认本地变更内容
2. 从 `G:\正在工作\dogdream` 重新构建站点
3. 在浏览器中登录 Cloudflare Dashboard
4. 打开 `Workers & Pages`
5. 打开项目 `dogdreamspace`
6. 点击 `Create deployment`
7. 环境保持 `Production`
8. 上传文件夹 `G:\正在工作\dogdream\dist`
9. 等待所有文件上传完成
10. 点击 `Save and deploy`
11. 等待成功页面后再报告成功

### 部署后验证

- 验证 `dogdreamspace.pages.dev` 可访问
- 验证 `dogdreamspace.com` 可访问
- 如果显示旧页面，强制刷新 (Ctrl+F5 / Cmd+Shift+R)

## 备选方案：Netlify（方案 A：GitHub 推送）

用户偏好通过 GitHub 仓库推送 + Netlify 自动发布。

前提检查：
- 本机需已登录 GitHub / Netlify
- 需有远程仓库绑定

### Netlify CLI 直接部署

```bash
npx netlify deploy --dir=dist --prod --site <site-id>
```

- 优先使用 site-id 而非 site name
- 确认 `netlify.toml` 中 publish 目录为 `dist`
- 构建产物必须是最新的

## 构建命令

```bash
npm run build    # 生产构建 → dist/
npm run dev      # 本地开发 → localhost:5173
npm run preview  # 预览构建产物
```

## 注意事项

- `_worker.js`（联系表单 Cloudflare Worker）在构建时由 `vite.config.js` 自动复制到 `dist/_worker.js`
- `poster/` 目录在构建时自动复制到 `dist/poster/`
- `functions/` 目录不支持 Cloudflare Pages 编译，联系表单走根目录 `_worker.js` 方案
- `backups/` 整站快照目录不上传 GitHub，仅本地保留

## 使用流程

### 当用户说"发布"/"部署"/"上传"时

1. 先确认本地改动是否已经在 `npm run dev` 下验证通过
2. 执行 `npm run build` 生成最新 `dist/`
3. 检查构建是否成功（无报错）
4. 按上方"部署步骤"执行 Cloudflare 手动上传
5. 部署后打开 `dogdreamspace.com` 验证
6. 如果页面显示旧内容，提示用户 Ctrl+F5 强制刷新

### 当部署后发现联系表单不可用时

1. 检查 `dist/_worker.js` 是否存在
2. 确认 Cloudflare Dashboard 中 Worker 绑定正确
3. 检查 Resend API Key 环境变量是否配置
4. 查看浏览器 Network 面板中 `/api/contact` 的响应状态码

### 当 wrangler CLI 失败时

- 不重复尝试 CLI，直接走手动上传流程
- 除非用户明确说已修复 OAuth 配置
