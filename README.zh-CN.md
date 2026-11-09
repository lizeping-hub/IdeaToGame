# IdeaToGame · 简游

用一句话描述创意，制作本地 Web 或 Godot 游戏工程。维护者 **Zeping-Li**。

当前为 macOS 桌面版，提供游戏制作 Agent、可玩预览、素材与工程文件管理，以及本机普通话语音输入。麦克风单击开始，再次单击停止；允许停顿后继续说话，并保留前后内容。语音识别不会自动发送制作需求。

## 运行要求

- macOS、Node.js 22 或更新版本、npm 10 或更新版本。
- 用于编译语音组件的 Xcode Command Line Tools（包含 Swift）。未安装时执行 `xcode-select --install`。
- 生成游戏需要使用者自己的 ChatGPT/Codex 账号。建议安装最新版 Codex 桌面应用；未找到时会回退使用项目内置 CLI。
- 制作 Godot 游戏时，需要 Godot 4 与版本匹配的 Web 导出模板；Web 游戏不要求安装 Godot。

## 下载并运行

```sh
git clone https://github.com/lizeping-hub/IdeaToGame.git
cd IdeaToGame
npm ci
npm run build
npm start
```

也可以下载仓库 ZIP，解压后在项目目录执行后三条命令。开发模式使用 `npm run dev`。

macOS 下请使用上述启动命令或双击打包后的应用。启动命令通过系统正常应用入口打开，确保语音识别权限归属应用。

首次进入后，在 **设置 → Codex 账户**登录自己的账号。首次使用语音输入时，请允许系统的麦克风与语音识别权限。本机普通话资源可用时无需语音 API Key，识别音频在本机处理。

游戏图片需要可用的 Codex ImageGen 路线，或在设置中配置图片服务。媒体服务密钥由主进程加密保存，不随项目分发。账号、订阅与外部 API 用量由使用者自行提供和承担。

## 验证与打包

```sh
npm run verify
npm run test:ui:voice
npm run package:mac
```

界面回归测试使用模拟识别事件，不开启麦克风；原生测试覆盖文字累积、静音、空结果和语句分段。语音输入也已在开发 Mac 上人工试用，识别效果仍取决于麦克风、语言资源和说话情况。

打包命令生成本地 macOS 应用和 DMG。对外分发可信安装包仍需 Developer ID 签名与 Apple 公证。当前仓库提供源码，不提供已签名安装包。

## 版本范围

这是大范围代码改动前的基线，包含运行所需源码、视觉素材、原生语音组件、测试与依赖锁定文件。不能保证任意需求都能生成成功，Godot 导出还需在自己的环境中验证。请勿提交密钥、账号数据或私人游戏工程。

采用 [MIT 许可证](LICENSE)，第三方依赖保留各自许可证。
