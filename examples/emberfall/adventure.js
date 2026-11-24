import { application, Color } from '../../src/neptune.js';
import { Storage } from '../../src/core/storage.js';
import { installUINavigation } from '../../src/ui/bridge.js';

const prefix = 'neptune.emberfall.adventure';
const settingsKey = `${prefix}.settings`;

const readSettings = () => {
  try {
    const s = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    return {
      music: Number.isFinite(s.music) ? Math.max(0, Math.min(1, s.music)) : 0.28,
      sfx: Number.isFinite(s.sfx) ? Math.max(0, Math.min(1, s.sfx)) : 0.7
    };
  } catch {
    return { music: 0.28, sfx: 0.7 };
  }
};

const settings = readSettings();
const title = document.querySelector('#title');
const pauseMenu = document.querySelector('#pause-menu');
const continueButton = document.querySelector('#continue');
const settingsPanel = document.querySelector('#settings-panel');

// Audio feedback on UI actions
let uiAudioCtx = null;
const playUiTone = (freq, duration = 0.08) => {
  try {
    if (!uiAudioCtx) uiAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (uiAudioCtx.state === 'suspended') uiAudioCtx.resume();
    const osc = uiAudioCtx.createOscillator();
    const gain = uiAudioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, uiAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.08 * (settings.sfx ?? 0.7), uiAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, uiAudioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(uiAudioCtx.destination);
    osc.start();
    osc.stop(uiAudioCtx.currentTime + duration);
  } catch {}
};

// Check for previous error
const saveError = sessionStorage.getItem(`${prefix}.save-error`);
if (saveError) {
  const intro = document.querySelector('.intro');
  if (intro) intro.textContent = `Continue failed: ${saveError} Your save was kept; choose Begin journey to start over.`;
  sessionStorage.removeItem(`${prefix}.save-error`);
}

window.addEventListener('emberfall:invalid-save', event => {
  sessionStorage.setItem(`${prefix}.save-error`, event.detail);
  location.reload();
});

const savedRecord = () => {
  try {
    return localStorage.getItem(`${prefix}.slot-1`);
  } catch {
    return null;
  }
};

continueButton.disabled = !savedRecord();
document.querySelector('#music-volume').value = settings.music;
document.querySelector('#sfx-volume').value = settings.sfx;

document.querySelector('#settings').onclick = () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  playUiTone(440);
};

for (const [id, key] of [['music-volume', 'music'], ['sfx-volume', 'sfx']]) {
  document.querySelector(`#${id}`).oninput = event => {
    settings[key] = Number(event.target.value);
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('emberfall:volume', { detail: settings }));
    if (key === 'sfx') playUiTone(520);
  };
}

// Keyboard navigation on button lists using engine's installUINavigation
try {
  const titleActions = document.querySelector('#title .actions');
  if (titleActions) {
    installUINavigation(titleActions, {
      onNavigate: () => playUiTone(360, 0.04),
      onActivate: ({ element }) => element.click()
    });
  }
  const pauseActions = document.querySelector('#pause-menu .actions');
  if (pauseActions) {
    installUINavigation(pauseActions, {
      onNavigate: () => playUiTone(360, 0.04),
      onActivate: ({ element }) => element.click()
    });
  }
} catch {}

// Background ambient embers on title screen
const emberCanvas = document.querySelector('#ember-bg-canvas');
if (emberCanvas) {
  const ctx = emberCanvas.getContext('2d');
  const resizeCanvas = () => {
    emberCanvas.width = window.innerWidth;
    emberCanvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = Array.from({ length: 45 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 2.5 + 1,
    speedY: Math.random() * 0.8 + 0.3,
    speedX: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    hue: Math.random() * 30 + 25 // 25 to 55: amber/gold
  }));

  const animateEmbers = () => {
    if (!title.hidden || !pauseMenu.hidden) {
      ctx.clearRect(0, 0, emberCanvas.width, emberCanvas.height);
      for (const p of particles) {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = emberCanvas.height + 10;
          p.x = Math.random() * emberCanvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
        ctx.fill();
      }
    }
    requestAnimationFrame(animateEmbers);
  };
  requestAnimationFrame(animateEmbers);
}

let started = false;
async function begin(continueRun = false, classic = false) {
  if (started) return;
  started = true;
  playUiTone(587, 0.12);
  try {
    const project = await (await fetch('./project.npt')).json();
    Storage.DeserializeProject(project);
    application.clearColor = Color.FromHex(0x111c1a);
    if (continueRun) sessionStorage.setItem(`${prefix}.continue`, '1');
    if (classic) {
      await application.loadScene(project.scenes?.[0]?.path || './scenes/ruins.scene');
    } else {
      const scenePath = new URLSearchParams(location.search).has('practice')
        ? './scenes/adventure.scene'
        : './scenes/expedition.scene';
      const scene = await (await fetch(scenePath)).json();
      for (const actor of scene.entities) {
        for (const component of actor.components || []) {
          if (component.type === 'Sprite' && component.props.path?.startsWith('/assets/')) {
            component.props.path = new URL(component.props.path.slice(1), location.href).href;
          }
        }
      }
      await application.loadScene(scene);
    }
    title.hidden = true;
    document.querySelector('#neptune-play')?.remove();
    application.start();
    document.querySelector('#neptune-canvas')?.focus();
  } catch (error) {
    started = false;
    const p = document.querySelector('.intro');
    if (p) p.textContent = `The path could not be opened: ${error.message}`;
  }
}

document.querySelector('#new-game').onclick = () => {
  localStorage.removeItem(`${prefix}.slot-1`);
  begin(false);
};

continueButton.onclick = () => begin(true);
document.querySelector('#classic').onclick = () => begin(false, true);
document.querySelector('#neptune-play')?.remove();

document.querySelector('#resume').onclick = () => {
  pauseMenu.hidden = true;
  playUiTone(440);
  window.dispatchEvent(new Event('emberfall:resume'));
};

document.querySelector('#save').onclick = () => {
  playUiTone(660);
  window.dispatchEvent(new Event('emberfall:save'));
};

document.querySelector('#title-button').onclick = () => {
  location.reload();
};

window.addEventListener('emberfall:pause', () => {
  pauseMenu.hidden = false;
});
