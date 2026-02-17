# WebJson

简单的 JSON 美化服务，使用 C++ + `cpp-httplib` 提供 HTTP 接口，使用 `nlohmann/json` 做解析与格式化，前端为静态单页应用。

构建与运行：

```bash
mkdir -p build
cd build
cmake ..
cmake --build . --config Release
./webjson
```

默认监听 `0.0.0.0:8080`，浏览器打开 `http://localhost:8080`。

接口：
- `POST /format`：请求体为 JSON 文本（或 text/plain），成功返回格式化后的 JSON（缩进 4 空格），失败返回 400 + 错误信息。
