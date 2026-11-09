# IdeaToGame · 简游

Turn a game idea into a local Web or Godot game project. Maintained by **Zeping-Li**.

A macOS desktop workbench with a game-making agent, playable previews, project files, configurable media generation, and on-device Mandarin voice input. Click the microphone once to start and again to stop; pauses between sentences preserve earlier text. Dictation never sends the prompt automatically.

## Requirements

- macOS and Node.js 22 or newer (npm 10+).
- Xcode Command Line Tools, including Swift, for the native speech helper. Install with `xcode-select --install` if needed.
- Your own ChatGPT/Codex account for AI game generation. An up-to-date Codex desktop app is recommended; the app falls back to its bundled CLI when none is installed.
- For Godot projects: Godot 4 and matching Web export templates. Web projects do not require Godot.

## Run from source

```sh
git clone https://github.com/lizeping-hub/IdeaToGame.git
cd IdeaToGame
npm ci
npm run build
npm start
```

For development, run `npm run dev`. On macOS, these launch commands use LaunchServices so microphone and speech-recognition permissions belong to the application rather than the terminal or editor.

Open **Settings → Codex account** to sign in with your own account. The first microphone use asks for macOS microphone and speech-recognition permissions. Mandarin dictation requires available on-device language resources. No speech API key is needed; speech audio is processed locally.

Image generation requires an available Codex ImageGen route or a configured image provider. Media-provider credentials are entered in Settings and encrypted by the host. Each user supplies their own accounts and credentials; subscriptions and external APIs may incur usage charges.

## Checks and macOS packaging

```sh
npm run verify
npm run test:ui:voice
npm run package:mac
```

Voice UI regression tests simulate recognizer events without opening a microphone. Native tests cover transcript accumulation, silence, empty results and utterance boundaries. Real speech was also manually checked on the development Mac; recognition quality depends on the microphone, language resources and speech.

The packaging command produces a local macOS app/DMG. A Developer ID certificate and Apple notarization are needed for a trusted public installer. This repository distributes source code, not a signed installer.

## Scope

This is a baseline before broader code changes. It includes the application source, required visual assets, native speech helper, tests and locked dependencies. AI game generation and Godot export are not guaranteed for every prompt. Do not commit credentials, account state or private generated projects.

Licensed under [MIT](LICENSE). Third-party dependencies retain their own licenses.

[简体中文](README.zh-CN.md)
