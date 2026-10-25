import './style.css';
import { profile } from './data/profile.js';
import { icons } from './core/icons.js';
import { settingsStore } from './core/settings.js';
import { sound } from './core/sound.js';
import { WindowManager } from './core/windowManager.js';
import { createDesktopIcons } from './core/desktop.js';
import { StartMenu } from './core/startMenu.js';
import { createTaskbar } from './core/taskbar.js';
import { runBootSequence } from './core/boot.js';

// Set system page title
document.title = `${profile.name} — ${profile.system.osName}`;

const appRoot = document.getElementById('app');

function initOS() {
  if (!appRoot) return;

  // Render CRT monitor frame & inner screen shell
  appRoot.innerHTML = `
    <div id="crt-monitor" class="crt-monitor">
      <div id="crt-screen" class="crt-screen">
        <main class="os-desktop" id="os-desktop" aria-label="Simulated Desktop Environment">
          <div class="os-wallpaper-layer" aria-hidden="true"></div>
          <div class="os-desktop-layer" id="os-desktop-layer"></div>
          <div class="os-window-layer" id="os-window-layer"></div>
        </main>

        <!-- Sleep / Suspend Overlay -->
        <div id="shutdown-overlay" class="shutdown-overlay" role="dialog" aria-modal="true" aria-label="System is asleep">
          <div class="shutdown-content">
            <div class="shutdown-icon" aria-hidden="true">${icons.power}</div>
            <div class="shutdown-title">System Suspended</div>
            <div class="shutdown-desc">Click anywhere or press the PWR button to wake</div>
          </div>
        </div>

        <!-- CRT Non-Interactive Visual Overlays -->
        <div class="crt-overlay-scanlines" aria-hidden="true"></div>
        <div class="crt-overlay-vignette" aria-hidden="true"></div>
        <div class="crt-overlay-flicker" aria-hidden="true"></div>
        <div class="crt-power-anim" id="crt-power-anim" aria-hidden="true"></div>
      </div>

      <!-- CRT Bottom Chin (Brand Badge + Power LED Button) -->
      <div class="crt-bezel-chin">
        <div class="crt-brand-badge" id="crt-brand-badge">
          <span class="crt-brand-led-dot" aria-hidden="true"></span>
          <span class="crt-brand-text">${profile.system.osName}</span>
        </div>
        <button type="button" class="crt-power-btn" id="crt-power-btn" aria-label="Toggle Monitor Power or Wake" title="Monitor Power">
          <span class="crt-power-led" id="crt-power-led"></span>
          <span class="crt-power-label">PWR</span>
        </button>
      </div>
    </div>
  `;

  const screenEl = appRoot.querySelector('#crt-screen');
  const desktopEl = appRoot.querySelector('#os-desktop');
  const desktopLayer = appRoot.querySelector('#os-desktop-layer');
  const windowLayer = appRoot.querySelector('#os-window-layer');
  const powerBtn = appRoot.querySelector('#crt-power-btn');
  const shutdownOverlay = appRoot.querySelector('#shutdown-overlay');

  // Initialize unified settings and apply theme / CRT classes
  settingsStore.apply();

  // Instantiate Window Manager
  const windowManager = new WindowManager(windowLayer);

  // Restart Handler: replays boot sequence and restores desktop session
  const handleRestart = () => {
    windowManager.closeAllWindows();
    runBootSequence(screenEl, () => {
      if (windowManager.appsRegistry.has('about')) {
        windowManager.openApp('about');
      }
    });
  };

  // Instantiate Start Menu & Taskbar inside #crt-screen
  const startMenu = new StartMenu(screenEl, windowManager, handleRestart);
  createTaskbar(screenEl, windowManager, startMenu);

  // Initialize Desktop Shortcut Icons grid
  createDesktopIcons(desktopLayer, windowManager);

  // Wire Chin Power Button (PWR): toggles monitor sleep / wake
  if (powerBtn) {
    powerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (shutdownOverlay && shutdownOverlay.classList.contains('active')) {
        startMenu.wakeSystem();
      } else {
        sound.playClick();
        startMenu.suspendSystem();
      }
    });
  }

  // Wake on shutdown overlay click
  if (shutdownOverlay) {
    shutdownOverlay.addEventListener('click', () => {
      startMenu.wakeSystem();
    });
  }

  // Run initial boot sequence inside the CRT screen
  runBootSequence(screenEl, () => {
    // If the 'about' app is registered (in M2), automatically launch it
    if (windowManager.appsRegistry.has('about')) {
      windowManager.openApp('about');
    }
  });
}

// Bootstrap on DOMContentLoaded or immediately if already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOS);
} else {
  initOS();
}
