# Tasks for change: improve-frontend-ui

按小任务拆分，方便并行实现与验收。每项列出估计工时（粗略）。

1. Update HTML structure — `public/index.html` (1.0h)
   - 增加语义化标签（`header`, `main`, `label`）。
   - 添加文件信息区域（文件名、大小）、主题切换开关和自定义保存名输入。
   - [x] 完成

2. Implement responsive styles — `public/style.css` (1.5h)
   - 添加响应式断点（320px, 768px, 1024px）。
   - 添加浅/深主题变量与切换样式。
   - 添加结果区 monospace、行号与高亮样式。
   - [x] 完成

3. Enhance client logic — `public/app.js` (3.0h)
   - 文件读取并显示文件元信息（name, size）；大文件提示（>1MB）。
   - 实现视图切换（pretty/raw/minified）。
   - 调用 `/format` 接口并处理 loading 状态、错误显示（展示 error 字段并提供复制按钮）。
   - 实现客户端 Blob 下载并支持自定义文件名。
   - 持久化主题选择到 `localStorage`。
   - [x] 完成

4. Accessibility improvements (0.5h)
   - 增加 `aria-*` 属性、确保可键盘操作、错误区域 `role="alert"`。
   - [x] 完成

5. Testing & cross-browser checks (1.5h)
   - 手动在 Chrome/Firefox/Edge/Safari（移动与桌面）验证功能。
   - 执行示例 `curl` 测试以核对后端接口行为。
   - [x] 完成

6. Documentation updates (0.5h)
   - 更新 `README.md` 和 `docs/PROJECT_SPEC.md` 的前端使用说明与截图示例。
   - [x] 完成

7. Optional: Performance & Worker spike (2.0h)
   - 如果需要，为大型文件使用 Web Worker 以避免主线程阻塞。

Total estimated: ~10 hours (can be parallelized across tasks 1-3)
