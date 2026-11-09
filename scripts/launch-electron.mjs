// LaunchServices gives the app its own macOS privacy identity instead of the terminal/IDE's.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const appBundle = process.argv[2] ? resolve(process.argv[2]) : resolve(projectRoot, 'node_modules/electron/dist/Electron.app');
const { ELECTRON_RUN_AS_NODE: _runAsNode, ...environment } = process.env;
const args = process.platform === 'darwin'
  ? ['-n', '-W', '-a', appBundle, '--env', 'ELECTRON_RUN_AS_NODE',
    ...(environment.NOOBI_RENDERER_URL ? ['--env', `NOOBI_RENDERER_URL=${environment.NOOBI_RENDERER_URL}`] : []),
    ...(environment.NOOBI_CODEX_BIN ? ['--env', `NOOBI_CODEX_BIN=${environment.NOOBI_CODEX_BIN}`] : []),
    ...(!process.argv[2] ? ['--args', projectRoot] : [])]
  : [projectRoot];
const command = process.platform === 'darwin' ? '/usr/bin/open' : resolve(projectRoot, 'node_modules/.bin/electron');
const child = spawn(command, args, { env: environment, stdio: 'inherit' });
child.once('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
