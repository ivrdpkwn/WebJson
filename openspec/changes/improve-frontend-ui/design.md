# Design: Improve Frontend UI (frontend-ux)

## Goals
- 提升界面可读性与可用性（桌面与移动端）。
- 提供更清晰的错误反馈，方便用户定位并复制错误信息。
- 优化文件交互流程与下载体验。
- 保持后端 API 不变，仅修改前端实现。 

## Layout & Wireframes

整体采用单页布局，竖向堆栈：标题、控制栏（文件选择 + 加载按钮）、输入区、操作按钮、结果展示区、错误/提示区。

ASCII 草图：

```
+-----------------------------------------------------------+
| WebJson                                                   |
| [file input] [load]               [theme toggle] [save-as] |
|                                                           |
| [textarea input                                  ] [size]  |
|                                                           |
| [Format] [Minify] [View: pretty/raw/minified] [Download]   |
|                                                           |
| ------------------ Result ------------------------------- |
| | formatted JSON (selectable, monospace)              |   |
| | error highlight/line numbers (if parse error)        |   |
| --------------------------------------------------------- |
|                                                           |
| status / hint: "Loaded example.json (12 KB)"             |
+-----------------------------------------------------------+
```

在小屏幕上，控件垂直排列，文件信息和按钮为一行内元素的下方文本。

## Interaction Details

- 文件选择：`<input type=file>` + 显示文件名与大小。读取后填充输入区并展示加载成功信息。
- 加载大文件时（>1MB）显示确认提示并禁用自动格式化，提示可能较慢。
- 格式化：点击触发 `fetch('/format', {method:'POST', body: text})`，请求期间显示 loading 状态并禁止重复提交。
- 视图切换：支持三种视图：`pretty`（服务器返回的 4 空格）、`raw`（原始输入）、`minified`（前端 JSON.stringify 压缩）。
- 错误展示：当后端返回 400 且 body 有 `error` 字段时，在结果区高亮显示错误文本；尝试解析错误位置并在结果区显示行号指示（若后端或前端解析能返回位置信息）。并提供复制按钮。
- 下载：以 `Blob` 方式在客户端生成下载文件，支持用户自定义文件名（默认 formatted.json）。
- 主题切换：浅/深两色主题，保留用户偏好到 `localStorage`。

## Accessibility
- 使用语义化元素（`main`, `header`, `label`, `button`），为交互控件提供 `aria-*` 标签和键盘焦点样式。
- 所有按钮需可通过 Tab 键访问；错误信息以 `role="alert"` 提示屏幕阅读器。

## Error formatting and display
- 标准错误响应格式：`{"error":"..."}`。展示内容为纯文本并可复制。
- 如果解析库能返回 `line`/`column`，在页面上显示 `Line: X, Column: Y` 并在结果内容中高亮附近文本（前端用简单算法标注行）。

## Performance Considerations
- 对文本大小做限制和警告（5MB 上限由后端强制，前端在 1MB 以上提示性能风险）。
- 对大型文本操作要避免同步阻塞 UI（如必要使用 `setTimeout` 切片或 Web Worker）。本变更初版不使用 Worker，但在任务拆分中列为可选项。

## Tasks (high level)
1. 更新 `public/index.html`：重构结构，增加 aria 标签与 theme toggle。 
2. 更新 `public/style.css`：添加响应式样式、主题样式、结果区高亮样式。 
3. 更新 `public/app.js`：实现文件读取反馈、fetch 请求、视图切换、错误显示、下载、theme 存储。 
4. 本地测试：在不同视口和主流浏览器测试 UI 与下载行为。
5. 更新 `README.md` 与 `docs/PROJECT_SPEC.md` 的使用指南。

## Wireframe assets
- 可选：若需要更详细视觉稿，我可以生成 SVG 或简单 HTML 原型。

---

设计草案已完成。下一步可以把这些变更拆成 `specs/frontend-ux/spec.md` 与 `tasks.md`，或直接实现前端更改。你想我现在怎么做？
