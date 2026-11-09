import { mkdir, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

if (process.platform !== 'darwin') process.exit(0);
const helper = resolve('dist/native/IdeaToGameSpeech.app');
const contents = join(helper, 'Contents');
await mkdir(join(contents, 'MacOS'), { recursive: true });
const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>com.zepingli.ideatogame.speech</string>
<key>CFBundleName</key><string>简游语音输入</string>
<key>CFBundleDisplayName</key><string>简游语音输入</string>
<key>CFBundleExecutable</key><string>IdeaToGameSpeech</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>LSUIElement</key><true/>
<key>NSMicrophoneUsageDescription</key><string>简游仅在你点击麦克风后录音，将你描述的游戏创意转为文字。</string>
<key>NSSpeechRecognitionUsageDescription</key><string>简游使用本机普通话识别，将语音填入输入框，不自动发送。</string>
</dict></plist>`;
await writeFile(join(contents, 'Info.plist'), plist);
for (const [command, args] of [
  ['swiftc', ['native/DictationTranscript.swift', 'native/IdeaToGameSpeech.swift', '-O', '-o', join(contents, 'MacOS/IdeaToGameSpeech')]],
  ['codesign', ['--force', '--sign', '-', '--identifier', 'com.zepingli.ideatogame.speech', helper]],
]) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// The development host is Electron.app; macOS also checks its usage descriptions.
const electronPlist = resolve('node_modules/electron/dist/Electron.app/Contents/Info.plist');
try {
  await access(electronPlist);
  for (const key of ['NSMicrophoneUsageDescription', 'NSSpeechRecognitionUsageDescription']) {
    const read = spawnSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, electronPlist], { stdio: 'ignore' });
    if (read.status !== 0) {
      const result = spawnSync('/usr/libexec/PlistBuddy', ['-c', `Add :${key} string 简游在你点击麦克风后，将普通话语音转为输入框文字。`, electronPlist], { stdio: 'inherit' });
      if (result.status !== 0) process.exit(result.status ?? 1);
    }
  }
} catch { /* Packaging installs these descriptions via build.mac.extendInfo. */ }
