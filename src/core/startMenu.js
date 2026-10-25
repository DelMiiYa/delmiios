/**
 * Start Menu Component for DelMiiOS
 * =================================
 * Features:
 * - User profile header with derived initials, name, role, and online indicator
 * - Live search filter input (#start-search-input) for applications
 * - Filtered application list with app icons, titles, and descriptions
 * - System control buttons: Restart and Sleep / Off
 * - Sleep / Suspend overlay toggle with click-to-wake support
 */

import { profile, getAvatarInitials } from '../data/profile.js';
import { icons } from './icons.js';
import { sound } from './sound.js';

export class StartMenu {
  /**
   * @param {HTMLElement} container
   * @param {import('./windowManager.js').WindowManager} windowManager
   * @param {() => void} [onRestart]
   */
  constructor(container, windowManager, onRestart) {
    this.container = container;
    this.windowManager = windowManager;
    this.onRestart = onRestart || (() => {});
    this.isOpen = false;
    this.searchQuery = '';

    this.element = this.render();
    this.container.appendChild(this.element);

    this.initEvents();
    this.initWakeHandler();
  }

  render() {
    const menu = document.createElement('nav');
    menu.className = 'start-menu';
    menu.id = 'os-start-menu';
    menu.setAttribute('aria-label', 'Start Menu');
    menu.hidden = true;

    const initials = getAvatarInitials(profile.name);

    menu.innerHTML = `
      <div class="start-menu-header">
        <div class="start-menu-avatar" aria-hidden="true">${initials}</div>
        <div class="start-menu-user">
          <div class="start-menu-username">${profile.name}</div>
          <div class="start-menu-role">${profile.role}</div>
          <div class="start-menu-status">
            <span class="status-dot" aria-hidden="true"></span>
            <span>Online &bull; Guest Session</span>
          </div>
        </div>
      </div>

      <div class="start-menu-search">
        <span class="start-menu-search-icon" aria-hidden="true">${icons.search}</span>
        <input
          type="text"
          id="start-search-input"
          class="start-search-input"
          placeholder="Type to search apps..."
          aria-label="Search applications"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      <div class="start-menu-section-label">Applications</div>
      <div class="start-menu-list" id="start-menu-list" role="list"></div>

      <div class="start-menu-footer">
        <div class="start-menu-footer-left">
          <span class="start-menu-os-tag">${profile.system.osName}</span>
        </div>
        <div class="start-menu-footer-actions">
          <button type="button" class="start-footer-btn restart-btn" id="start-restart-btn" title="Restart System" aria-label="Restart System">
            <span class="start-footer-icon" aria-hidden="true">${icons.restart}</span>
            <span>Restart</span>
          </button>
          <button type="button" class="start-footer-btn sleep-btn" id="start-sleep-btn" title="Sleep / Power Off" aria-label="Sleep or Suspend System">
            <span class="start-footer-icon" aria-hidden="true">${icons.power}</span>
            <span>Sleep / Off</span>
          </button>
        </div>
      </div>
    `;

    return menu;
  }

  initEvents() {
    this.searchInput = this.element.querySelector('#start-search-input');
    this.appsListEl = this.element.querySelector('#start-menu-list');
    this.restartBtn = this.element.querySelector('#start-restart-btn');
    this.sleepBtn = this.element.querySelector('#start-sleep-btn');

    // Live search input filtering
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderApps();
      });
    }

    // Restart button
    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.close();
        if (typeof this.onRestart === 'function') {
          this.onRestart();
        }
      });
    }

    // Sleep button
    if (this.sleepBtn) {
      this.sleepBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.close();
        this.suspendSystem();
      });
    }

    // Close on outside pointer click
    this.outsidePointerHandler = (e) => {
      if (!this.isOpen) return;
      const startBtn = document.getElementById('taskbar-start-btn');
      if (!this.element.contains(e.target) && (!startBtn || !startBtn.contains(e.target))) {
        this.close();
      }
    };
    document.addEventListener('pointerdown', this.outsidePointerHandler);

    // Close on Escape key
    this.escapeKeyHandler = (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', this.escapeKeyHandler);
  }

  initWakeHandler() {
    const overlay = document.getElementById('shutdown-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.wakeSystem();
      });
    }
  }

  suspendSystem() {
    const overlay = document.getElementById('shutdown-overlay');
    if (overlay) {
      overlay.classList.add('active');
    }
    const powerLed = document.getElementById('crt-power-led');
    if (powerLed) {
      powerLed.classList.add('crt-power-led--sleeping');
    }
  }

  wakeSystem() {
    const overlay = document.getElementById('shutdown-overlay');
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      sound.playStartup();
    }
    const powerLed = document.getElementById('crt-power-led');
    if (powerLed) {
      powerLed.classList.remove('crt-power-led--sleeping');
    }
  }

  renderApps() {
    if (!this.appsListEl) return;
    this.appsListEl.innerHTML = '';

    const registered = this.windowManager.getRegisteredApps();
    const query = this.searchQuery;

    const filtered = registered.filter((app) => {
      if (!query) return true;
      const titleMatch = (app.title || '').toLowerCase().includes(query);
      const descMatch = (app.description || '').toLowerCase().includes(query);
      return titleMatch || descMatch;
    });

    if (filtered.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'start-menu-empty';
      emptyItem.textContent = query
        ? 'No applications match your search.'
        : 'No applications installed.';
      this.appsListEl.appendChild(emptyItem);
      return;
    }

    filtered.forEach((app) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'start-menu-item';
      btn.dataset.appId = app.id;
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', `Launch ${app.title}`);

      btn.innerHTML = `
        <span class="start-menu-item-icon" aria-hidden="true">${app.icon || ''}</span>
        <span class="start-menu-item-info">
          <span class="start-menu-item-title">${app.desktopLabel || app.title}</span>
          <span class="start-menu-item-desc">${app.description || ''}</span>
        </span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        this.close();
        this.windowManager.openApp(app.id);
      });

      this.appsListEl.appendChild(btn);
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.element.hidden = false;
    this.element.classList.add('start-menu--open');

    const startBtn = document.getElementById('taskbar-start-btn');
    if (startBtn) {
      startBtn.setAttribute('aria-expanded', 'true');
      startBtn.classList.add('taskbar-start-btn--active');
    }

    this.renderApps();

    if (this.searchInput) {
      this.searchInput.value = '';
      this.searchQuery = '';
      setTimeout(() => {
        this.searchInput.focus();
      }, 50);
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.element.classList.remove('start-menu--open');
    this.element.hidden = true;

    const startBtn = document.getElementById('taskbar-start-btn');
    if (startBtn) {
      startBtn.setAttribute('aria-expanded', 'false');
      startBtn.classList.remove('taskbar-start-btn--active');
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  destroy() {
    document.removeEventListener('pointerdown', this.outsidePointerHandler);
    window.removeEventListener('keydown', this.escapeKeyHandler);
    this.element.remove();
  }
}
