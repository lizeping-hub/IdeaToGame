// Real Electron UI with a deterministic speech IPC fixture. Never opens a microphone.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const root = resolve(__dirname, '..');
const profile = mkdtempSync(join(tmpdir(), 'ideatogame-voice-ui-'));
app.setPath('userData', profile);
if (app.dock) app.dock.setIcon = () => {};
let win;
let sessionId;
let starts = 0;
let stops = 0;
let deny = false;
const js = code => win.webContents.executeJavaScript(code, true);
const assert = (ok, message) => { if (!ok) throw Error(message); };
const wait = async expression => {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await js(`Boolean(${expression})`).catch(() => false)) return;
    await new Promise(r => setTimeout(r, 50));
  }
  throw Error('UI condition failed: ' + expression);
};
const click = selector => js(`document.querySelector(${JSON.stringify(selector)}).click()`);
const send = event => win.webContents.send('ideatogame:speech:event', { sessionId, ...event });
const timeout = setTimeout(() => { console.error('Voice UI timeout'); app.exit(1); }, 60000);
(async () => {
  try {
    // Exercise the same Swift accumulator used by the actual microphone helper.
    const nativeFixture = join(profile, 'native-transcript-fixture');
    const compile = spawnSync('swiftc', [join(root, 'native/DictationTranscript.swift'), join(root, 'native/tests/DictationTranscriptTests.swift'), '-o', nativeFixture], { encoding: 'utf8' });
    assert(compile.status === 0, compile.stderr);
    const nativeReplay = spawnSync(nativeFixture, ['--conversation-json'], { encoding: 'utf8' });
    assert(nativeReplay.status === 0, nativeReplay.stderr);
    const nativeSnapshots = JSON.parse(nativeReplay.stdout);
    await import(pathToFileURL(join(root, 'dist/main/main.js')).href);
    await app.whenReady();
    while (!(win = BrowserWindow.getAllWindows()[0])) await new Promise(r => setTimeout(r, 50));
    await wait("document.querySelector('.home-dashboard')");
    ipcMain.removeHandler('ideatogame:speech:start');
    ipcMain.removeHandler('ideatogame:speech:stop');
    ipcMain.handle('ideatogame:speech:start', (_event, id) => {
      starts++; sessionId = id;
      if (deny) send({ type: 'error', message: '测试权限被拒绝提示' });
      else send({ type: 'listening' });
    });
    ipcMain.handle('ideatogame:speech:stop', (_event, id) => {
      assert(id === sessionId, 'Stop must target active session'); stops++;
      send({ type: 'stopping' });
    });
    await js(`(() => { const el=document.querySelector('.home-dashboard textarea');
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'已有游戏需求');
      el.dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await wait("document.querySelector('.home-dashboard textarea').value==='已有游戏需求'");
    assert(await js("Boolean(document.querySelector('.home-create-button').previousElementSibling.querySelector('[aria-label=\"开始语音输入\"]'))"), 'Mic beside send');
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-button').getAttribute('aria-label')==='停止语音输入'");
    assert(await js("document.querySelector('.home-dashboard textarea').readOnly && document.querySelector('.home-create-button').disabled"), 'No edit or accidental submit during recording');
    send({ type: 'transcript', text: '主角是一只小猫' });
    await wait("document.querySelector('.home-dashboard textarea').value==='已有游戏需求\\n主角是一只小猫'");
    for (let i = 0; i < 32; i++) send({ type: 'level', level: (i % 7) / 7 });
    await wait("new Set([...document.querySelectorAll('.voice-input-wave i')].map(x=>x.style.height)).size>2");
    for (const width of [1510, 900, 760]) {
      win.setSize(width, 940);
      await wait(`innerWidth===${width}`);
      assert(await js("(() => {const c=document.querySelector('.home-prompt-card').getBoundingClientRect(); const b=document.querySelector('.voice-input-button').getBoundingClientRect(); return b.right<=c.right && b.left>=c.left && document.querySelector('.workspace').scrollWidth <= document.querySelector('.workspace').clientWidth + 1;})()"), 'Voice control visible at ' + width);
    }
    win.setSize(1510, 940); await wait('innerWidth===1510');
    await fs.writeFile('/tmp/ideatogame-voice-listening.png', (await win.webContents.capturePage()).toPNG());
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-control').classList.contains('phase-stopping')");
    assert(starts === 1 && stops === 1, 'One start, one stop');
    send({ type: 'finished', text: '主角是一只小猫，可以收集金币。' });
    await wait("document.querySelector('.voice-input-control').classList.contains('phase-idle')");
    assert(await js("document.querySelector('.home-dashboard textarea').value==='已有游戏需求\\n主角是一只小猫，可以收集金币。' && !document.querySelector('.home-dashboard textarea').readOnly"), 'Final transcript editable with existing text retained');
    assert(await js("!document.querySelector('.voice-input-strip') && document.querySelectorAll('.home-project-grid button').length===0"), 'Stops waveform, never auto submits');
    // Reproduce the slow-stop bug: recognized words, a long pause, then an empty final.
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-button').getAttribute('aria-label')==='停止语音输入'");
    send({ type: 'transcript', text: '还要有一座彩虹桥' });
    await wait("document.querySelector('.home-dashboard textarea').value.endsWith('还要有一座彩虹桥')");
    const retained = await js("document.querySelector('.home-dashboard textarea').value");
    await new Promise(r => setTimeout(r, 3500));
    send({ type: 'transcript', text: '' });
    send({ type: 'transcript', text: '   ' });
    await new Promise(r => setTimeout(r, 100));
    assert(await js("document.querySelector('.home-dashboard textarea').value") === retained, 'Silence must never erase recognized words');
    await click('.voice-input-button');
    send({ type: 'finished', text: '' });
    await wait("document.querySelector('.voice-input-control').classList.contains('phase-idle')");
    assert(await js("document.querySelector('.home-dashboard textarea').value") === retained, 'Empty final must retain previous recognition');
    assert(!await js("Boolean(document.querySelector('.voice-input-error'))"), 'Recognized session must not say no speech');
    // Same recording, two five-second thinking pauses, with actual Swift aggregation.
    const beforeConversation = await js("document.querySelector('.home-dashboard textarea').value");
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-button').getAttribute('aria-label')==='停止语音输入'");
    for (const text of nativeSnapshots.slice(0, 3)) send({ type: 'transcript', text });
    await wait("document.querySelector('.home-dashboard textarea').value.endsWith('做一个小猫游戏。')");
    await new Promise(r => setTimeout(r, 5000));
    for (const text of nativeSnapshots.slice(3, 5)) send({ type: 'transcript', text });
    await wait("document.querySelector('.home-dashboard textarea').value.endsWith('做一个小猫游戏。还要收集星星。')");
    await new Promise(r => setTimeout(r, 5000));
    send({ type: 'transcript', text: nativeSnapshots[5] });
    await wait("document.querySelector('.home-dashboard textarea').value.endsWith('做一个小猫游戏。还要收集星星。做一个小猫游戏。')");
    await click('.voice-input-button');
    send({ type: 'finished', text: nativeSnapshots[6] });
    await wait("document.querySelector('.voice-input-control').classList.contains('phase-idle')");
    const fullConversation = beforeConversation + '\n' + nativeSnapshots[6];
    assert(await js("document.querySelector('.home-dashboard textarea').value") === fullConversation, 'Every utterance must remain, including a repeated sentence');
    // A genuinely empty *new* session should still report that nothing was heard.
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-button').getAttribute('aria-label')==='停止语音输入'");
    await click('.voice-input-button'); send({ type: 'finished', text: '' });
    await wait("document.querySelector('.voice-input-error')?.textContent.includes('没有听清')");
    assert(await js("document.querySelector('.home-dashboard textarea').value") === fullConversation, 'Empty new session must preserve earlier text');
    await click('[aria-label="关闭语音提示"]');
    deny = true;
    await click('.voice-input-button');
    await wait("document.querySelector('.voice-input-error')?.textContent.includes('测试权限被拒绝提示')");
    assert(await js("document.querySelector('.voice-input-control').classList.contains('phase-idle') && document.querySelector('.home-dashboard textarea').value.includes('金币')"), 'Denied permission preserves text and permits retry');
    await click('[aria-label="关闭语音提示"]');
    await fs.writeFile('/tmp/ideatogame-voice-idle.png', (await win.webContents.capturePage()).toPNG());
    console.log(JSON.stringify({ passed: ['mic placement', 'recording and stop state', 'volume-driven bars', 'partial/final text merge', 'read-only during recording', 'no automatic submit', 'permission denial recovery', 'desktop and narrow layouts', '3.5-second pause retention', 'empty partial/final protection', 'new empty session feedback', 'two five-second pauses', 'three utterances retained', 'repeated sentence retained', 'native Swift aggregation through IPC'], fixture: 'Speech events simulated; microphone never opened' }));
    clearTimeout(timeout); app.quit(); await fs.rm(profile, { recursive: true, force: true });
  } catch (error) { console.error(error); clearTimeout(timeout); app.exit(1); }
})();
