/**
 * Window Manager for DelMiiOS
 * ===========================
 * Registry-based window compositor and manager.
 * Supports pointer-capture dragging, bounds clamping within #crt-screen,
 * cross-app payload delivery, mobile auto-maximization, and subscribe/notify state pattern.
 */

import { sound } from './sound.js';

/**
 * Clamps window coordinates within container bounds.
 * Allows partial left overhang down to minVisibleWidth, but keeps the titlebar visible vertically.
 * @param {Object} params
 * @param {number} params.left
 * @param {number} params.top
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.boundsWidth
 * @param {number} params.boundsHeight
 * @param {number} [params.minVisibleWidth=120]
 * @param {number} [params.minTop=0]
 * @returns {{ left: number, top: number }}
 */
export function clampWindowPosition({
  left,
  top,
  width,
  height,
  boundsWidth,
  boundsHeight,
  minVisibleWidth = 120,
  minTop = 0
}) {
  const minX = Math.min(0, -width + minVisibleWidth);
  const maxX = Math.max(0, boundsWidth - minVisibleWidth);
  const maxY = Math.max(minTop, boundsHeight - 42);

  const clampedX = Math.min(Math.max(minX, left), maxX);
  const clampedY = Math.min(Math.max(minTop, top), maxY);

  return {
    left: Math.round(clampedX),
    top: Math.round(clampedY)
  };
}

/**
 * Computes cascaded initial window position within bounds.
 * @param {Object} params
 * @param {number} params.index
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.boundsWidth
 * @param {number} params.boundsHeight
 * @returns {{ left: number, top: number }}
 */
export function computeCascadePosition({ index, width, height, boundsWidth, boundsHeight }) {
  const offset = (index % 5) * 28;
  const initialLeft = 32 + offset;
  const initialTop = 28 + offset;

  const maxLeft = Math.max(0, boundsWidth - width);
  const maxTop = Math.max(0, boundsHeight - height - 42);

  const left = Math.max(0, Math.min(initialLeft, maxLeft));
  const top = Math.max(0, Math.min(initialTop, maxTop));

  return {
    left: Math.round(left),
    top: Math.round(top)
  };
}

