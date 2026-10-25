/**
 * Desktop Icon Grid Component for DelMiiOS
 * ========================================
 * Generates interactive application shortcut icons from the windowManager registry.
 * - Single-click selects on desktop mouse environments
 * - Double-click opens on desktop
 * - Single-tap opens on touch screens or mobile viewports (<= 768px)
 * - Enter / Space opens via keyboard navigation
 * - Clicking the desktop wallpaper clears icon selection
 */

import { sound } from './sound.js';

/**
 * Creates and mounts desktop application icons inside the provided container.
 * @param {HTMLElement} container
 * @param {import('./windowManager.js').WindowManager} windowManager
 * @returns {{ refresh: () => void, cleanup: () => void }}
 */
export function createDesktopIcons(container, windowManager) {
  if (!container || !windowManager) {
    return { refresh: () => {}, cleanup: () => {} };
  }

  const grid = document.createElement('div');
  grid.className = 'desktop-icons';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'Desktop Applications');

  let selectedAppId = null;

  function selectIcon(appId) {
    selectedAppId = appId;
    const allButtons = grid.querySelectorAll('.desktop-icon');
    allButtons.forEach((btn) => {
      const isSelected = btn.dataset.appId === appId;
      btn.classList.toggle('desktop-icon--selected', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function renderIcons() {
    grid.innerHTML = '';
    const apps = windowManager.getRegisteredApps();

    apps.forEach((app) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'desktop-icon';
      item.dataset.appId = app.id;
      item.setAttribute('role', 'listitem');
      item.setAttribute('aria-label', `Open ${app.desktopLabel || app.title}`);
      item.setAttribute('aria-selected', 'false');

      item.innerHTML = `
        <span class="desktop-icon-graphic" aria-hidden="true">${app.icon || ''}</span>
        <span class="desktop-icon-label">${app.desktopLabel || app.title}</span>
      `;

      // Pointer interaction
      item.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        const isMobileOrTouch =
          e.pointerType === 'touch' ||
          (typeof window !== 'undefined' && window.innerWidth <= 768);

        if (isMobileOrTouch) {
          selectIcon(app.id);
          windowManager.openApp(app.id);
        } else {
          sound.playClick();
          selectIcon(app.id);
        }
      });

      // Desktop double-click
      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        windowManager.openApp(app.id);
      });

      // Keyboard support
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectIcon(app.id);
          windowManager.openApp(app.id);
        }
      });

      grid.appendChild(item);
    });
  }

  // Clear selection when clicking empty desktop area
  const handleContainerClick = (e) => {
    if (e.target === container || e.target === grid || e.target.classList.contains('os-desktop-layer')) {
      if (selectedAppId !== null) {
        selectIcon(null);
      }
    }
  };

  container.addEventListener('pointerdown', handleContainerClick);
  container.appendChild(grid);

  renderIcons();

  return {
    refresh() {
      renderIcons();
    },
    cleanup() {
      container.removeEventListener('pointerdown', handleContainerClick);
      grid.remove();
    }
  };
}
