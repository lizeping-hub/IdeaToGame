// Runs the real Electron renderer with isolated settings; never logs in or calls paid generation.
const { app, BrowserWindow } = require('electron');
// The fixture app has no packaged dock icon.
if (app.dock) app.dock.setIcon = () => {};
const { rm, writeFile } = require('node:fs/promises');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const profile = mkdtempSync(join(tmpdir(), 'ideatogame-ui-'));
  app.setPath('userData', profile);
  const timeout = setTimeout(() => { console.error('UI regression timed out'); app.exit(1); }, 45000);
  try {
    await import(pathToFileURL(join(__dirname, '../dist/main/main.js')).href);
    await app.whenReady();
    let win;
    for (let i = 0; i < 150; i++) {
      win = BrowserWindow.getAllWindows()[0];
      if (win && await win.webContents.executeJavaScript("Boolean(document.querySelector('.home-dashboard'))").catch(() => false)) break;
      await new Promise(r => setTimeout(r, 100));
    }
    const result = await win.webContents.executeJavaScript(`(async () => {
      const pause = () => new Promise(r => setTimeout(r, 80));
      const assert = (ok, message) => { if (!ok) throw new Error(message); };
      const click = (selector) => { const el = document.querySelector(selector); assert(el, selector); el.click(); };
      const fill = async (selector, value) => {
        const el = document.querySelector(selector);
        Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true })); await pause();
      };
      const category = async (text) => {
        [...document.querySelectorAll('.settings-nav button')].find(el => el.textContent.includes(text)).click(); await pause();
      };
      assert(document.title === 'IdeaToGame · 简游', 'Title');
      assert(document.body.innerText.includes('Zeping-Li'), 'Author');
      assert(!document.querySelector('.home-engine-advisor'), 'Engine reminder removed');
      const expectedModels = ['GPT-6.1 Sol', 'GPT-6 Astra', 'GPT-6.1 Terra', 'GPT-6 Sol',
        'GPT-6 Luna', 'GPT-5.6 Sol', 'GPT-5.6 Terra', 'GPT-5.6 Luna'];
      const runtime = await window.noobi.refreshRuntime();
      assert(JSON.stringify(runtime.models.map(m => m.displayName)) === JSON.stringify(expectedModels), 'Exact runtime model catalog');
      for (const name of expectedModels) {
        if (document.querySelector('.home-model-trigger').getAttribute('aria-expanded') !== 'true') {
          click('.home-model-trigger'); await pause();
        }
        click('.home-model-section button[role="menuitem"]'); await pause();
        const options = [...document.querySelectorAll('.home-model-options [role="option"]')];
        assert(JSON.stringify(options.map(el => el.querySelector('strong').textContent)) === JSON.stringify(expectedModels), 'Exact visible model options');
        options.find(el => el.querySelector('strong').textContent === name).click(); await pause();
        assert(document.querySelector('.home-model-trigger strong').textContent === name, 'Model selection ' + name);
      }
      click('.home-model-trigger'); await pause();
      const textarea = document.querySelector('.home-dashboard textarea');
      await fill('.home-dashboard textarea', '制作一个平台跳跃游戏');
      assert(!document.querySelector('.home-create-button').disabled, 'Unauthenticated submit should guide setup');
      const key = (options) => textarea.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true, cancelable:true, ...options}));
      key({shiftKey:true}); await pause();
      assert(!document.querySelector('.settings-modal'), 'Shift Enter should not submit');
      key({isComposing:true}); await pause();
      assert(!document.querySelector('.settings-modal'), 'IME Enter should not submit');
      key({keyCode:229}); await pause();
      assert(!document.querySelector('.settings-modal'), 'IME legacy keycode should not submit');
      key({}); await pause();
      assert(document.querySelector('.settings-modal'), 'Enter should open login');
      assert(document.querySelector('.settings-nav [aria-current="page"]').textContent.includes('Codex 账户'), 'Login category');
      click('.settings-modal [aria-label="关闭"]'); await pause();
      assert(textarea.value === '制作一个平台跳跃游戏', 'Prompt retained');
      click('.home-loop-status'); await pause();
      assert(document.querySelector('.settings-modal'), 'Status setup action');
      await category('媒体 API');
      await fill('.provider-endpoint input', 'https://draft.invalid/v1');
      await fill('.provider-key input', 'draft-only-never-saved');
      await category('Codex 账户'); await category('媒体 API');
      assert(document.querySelector('.provider-endpoint input').value === 'https://draft.invalid/v1', 'Endpoint draft retained');
      assert(document.querySelector('.provider-key input').value === 'draft-only-never-saved', 'Key draft retained');
      let confirmations = 0;
      window.confirm = () => { confirmations++; return false; };
      click('.settings-modal [aria-label="关闭"]'); await pause();
      assert(confirmations === 1 && document.querySelector('.settings-modal'), 'Cancel close preserves edits');
      assert(document.querySelector('.provider-endpoint input').value === 'https://draft.invalid/v1', 'Cancel retains endpoint');
      window.confirm = () => true;
      click('.settings-modal [aria-label="关闭"]'); await pause();
      assert(!document.querySelector('.settings-modal'), 'Discard closes settings');
      click('.home-loop-status'); await pause(); await category('媒体 API');
      assert(document.querySelector('.provider-endpoint input').value !== 'https://draft.invalid/v1', 'Discard must not persist draft');
      click('.settings-modal [aria-label="关闭"]'); await pause();
      await fill('.home-dashboard textarea', '');
      return { passed: ['eight model options', 'model selection', 'engine reminder removed', 'branding', 'login guidance', 'prompt retained', 'setup action', 'Enter send', 'Shift Enter', 'IME Enter', 'media draft navigation', 'close cancel', 'explicit discard'] };
    })()`, true);
    console.log(JSON.stringify(result));
    await writeFile('/tmp/ideatogame-verified.png', (await win.webContents.capturePage()).toPNG());
    clearTimeout(timeout);
    app.quit();
    await rm(profile, { recursive: true, force: true });
  } catch (error) {
    console.error(error); clearTimeout(timeout); app.exit(1);
  }
})();
