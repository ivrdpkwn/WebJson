# WebJson 项目 — 项目说明与技术规范

版本: 1.0

## 一、项目概述
- 名称：WebJson
- 目标：提供一个轻量的 Web 服务，用于将用户输入或上传的 JSON 字符串美化（缩进 4 个空格）并返回/下载结果。
- 语言与依赖：C++17、cpp-httplib（单头 `httplib.h`）、nlohmann/json (`json.hpp`)；前端为单页 HTML/JS。

## 二、功能需求
- 支持用户在页面 textarea 中粘贴/编辑 JSON 文本。
- 支持用户选择本地 JSON 文件并读取其内容（在浏览器端使用 FileReader）。
- 后端提供 `POST /format` 接口：接收原始 JSON 文本，返回缩进为 4 个空格的格式化字符串。
- 支持“压缩（minify）”操作（前端可本地完成）。
- 前端能展示格式化结果并支持将结果下载为文件。

## 三、非功能性需求
- 输入大小限制：默认 5 MB（服务器端拒绝更大的请求返回 413）。
- 错误处理：对解析错误返回 400，并在响应 JSON 中包含 `error` 字段。
- 并发：使用 `cpp-httplib` 的线程模型，适合低到中等并发；高并发应放在反向代理后面（nginx）。
- 安全：服务端不执行输入内容；建议生产环境使用 TLS/反向代理和速率限制。

## 四、架构概览

客户端 (浏览器)
  ├─ `index.html` + `app.js` (FileReader, fetch)
  └─ 用户操作（输入/选择文件/点击格式化/下载）
            ↓
HTTP POST /format  --->  后端 (C++ 服务)
                          - 解析 body 为 JSON (nlohmann::json::parse)
                          - 成功：返回 `json.dump(4)`，Content-Type: application/json
                          - 失败：返回 400 + {"error": "..."}

## 五、API 规范

- POST /format
  - 请求头：`Content-Type: application/json` 或 `text/plain; charset=utf-8`
  - 请求体：原始 JSON 文本（UTF-8）
  - 成功响应：HTTP 200
    - Body: 格式化后的 JSON 文本（字符串），例如：
      {
          "a": 1,
          "b": [
              1,
              2
          ]
      }
    - Header: `Content-Type: application/json; charset=utf-8`
  - 解析失败：HTTP 400
    - Body: `{"error":"parse error message"}`
  - 请求体过大：HTTP 413，Body: `Payload too large`

## 六、错误处理与日志
- 所有异常由后端捕获并返回合理的 HTTP 状态。用于调试的详细错误通过响应体返回（生产环境可简化信息以免泄露内部细节）。
- 建议在部署时把请求/错误写入日志文件并轮转。

## 七、部署与运行

1. 构建（开发机）：

```bash
mkdir -p build
cd build
cmake ..
cmake --build . --config Release
./webjson
```

2. 生产部署建议
- 使用 `systemd` 或 Docker 管理进程。
- 将服务放在 nginx 之后处理 TLS、gzip 与速率限制：nginx 反向代理到本服务的 8080 端口。

示例 dockerfile（可选）和 systemd 单元可按需添加。

## 八、前端说明
- 文件：`public/index.html`, `public/app.js`, `public/style.css`。
- 行为要点：
  - 选择文件后，用 `FileReader.readAsText` 读取并填充 textarea。
  - 点击“格式化”通过 `fetch('/format', {method:'POST', body:text})` 发送请求并显示返回文本。
  - 点击“压缩”在前端用 `JSON.parse`/`JSON.stringify` 执行并展示结果。
  - 点击“下载”在前端用 `Blob` + `URL.createObjectURL` 生成并触发下载。

## 九、测试策略
- 手动测试：通过浏览器操作页面（粘贴、文件、格式化、下载）验证功能。
- 自动化测试（建议）：
  - 启动服务后用 `curl` 或脚本调用 `/format` 测试有效、无效、超大输入。
  - 单元测试（可选）：将格式化逻辑封装后使用 Catch2 / GoogleTest 编写解析/序列化测试。

## 十、扩展与改进点
- 支持选择缩进宽度（用户可选 2/4/制表符）。
- 在后端添加 `POST /format/file` 以支持文件上传并返回下载链接（需文件存储管理）。
- 增加速率限制、身份验证、请求配额。
- 支持 JSON 修复/错误高亮（前端集成解析错误位置提示）。

## 十一、文件结构

```
WebJson/
├─ CMakeLists.txt
├─ README.md
├─ docs/PROJECT_SPEC.md
├─ src/main.cpp
├─ public/
│  ├─ index.html
│  ├─ app.js
│  └─ style.css
└─ build/  (cmake 输出)
```

## 十二、示例交互

请求：
```bash
curl -X POST http://localhost:8080/format -H "Content-Type: application/json" --data '{"a":1,"b":[1,2]}'
```

成功响应（HTTP 200，body 为格式化 JSON）：

```json
{
    "a": 1,
    "b": [
        1,
        2
    ]
}
```

错误响应（示例，HTTP 400）：

```json
{"error":"[json.exception.parse_error.101] parse error at line 1, column 2: syntax error"}
```

----

如需我将此规范细化为 `architecture.md`、添加 `Dockerfile` 或 `systemd` 单元并提交到仓库，请告诉我下一步要做的内容。 