export class WindowManager {
  constructor(windowLayerEl) {
    this.container = windowLayerEl;
    this.appsRegistry = new Map(); // appId -> appDefinition
    this.windows = new Map(); // appId -> winState
    this.listeners = new Set();
    this.topZIndex = 20;
    this.activeAppId = null;
    this.openCascadeIndex = 0;

    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.handleViewportResize();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  getBounds() {
    const width =
      this.container && this.container.clientWidth > 0
        ? this.container.clientWidth
        : typeof window !== 'undefined'
          ? window.innerWidth
          : 1024;

    const height =
      this.container && this.container.clientHeight > 0
        ? this.container.clientHeight
        : typeof window !== 'undefined'
          ? Math.max(200, window.innerHeight - 50)
          : 768;

    return { width, height };
  }

  isMobileViewport() {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  registerApp(appDef) {
    if (appDef && appDef.id) {
      this.appsRegistry.set(appDef.id, appDef);
    }
  }

  getRegisteredApps() {
    return Array.from(this.appsRegistry.values());
  }

  getOpenWindows() {
    return Array.from(this.windows.values());
  }

  getActiveAppId() {
    return this.activeAppId;
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      return () => this.listeners.delete(callback);
    }
    return () => {};
  }

  notify() {
    const state = {
      openWindows: this.getOpenWindows(),
      activeAppId: this.activeAppId
    };
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch {
        // Prevent listener error from stopping notification cycle
      }
    });
  }

  openApp(appId, payload) {
    const appDef = this.appsRegistry.get(appId);
    if (!appDef) return null;

    // If window already open, restore if minimized, focus, and route payload
    if (this.windows.has(appId)) {
      const existing = this.windows.get(appId);
      if (existing.minimized) {
        this.restoreWindow(appId);
      } else {
        this.focusWindow(appId);
      }

      if (typeof existing.onFocus === 'function') {
        existing.onFocus();
      }

      if (payload !== undefined && typeof existing.onPayload === 'function') {
        existing.onPayload(payload);
      }

      return existing;
    }

    const winEl = document.createElement('section');
    winEl.className = 'os-window os-window--opening';
    winEl.dataset.appId = appId;
    winEl.setAttribute('role', 'dialog');
    winEl.setAttribute('aria-label', appDef.title);
    winEl.tabIndex = -1;

    // Determine initial dimensions & position
    const bounds = this.getBounds();
    const width = Math.min(appDef.defaultWidth || 680, bounds.width);
    const height = Math.min(appDef.defaultHeight || 480, bounds.height);

    const pos = computeCascadePosition({
      index: this.openCascadeIndex,
      width,
      height,
      boundsWidth: bounds.width,
      boundsHeight: bounds.height
    });
    this.openCascadeIndex += 1;

    winEl.style.width = `${width}px`;
    winEl.style.height = `${height}px`;
    winEl.style.left = `${pos.left}px`;
    winEl.style.top = `${pos.top}px`;

    winEl.innerHTML = `
      <header class="os-window-titlebar" data-drag-handle="true">
        <div class="os-window-title-group">
          <span class="os-window-icon">${appDef.icon || ''}</span>
          <h2 class="os-window-title">${appDef.title}</h2>
        </div>
        <div class="os-window-controls">
          <button type="button" class="win-btn win-btn--minimize" data-action="minimize" aria-label="Minimize ${appDef.title}" title="Minimize">
            <span aria-hidden="true">&#8211;</span>
          </button>
          <button type="button" class="win-btn win-btn--maximize" data-action="maximize" aria-label="Maximize or Restore ${appDef.title}" title="Maximize / Restore">
            <span aria-hidden="true">&#9633;</span>
          </button>
          <button type="button" class="win-btn win-btn--close" data-action="close" aria-label="Close ${appDef.title}" title="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </header>
      <div class="os-window-body"></div>
    `;

    const bodyEl = winEl.querySelector('.os-window-body');

    // Execute application render with standard ctx contract
    let lifecycle = null;
    if (typeof appDef.render === 'function') {
      lifecycle = appDef.render(bodyEl, {
        windowManager: this,
        openApp: (targetId, nextPayload) => this.openApp(targetId, nextPayload),
        close: () => this.closeWindow(appId),
        payload
      });
    }

    const winState = {
      id: appId,
      title: appDef.title,
      shortTitle: appDef.shortTitle || appDef.title,
      icon: appDef.icon,
      element: winEl,
      minimized: false,
      maximized: false,
      prevRect: {
        left: `${pos.left}px`,
        top: `${pos.top}px`,
        width: `${width}px`,
        height: `${height}px`
      },
      cleanup: lifecycle && typeof lifecycle.cleanup === 'function' ? lifecycle.cleanup : null,
      onFocus: lifecycle && typeof lifecycle.onFocus === 'function' ? lifecycle.onFocus : null,
      onPayload: lifecycle && typeof lifecycle.onPayload === 'function' ? lifecycle.onPayload : null
    };

    this.windows.set(appId, winState);
    if (this.container) {
      this.container.appendChild(winEl);
    }

    // Auto-maximize on mobile viewports
    if (this.isMobileViewport()) {
      this.setMaximized(appId, true);
    }

    this.bindWindowEvents(winState);
    this.focusWindow(appId);
    sound.playOpen();

    // Call onPayload after initial render if provided
    if (payload !== undefined && typeof winState.onPayload === 'function') {
      try {
        winState.onPayload(payload);
      } catch {
        // Ignore payload handler error
      }
    }

    // Remove opening animation class
    setTimeout(() => {
      winEl.classList.remove('os-window--opening');
      if (winState.onFocus) {
        winState.onFocus();
      }
    }, 180);

    return winState;
  }

  bindWindowEvents(winState) {
    const { id, element } = winState;
    const titlebar = element.querySelector('.os-window-titlebar');

    // Focus window on pointerdown anywhere inside
    element.addEventListener('pointerdown', () => {
      this.focusWindow(id);
    });

    // Window control buttons
    const minBtn = element.querySelector('[data-action="minimize"]');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimizeWindow(id);
      });
    }

    const maxBtn = element.querySelector('[data-action="maximize"]');
    if (maxBtn) {
      maxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMaximize(id);
      });
    }

    const closeBtn = element.querySelector('[data-action="close"]');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeWindow(id);
      });
    }

    // Double-click titlebar to toggle maximize
    if (titlebar) {
      titlebar.addEventListener('dblclick', (e) => {
        if (e.target.closest('.os-window-controls')) return;
        this.toggleMaximize(id);
      });

      // Pointer-capture Dragging
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initialLeft = 0;
      let initialTop = 0;

      titlebar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.os-window-controls')) return;
        if (winState.maximized || this.isMobileViewport()) return;
        if (e.button !== 0 && e.pointerType === 'mouse') return;

        isDragging = true;
        this.focusWindow(id);
        element.classList.add('os-window--dragging');

        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;

        if (typeof titlebar.setPointerCapture === 'function') {
          titlebar.setPointerCapture(e.pointerId);
        }
      });

      titlebar.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const bounds = this.getBounds();
        const clamped = clampWindowPosition({
          left: initialLeft + dx,
          top: initialTop + dy,
          width: element.offsetWidth,
          height: element.offsetHeight,
          boundsWidth: bounds.width,
          boundsHeight: bounds.height,
          minVisibleWidth: 120,
          minTop: 0
        });

        element.style.left = `${clamped.left}px`;
        element.style.top = `${clamped.top}px`;
      });

      const stopDragging = (e) => {
        if (!isDragging) return;
        isDragging = false;
        element.classList.remove('os-window--dragging');
        if (
          e.pointerId !== undefined &&
          typeof titlebar.releasePointerCapture === 'function' &&
          titlebar.hasPointerCapture &&
          titlebar.hasPointerCapture(e.pointerId)
        ) {
          titlebar.releasePointerCapture(e.pointerId);
        }
      };

      titlebar.addEventListener('pointerup', stopDragging);
      titlebar.addEventListener('pointercancel', stopDragging);
    }
  }

  focusWindow(appId) {
    const target = this.windows.get(appId);
    if (!target || target.minimized) return;

    this.topZIndex += 1;
    target.element.style.zIndex = String(this.topZIndex);
    this.activeAppId = appId;

    this.windows.forEach((win, id) => {
      win.element.classList.toggle('os-window--focused', id === appId);
    });

    this.notify();
  }

  minimizeWindow(appId) {
    const target = this.windows.get(appId);
    if (!target || target.minimized) return;

    sound.playClick();
    target.minimized = true;
    target.element.classList.add('os-window--minimized');
    target.element.classList.remove('os-window--focused');

    if (this.activeAppId === appId) {
      this.activeAppId = this.findNextTopWindowId();
      if (this.activeAppId) {
        this.focusWindow(this.activeAppId);
      }
    }
    this.notify();
  }

  restoreWindow(appId) {
    const target = this.windows.get(appId);
    if (!target) return;

    sound.playClick();
    target.minimized = false;
    target.element.classList.remove('os-window--minimized');
    this.focusWindow(appId);
    if (typeof target.onFocus === 'function') {
      target.onFocus();
    }
  }

  toggleTaskbarWindow(appId) {
    const target = this.windows.get(appId);
    if (!target) {
      this.openApp(appId);
      return;
    }
    if (target.minimized) {
      this.restoreWindow(appId);
    } else if (this.activeAppId === appId) {
      this.minimizeWindow(appId);
    } else {
      this.focusWindow(appId);
    }
  }

  setMaximized(appId, shouldMaximize) {
    const target = this.windows.get(appId);
    if (!target) return;

    if (shouldMaximize && !target.maximized) {
      target.prevRect = {
        left: target.element.style.left,
        top: target.element.style.top,
        width: target.element.style.width,
        height: target.element.style.height
      };
      target.maximized = true;
      target.element.classList.add('os-window--maximized');
    } else if (!shouldMaximize && target.maximized) {
      target.maximized = false;
      target.element.classList.remove('os-window--maximized');
      target.element.style.left = target.prevRect.left;
      target.element.style.top = target.prevRect.top;
      target.element.style.width = target.prevRect.width;
      target.element.style.height = target.prevRect.height;
    }
    this.focusWindow(appId);
  }

  toggleMaximize(appId) {
    const target = this.windows.get(appId);
    if (!target) return;
    sound.playClick();
    this.setMaximized(appId, !target.maximized);
  }

  closeWindow(appId) {
    const target = this.windows.get(appId);
    if (!target) return;

    sound.playClose();
    if (target.cleanup) {
      try {
        target.cleanup();
      } catch {
        // Prevent cleanup error from halting closure
      }
    }

    target.element.classList.add('os-window--closing');
    this.windows.delete(appId);

    if (this.activeAppId === appId) {
      this.activeAppId = this.findNextTopWindowId();
      if (this.activeAppId) {
        this.focusWindow(this.activeAppId);
      }
    }

    this.notify();

    setTimeout(() => {
      target.element.remove();
    }, 160);
  }

  closeAllWindows() {
    Array.from(this.windows.keys()).forEach((appId) => {
      this.closeWindow(appId);
    });
  }

  findNextTopWindowId() {
    let highestZ = -1;
    let candidateId = null;

    this.windows.forEach((win, id) => {
      if (!win.minimized) {
        const z = parseInt(win.element.style.zIndex || '0', 10);
        if (z > highestZ) {
          highestZ = z;
          candidateId = id;
        }
      }
    });

    return candidateId;
  }

  handleViewportResize() {
    if (this.isMobileViewport()) {
      this.windows.forEach((win, id) => {
        if (!win.maximized) {
          this.setMaximized(id, true);
        }
      });
    }
  }

  destroy() {
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.closeAllWindows();
    this.listeners.clear();
  }
}
