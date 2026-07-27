---
name: dogdream-contact
description: 'dogdream 联系表单与 Cloudflare Worker 调试。Use when: 联系表单、contact form、_worker.js、Resend、Turnstile、邮件发送、api/contact、ContactFormModal、表单提交失败、CORS。'
---

# Dogdream 联系表单与 Cloudflare Worker

## 架构概览

```
前端 ContactFormModal.jsx → POST /api/contact → _worker.js → Resend API → 邮箱
                                    ↑
                         Turnstile 人机验证
```

| 组件 | 文件 | 职责 |
|------|------|------|
| 表单 UI | `src/components/ContactFormModal.jsx` | 弹窗表单、字段验证、Turnstile |
| Worker | `_worker.js` | 请求校验、速率限制、CORS、转发 Resend |
| 构建复制 | `vite.config.js` | 构建时复制 `_worker.js` → `dist/_worker.js` |

## Worker 关键配置

### 允许的来源域

```js
const DEFAULT_ALLOWED_ORIGINS = [
  'https://dogdreamspace.com',
  'https://www.dogdreamspace.com',
  'https://dogdreamspace.pages.dev',
];
```

可通过 Cloudflare 环境变量 `ALLOWED_ORIGIN` 覆盖（逗号分隔）。

### 速率限制

| 参数 | 默认值 |
|------|--------|
| 窗口 | 600 秒 (10 分钟) |
| 最大请求数 | 5 次 |

### 表单验证规则（Worker 端）

| 规则 | 说明 |
|------|------|
| `company` 非空 | 视为垃圾邮件，直接拒绝 |
| `name` 必填 | 最长 80 字符 |
| `contact` 必填 | 最长 120 字符，允许微信/电话等自由文本 |
| `message` 必填 | 最长 5000 字符 |
| `contact` 像邮箱但不合法 | 拒绝（仅当其包含 `@` 且格式不对时） |

### 邮箱发送逻辑

- `contact` 字段仅在格式为合法邮箱时才写入 Resend 的 `reply_to`
- 非邮箱值（如微信 ID）不会被写入 `reply_to`，避免 Resend 拒收
- 邮件正文始终包含用户填写的 `contact` 值

### 需要的 Cloudflare 环境变量

| 变量 | 用途 |
|------|------|
| `RESEND_API_KEY` | Resend API 密钥 |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 密钥 |
| `ALLOWED_ORIGIN` | 可选，覆盖默认 CORS 来源 |

## 前端表单（ContactFormModal.jsx）

### 表单字段

| 字段 | 说明 |
|------|------|
| `name` | 姓名 |
| `contact` | 联系方式（邮箱/微信/电话均可） |
| `message` | 留言内容 |
| `company` | 蜜罐字段（隐藏，机器人自动填充） |

### API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/contact` | POST | 提交表单 |
| `/api/contact-config` | GET | 获取 Turnstile site key |

### Turnstile 集成

- 脚本动态加载 (`cf-turnstile-script`)
- 表单提交前需完成 Turnstile 验证
- Token 随表单一起发送到 Worker

## 使用流程

### 调试联系表单发送失败时

1. 打开浏览器 DevTools → Network 面板
2. 提交表单，观察 `/api/contact` 响应
3. 检查响应中的 `errorCode`：
   - `turnstile_required` / `turnstile_unavailable` → Turnstile 配置问题
   - `rate_limited` → 超频率限制
   - `validation_error` → 字段不符合规则
   - `spam_rejected` → company 蜜罐字段被填
4. 如果 Worker 返回 405，检查是否走错了端点（旧 Netlify Forms 已废弃）
5. 如果 Worker 返回 500，检查 Cloudflare 环境变量 `RESEND_API_KEY` 是否正确

### 修改 Worker 逻辑时

1. 编辑根目录 `_worker.js`
2. `npm run build` 重新构建（`vite.config.js` 自动复制到 `dist/_worker.js`）
3. 重新部署到 Cloudflare Pages
4. 用真实表单提交验证

### 修改前端表单时

1. 编辑 `src/components/ContactFormModal.jsx`
2. 字段变更需同步更新 Worker 端的 `validatePayload`
3. `npm run dev` 本地测试 UI
4. 构建部署后验证端到端

## 注意事项

- 站点已从 Netlify 迁到 Cloudflare Pages，原 `Netlify Forms` 在 `dogdreamspace.com` 上返回 405
- `functions/api/` 目录不支持 Cloudflare Pages 编译，不要往里面加逻辑
- `contact` 字段的设计意图是"允许填微信/电话"，不是纯邮箱字段
- Turnstile 在前端和 Worker 端都需要正确配置才能通过
