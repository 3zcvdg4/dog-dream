# VS Code Copilot Chat 接入 ZEOAPI 操作文档

更新时间：2026-05-08

## 1. 目标

把 ZEOAPI 的 OpenAI 兼容模型接入 VS Code 的 Copilot Chat 模型选择器中使用。

这份文档的目标不是替换 GitHub Copilot 官方后端，而是通过 VS Code 的语言模型提供器扩展，把 ZEOAPI 模型加入 Copilot Chat 的可选模型列表。

## 2. 结论先说

1. GitHub Copilot 官方内建模型不能直接改成走第三方 base URL。
2. 可行方案是安装支持语言模型提供器的扩展，把 ZEOAPI 模型挂进 Copilot Chat。
3. 推荐方案使用扩展 `johnny-zhao.oai-compatible-copilot`。
4. 这种方式主要影响 Copilot Chat 和部分编辑场景，不会把普通 Tab 补全完整切到 ZEOAPI。

## 3. 前置条件

开始前先确认以下条件成立：

1. 已安装 VS Code。
2. 已安装 GitHub Copilot 与 GitHub Copilot Chat，并已登录可用账号。
3. VS Code 版本不低于 1.104。
4. 已有可用的 ZEOAPI key。
5. 建议先确认 ZEOAPI 兼容 OpenAI SDK，OpenAI 兼容基址使用：

```text
https://www.zeoapi.com/v1
```

## 4. 推荐方案

推荐扩展：`johnny-zhao.oai-compatible-copilot`

选择这个方案的原因：

1. 它直接把模型作为语言模型提供器挂进 Copilot Chat。
2. 支持 OpenAI 兼容接口。
3. 支持在模型选择器中显示自定义模型。
4. 支持通过命令面板录入 API key。

## 5. 下载与安装扩展

### 方式 A：在 VS Code 图形界面安装

1. 打开 VS Code。
2. 按 `Ctrl+Shift+X` 打开扩展市场。
3. 搜索：`OAI Compatible Provider for Copilot`
4. 确认发布者是 `johnny-zhao`。
5. 点击安装。

扩展 ID：

```text
johnny-zhao.oai-compatible-copilot
```

### 方式 B：在终端安装

如果目标机器已安装 VS Code 命令行工具，可直接执行：

```powershell
code --install-extension johnny-zhao.oai-compatible-copilot
```

## 6. 配置方式

推荐把配置写到 VS Code 用户设置里，这样不会污染项目仓库。

如果只想对某个项目生效，也可以写到该项目的 `.vscode/settings.json`。

### 打开用户设置 JSON

1. 按 `Ctrl+Shift+P`
2. 输入并执行：`Preferences: Open User Settings (JSON)`

### 写入以下配置

```json
{
  "oaicopilot.baseUrl": "https://www.zeoapi.com/v1",
  "oaicopilot.models": [
    {
      "id": "gpt-5.4",
      "owned_by": "zeoapi",
      "displayName": "ZEOAPI GPT-5.4",
      "temperature": 0
    },
    {
      "id": "gpt-5.3-codex",
      "owned_by": "zeoapi",
      "displayName": "ZEOAPI GPT-5.3 Codex",
      "temperature": 0
    },
    {
      "id": "claude-opus-4-6-thinking",
      "owned_by": "zeoapi",
      "displayName": "ZEOAPI Claude Opus 4.6 Thinking",
      "temperature": 0
    },
    {
      "id": "claude-opus-4-7",
      "owned_by": "zeoapi",
      "displayName": "ZEOAPI Claude Opus 4.7",
      "temperature": 0
    }
  ]
}
```

说明：

1. `oaicopilot.baseUrl` 指向 ZEOAPI 的 OpenAI 兼容基址。
2. `oaicopilot.models` 里列出你希望在 Copilot Chat 模型选择器中看到的模型。
3. 如果 ZEOAPI 后续调整了模型名，以 ZEOAPI 控制台或价格页展示的实际模型 ID 为准。

## 7. 录入 API Key

不要把 API key 直接写进项目仓库。

按下面步骤录入：

1. 按 `Ctrl+Shift+P`
2. 执行命令：`OAICopilot: Set OAI Compatible Apikey`
3. 粘贴新的 ZEOAPI key
4. 回车确认

扩展内对应命令 ID：

```text
oaicopilot.setApikey
```

如果需要打开扩展自带配置界面：

