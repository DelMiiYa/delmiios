/**
 * Taskbar Component for DelMiiOS
 * ==============================
 * Anchors the bottom OS chrome:
 * - Start Menu trigger button
 * - Running application tabs with active/minimized visual states
 * - System Tray with CRT Quick Toggle, Sound Mute Toggle, and 2-line live clock
 * - Cleanup function that disposes listeners and clock interval
 */

import { icons } from './icons.js';
import { sound } from './sound.js';
import { settingsStore } from './settings.js';

/**
 * Creates and mounts the system taskbar inside container.
 * @param {HTMLElement} container
 * @param {import('./windowManager.js').WindowManager} windowManager
 * @param {import('./startMenu.js').StartMenu} startMenu
 * @returns {{ cleanup: () => void }}
 */
export function createTaskbar(container, windowManager, startMenu) {
  const bar = document.createElement('footer');
  bar.className = 'taskbar';
  bar.id = 'taskbar';
  bar.setAttribute('role', 'contentinfo');
  bar.setAttribute('aria-label', 'Taskbar');

  bar.innerHTML = `
    <div class="taskbar-left">
      <button
        type="button"
        class="taskbar-start-btn"
        id="taskbar-start-btn"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="os-start-menu"
        title="Start Menu"
      >
        <span class="taskbar-start-icon" aria-hidden="true">${icons.logo}</span>
        <span class="taskbar-start-label">Start</span>
      </button>
    </div>

    <div class="taskbar-windows" id="taskbar-windows" role="toolbar" aria-label="Running Applications"></div>

    <div class="taskbar-tray">
      <button
        type="button"
        class="taskbar-tray-btn taskbar-tray-btn--crt"
        id="taskbar-crt-toggle"
        aria-label="Toggle CRT Visuals"
        title="CRT Effects"
      >
        <span class="taskbar-tray-icon" aria-hidden="true">${icons.crt}</span>
      </button>

      <button
        type="button"
        class="taskbar-tray-btn taskbar-tray-btn--sound"
        id="taskbar-sound-toggle"
        aria-label="Toggle Sound"
        title="Sound"
      >
        <span class="taskbar-tray-icon" id="taskbar-sound-icon" aria-hidden="true">${icons.soundOn}</span>
      </button>

      <div class="taskbar-clock" id="taskbar-clock" aria-live="off" title="System Clock">
        <span class="taskbar-clock-time" id="taskbar-clock-time">--:--</span>
        <span class="taskbar-clock-date" id="taskbar-clock-date">---</span>
      </div>
    </div>
  `;

  container.appendChild(bar);

  const startBtn = bar.querySelector('#taskbar-start-btn');
  const windowsContainer = bar.querySelector('#taskbar-windows');
  const crtToggleBtn = bar.querySelector('#taskbar-crt-toggle');
  const soundToggleBtn = bar.querySelector('#taskbar-sound-toggle');
  const soundIconSpan = bar.querySelector('#taskbar-sound-icon');
  const clockTime = bar.querySelector('#taskbar-clock-time');
  const clockDate = bar.querySelector('#taskbar-clock-date');

  // Start menu button listener
  const handleStartClick = (e) => {
    e.stopPropagation();
    sound.playClick();
    if (startMenu) {
      startMenu.toggle();
    }
  };
  startBtn.addEventListener('click', handleStartClick);

  // Sync tray buttons with settingsStore
  function syncTrayState(state) {
    const isCrtOn = Boolean(state.crtScanlines || state.crtFrame);
    crtToggleBtn.classList.toggle('taskbar-tray-btn--active', isCrtOn);
    crtToggleBtn.setAttribute(
      'title',
      isCrtOn ? 'CRT Effects: Enabled (Click to Disable)' : 'CRT Effects: Disabled (Click to Enable)'
    );
    crtToggleBtn.setAttribute(
      'aria-label',
      isCrtOn ? 'CRT Effects: Enabled (Click to Disable)' : 'CRT Effects: Disabled (Click to Enable)'
    );

    const isSoundOn = Boolean(state.soundEnabled);
    soundToggleBtn.classList.toggle('taskbar-tray-btn--active', isSoundOn);
    soundToggleBtn.setAttribute(
      'title',
      isSoundOn ? 'Sound: Enabled (Click to Mute)' : 'Sound: Muted (Click to Enable)'
    );
    soundToggleBtn.setAttribute(
      'aria-label',
      isSoundOn ? 'Sound: Enabled (Click to Mute)' : 'Sound: Muted (Click to Enable)'
    );
    soundIconSpan.innerHTML = isSoundOn ? icons.soundOn : icons.soundOff;
  }

  syncTrayState(settingsStore.getState());
  const unsubSettings = settingsStore.subscribe(syncTrayState);

  // Tray toggle handlers
  const handleCrtClick = (e) => {
    e.stopPropagation();
    sound.playClick();
    settingsStore.toggleCrtMaster();
  };
  crtToggleBtn.addEventListener('click', handleCrtClick);

  const handleSoundClick = (e) => {
    e.stopPropagation();
    const next = !settingsStore.getState().soundEnabled;
    settingsStore.setSound(next);
    if (next) {
      sound.playClick();
    }
  };
  soundToggleBtn.addEventListener('click', handleSoundClick);

  // Render running window buttons
  function renderRunningWindows({ openWindows, activeAppId }) {
    if (!windowsContainer) return;
    windowsContainer.innerHTML = '';

    openWindows.forEach((win) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isFocused = win.id === activeAppId && !win.minimized;
      btn.className = `taskbar-win-btn ${isFocused ? 'taskbar-win-btn--active' : ''} ${
        win.minimized ? 'taskbar-win-btn--minimized' : ''
      }`;
      btn.setAttribute('aria-label', `${win.title} window`);
      btn.setAttribute('aria-pressed', isFocused ? 'true' : 'false');

      btn.innerHTML = `
        <span class="taskbar-win-icon" aria-hidden="true">${win.icon || ''}</span>
        <span class="taskbar-win-title">${win.shortTitle || win.title}</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (startMenu) {
          startMenu.close();
        }
        windowManager.toggleTaskbarWindow(win.id);
      });

      windowsContainer.appendChild(btn);
    });
  }

  const unsubWM = windowManager.subscribe(renderRunningWindows);
  renderRunningWindows({
    openWindows: windowManager.getOpenWindows(),
    activeAppId: windowManager.getActiveAppId()
  });

  // Live 2-line clock
  function updateClock() {
    const now = new Date();
    if (clockTime) {
      clockTime.textContent = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    if (clockDate) {
      clockDate.textContent = now.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      });
    }
  }

  updateClock();
  const clockInterval = setInterval(updateClock, 1000);

  return {
    cleanup() {
      clearInterval(clockInterval);
      unsubSettings();
      unsubWM();
      startBtn.removeEventListener('click', handleStartClick);
      crtToggleBtn.removeEventListener('click', handleCrtClick);
      soundToggleBtn.removeEventListener('click', handleSoundClick);
      bar.remove();
    }
  };
}
