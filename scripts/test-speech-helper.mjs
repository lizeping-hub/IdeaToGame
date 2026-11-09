import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

if (process.platform !== 'darwin') {
  console.log('Native speech tests require macOS; skipped.');
  process.exit(0);
}
const directory = await mkdtemp(join(tmpdir(), 'ideatogame-native-test-'));
try {
  const binary = join(directory, 'transcript-tests');
  for (const [command, args] of [
    ['swiftc', ['native/DictationTranscript.swift', 'native/tests/DictationTranscriptTests.swift', '-o', binary]],
    [binary, []],
  ]) {
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`Native speech regression failed (${result.status ?? result.signal}).`);
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
