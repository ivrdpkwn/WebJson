```markdown
# spec: frontend-ux (delta for improve-frontend-ui)

## 概述
该 delta 说明为 `improve-frontend-ui` change 所做的前端 UX 更新与验收准则补充。将其与主规格合并以更新 `frontend-ux` 能力。

## 变更要点
- 添加或改进：文件信息展示（文件名、大小）、主题切换、视图切换（pretty/raw/minified）。
- 添加性能提示：文件 >1MB 显示警告；超出 5MB 时阻止上传。
- 错误显示：展示后端 `error` 字段并提供复制按钮。
- 下载：支持自定义文件名的 Blob 下载行为。

## Acceptance Criteria（针对本变更）
- 当用户选择本地文件时，界面显示文件名与大小。
- 超过 1MB 时显示性能提示；超过 5MB 禁止并提示。
- 格式化失败时展示后端返回的 `error` 并允许复制。
- 主题切换持久化到 `localStorage`。

## Notes
- 该文件作为 delta 提交到主规格前，请由维护者确认合并条目无冲突。

```
