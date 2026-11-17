import { application, Color } from '../../src/neptune.js';
import { Storage } from '../../src/core/storage.js';
const prefix = 'neptune.emberfall.adventure';
const settingsKey = `${prefix}.settings`;
const readSettings = () => { try { const s = JSON.parse(localStorage.getItem(settingsKey) || '{}'); return { music: Number.isFinite(s.music) ? Math.max(0, Math.min(1, s.music)) : .28, sfx: Number.isFinite(s.sfx) ? Math.max(0, Math.min(1, s.sfx)) : .7 }; } catch { return { music: .28, sfx: .7 }; } };
const settings = readSettings();
const title = document.querySelector('#title');
const continueButton = document.querySelector('#continue');
const pauseMenu = document.querySelector('#pause-menu');
const savedRecord = () => { try { return localStorage.getItem(`${prefix}.slot-1`); } catch { return null; } };
continueButton.disabled = !savedRecord();
document.querySelector('#music-volume').value = settings.music;
document.querySelector('#sfx-volume').value = settings.sfx;
document.querySelector('#settings').onclick = () => { const panel = document.querySelector('#settings-panel'); panel.hidden = !panel.hidden; };
for (const [id, key] of [['music-volume', 'music'], ['sfx-volume', 'sfx']]) document.querySelector(`#${id}`).oninput = event => { settings[key] = Number(event.target.value); localStorage.setItem(settingsKey, JSON.stringify(settings)); window.dispatchEvent(new CustomEvent('emberfall:volume', { detail: settings })); };
let started = false;
async function begin(continueRun = false, classic = false) {
  if (started) return;
  started = true;
  try {
    const project = await (await fetch('./project.npt')).json();
    Storage.DeserializeProject(project);
    application.clearColor = Color.FromHex(0x14221f);
    if (continueRun) sessionStorage.setItem(`${prefix}.continue`, '1');
    await application.loadScene(classic ? project.scenes?.[0]?.path || './scenes/ruins.scene' : './scenes/adventure.scene');
    title.hidden = true;
    document.querySelector('#neptune-play')?.remove();
    application.start();
    document.querySelector('#neptune-canvas')?.focus();
  } catch (error) { started = false; const p = document.querySelector('.intro'); p.textContent = `The path could not be opened: ${error.message}`; }
}
document.querySelector('#new-game').onclick = () => { localStorage.removeItem(`${prefix}.slot-1`); begin(false); };
continueButton.onclick = () => begin(true);
document.querySelector('#classic').onclick = () => begin(false, true);
document.querySelector('#neptune-play')?.remove();
document.querySelector('#resume').onclick = () => { pauseMenu.hidden = true; window.dispatchEvent(new Event('emberfall:resume')); };
document.querySelector('#save').onclick = () => window.dispatchEvent(new Event('emberfall:save'));
document.querySelector('#title-button').onclick = () => { location.reload(); };
window.addEventListener('emberfall:pause', () => { pauseMenu.hidden = false; });