1. 按 `Ctrl+Shift+P`
2. 执行命令：`OAICopilot: Open Configuration UI`

扩展内对应命令 ID：

```text
oaicopilot.openConfig
```

## 8. 让模型出现在 Copilot Chat 模型选择器中

1. 打开 Copilot Chat。
2. 点击聊天输入框附近的模型选择器。
3. 选择 `Manage Models`，或者执行命令：`Chat: Manage Language Models`。
4. 在语言模型管理界面中找到 `OAI Compatible` 提供器。
5. 把需要的模型设为可见。
6. 回到 Copilot Chat，从模型选择器中切换到刚添加的 ZEOAPI 模型。

如果管理界面提示先配置 provider，则按提示选择 `OAI Compatible` 并确认当前 key 已设置。

## 9. 验证是否接入成功

可以用下面方法验证：

1. 打开 Copilot Chat。
2. 在模型选择器里选择 `ZEOAPI GPT-5.4` 或其它已配置模型。
3. 输入一条简单请求，例如：

```text
请总结当前工作区的 README，并列出 3 个主要开发命令。
```

4. 如果能正常返回结果，说明模型已接入成功。

进一步验证：

1. 试一次 `@workspace` 问题。
2. 试一次普通聊天。
3. 如果模型支持工具调用，再试一次简单编辑请求。

## 10. 常见问题排查

### 10.1 模型不显示

按以下顺序排查：

1. 确认扩展已安装并启用。
2. 确认 GitHub Copilot 和 Copilot Chat 已登录。
3. 确认 VS Code 版本不低于 1.104。
4. 执行：`Developer: Reload Window`
5. 再次执行：`Chat: Manage Language Models`
6. 检查配置里的模型 ID 是否真实存在。

### 10.2 返回 401 或鉴权失败

1. 重新检查 ZEOAPI key 是否有效。
2. 确认没有多余空格。
3. 如果 key 之前已经泄露，先在 ZEOAPI 控制台轮换为新 key。

### 10.3 有的模型在聊天里能用，但在 agent 模式里不可见

这是正常现象。原因通常是该模型不支持或不稳定支持工具调用。

处理方式：

1. 优先选择更适合编码和工具调用的模型。
2. 对复杂编辑任务优先使用 `gpt-5.3-codex` 或更强的编码模型。

### 10.4 想让普通 Tab 补全也走 ZEOAPI

这份方案主要作用在 Copilot Chat 侧。

不能把 GitHub Copilot 的原生 Tab 补全完整切换到 ZEOAPI，这是当前机制边界，不是配置漏了。

## 11. 安全建议

1. API key 不要写进仓库文件。
2. 如果 key 曾在聊天、截图、日志中暴露，先轮换。
3. 优先把 key 保存在扩展自己的本地存储里，不要提交到 Git。
4. 如非必要，不要把带 key 的 settings.json 发给别人。

## 12. 建议给其他 AI 的执行清单

如果你要让另一台机器上的 AI 直接照这份文档执行，给它的最短指令可以写成：

```text
请按桌面这份《VS Code Copilot Chat 接入 ZEOAPI 操作文档》执行：
1. 安装扩展 johnny-zhao.oai-compatible-copilot
2. 把文档中的 JSON 写入 VS Code 用户设置
3. 通过 OAICopilot: Set OAI Compatible Apikey 录入新的 ZEOAPI key
4. 在 Chat: Manage Language Models 中把 OAI Compatible 模型设为可见
5. 用 Copilot Chat 发送一条测试消息验证是否成功
6. 不要把 API key 写进项目仓库
```

## 13. 备用方案

如果推荐扩展表现不稳定，可改用已经验证过的备用扩展：

```text
oai2lmapi.oai2lmapi
```

备用方案优点：

1. API key 通过 VS Code SecretStorage 保存。
2. 更偏向标准 OpenAI 兼容桥接。

但为了降低跨机器复现差异，这份文档默认仍以 `johnny-zhao.oai-compatible-copilot` 为主方案。

## 14. 这次归档的实际落地结果

本次已经完成的内容：

1. 当前机器已安装推荐扩展。
2. 当前工作区已写入一份不含密钥的模型配置。
3. 已确认扩展真实命令包括：

```text
oaicopilot.setApikey
oaicopilot.openConfig
```

4. 已确认目标扩展能作为语言模型提供器挂到 Copilot Chat。
