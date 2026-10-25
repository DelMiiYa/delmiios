import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  clampWindowPosition,
  computeCascadePosition,
  WindowManager
} from '../../src/core/windowManager.js';

function createMockElement(tagName = 'div') {
  const classes = new Set();
  const listeners = {};
  const attributes = {};
  const children = [];

  const el = {
    tagName: tagName.toUpperCase(),
    className: '',
    tabIndex: 0,
    dataset: {},
    style: {},
    offsetLeft: 0,
    offsetTop: 0,
    offsetWidth: 600,
    offsetHeight: 400,
    clientWidth: 600,
    clientHeight: 400,
    children,
    parentElement: null,
    classList: {
      add: vi.fn((cls) => {
        classes.add(cls);
        el.className = Array.from(classes).join(' ');
      }),
      remove: vi.fn((cls) => {
        classes.delete(cls);
        el.className = Array.from(classes).join(' ');
      }),
      toggle: vi.fn((cls, force) => {
        const shouldAdd = force === undefined ? !classes.has(cls) : Boolean(force);
        if (shouldAdd) {
          classes.add(cls);
        } else {
          classes.delete(cls);
        }
        el.className = Array.from(classes).join(' ');
        return classes.has(cls);
      }),
      contains: vi.fn((cls) => classes.has(cls))
    },
    setAttribute: vi.fn((k, v) => {
      attributes[k] = String(v);
    }),
    getAttribute: vi.fn((k) => attributes[k] ?? null),
    hasAttribute: vi.fn((k) => k in attributes),
    removeAttribute: vi.fn((k) => {
      delete attributes[k];
    }),
    addEventListener: vi.fn((evt, fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    }),
    removeEventListener: vi.fn((evt, fn) => {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter((h) => h !== fn);
      }
    }),
    dispatchEvent: vi.fn((evt) => {
      const handlers = listeners[evt.type] || [];
      handlers.forEach((h) => h(evt));
    }),
    appendChild: vi.fn((child) => {
      children.push(child);
      child.parentElement = el;
      return child;
    }),
    removeChild: vi.fn((child) => {
      const idx = children.indexOf(child);
      if (idx !== -1) children.splice(idx, 1);
      child.parentElement = null;
      return child;
    }),
    remove: vi.fn(() => {
      if (el.parentElement) {
        el.parentElement.removeChild(el);
      }
    }),
    querySelector: vi.fn((selector) => {
      const sub = createMockElement('div');
      return sub;
    }),
    querySelectorAll: vi.fn(() => []),
    get innerHTML() {
      return '';
    },
    set innerHTML(_val) {}
  };

  return el;
}

describe('WindowManager (src/core/windowManager.js)', () => {
  describe('clampWindowPosition()', () => {
    const defaultBounds = {
      boundsWidth: 1024,
      boundsHeight: 768,
      width: 600,
      height: 400,
      minVisibleWidth: 120,
      minTop: 0
    };

    it('retains valid in-bounds coordinates', () => {
      const pos = clampWindowPosition({
        left: 200,
        top: 150,
        ...defaultBounds
      });
      expect(pos).toEqual({ left: 200, top: 150 });
    });

    it('prevents titlebar from moving above minTop (top = 0)', () => {
      const pos = clampWindowPosition({
        left: 100,
        top: -80,
        ...defaultBounds
      });
      expect(pos.top).toBe(0);
    });

    it('prevents titlebar from moving completely off-screen at the bottom', () => {
      // maxY is boundsHeight - 42 = 768 - 42 = 726
      const pos = clampWindowPosition({
        left: 100,
        top: 850,
        ...defaultBounds
      });
      expect(pos.top).toBe(726);
    });

    it('allows partial overhang on the left while keeping minVisibleWidth visible', () => {
      // minX = -width + minVisibleWidth = -600 + 120 = -480
      const pos = clampWindowPosition({
        left: -800,
        top: 100,
        ...defaultBounds
      });
      expect(pos.left).toBe(-480);
    });

    it('allows partial overhang on the right while keeping minVisibleWidth visible', () => {
      // maxX = boundsWidth - minVisibleWidth = 1024 - 120 = 904
      const pos = clampWindowPosition({
        left: 1200,
        top: 100,
        ...defaultBounds
      });
      expect(pos.left).toBe(904);
    });

    it('rounds floating-point coordinates to nearest integer', () => {
      const pos = clampWindowPosition({
        left: 120.7,
        top: 45.2,
        ...defaultBounds
      });
      expect(pos).toEqual({ left: 121, top: 45 });
    });
  });

  describe('computeCascadePosition()', () => {
    it('cascades successive window indices with a 28px step offset', () => {
      const bounds = { width: 500, height: 400, boundsWidth: 1024, boundsHeight: 768 };

      const pos0 = computeCascadePosition({ index: 0, ...bounds });
      expect(pos0).toEqual({ left: 32, top: 28 });

      const pos1 = computeCascadePosition({ index: 1, ...bounds });
      expect(pos1).toEqual({ left: 32 + 28, top: 28 + 28 }); // 60, 56

      const pos2 = computeCascadePosition({ index: 2, ...bounds });
      expect(pos2).toEqual({ left: 32 + 56, top: 28 + 56 }); // 88, 84
    });

    it('wraps offset back after 5 windows (index % 5)', () => {
      const bounds = { width: 500, height: 400, boundsWidth: 1024, boundsHeight: 768 };
      const pos0 = computeCascadePosition({ index: 0, ...bounds });
      const pos5 = computeCascadePosition({ index: 5, ...bounds });
      expect(pos5).toEqual(pos0);
    });

    it('clamps cascaded positions within container boundaries', () => {
      // Very small bounds
      const pos = computeCascadePosition({
        index: 4,
        width: 300,
        height: 200,
        boundsWidth: 320,
        boundsHeight: 240
      });
      // maxLeft = 320 - 300 = 20
      // maxTop = 240 - 200 - 42 = 0 (Math.max(0, -2))
      expect(pos.left).toBeLessThanOrEqual(20);
      expect(pos.top).toBe(0);
    });
  });

  describe('Registry & Lifecycle Management', () => {
    let originalDoc;
    let originalWin;
    let container;
    let wm;

    beforeEach(() => {
      originalDoc = globalThis.document;
      originalWin = globalThis.window;

      globalThis.document = {
        createElement: vi.fn((tag) => createMockElement(tag))
      };
      globalThis.window = {
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      container = createMockElement('div');
      container.clientWidth = 1024;
      container.clientHeight = 768;

      wm = new WindowManager(container);
    });

    afterEach(() => {
      wm.destroy();
      globalThis.document = originalDoc;
      globalThis.window = originalWin;
      vi.restoreAllMocks();
    });

    it('registers and retrieves application definitions', () => {
      const app = {
        id: 'test-app',
        title: 'Test App',
        render: vi.fn()
      };

      wm.registerApp(app);
      const registered = wm.getRegisteredApps();
      expect(registered).toContainEqual(app);
      expect(wm.appsRegistry.get('test-app')).toBe(app);
    });

    it('opens an application and returns window state', () => {
      const renderFn = vi.fn();
      wm.registerApp({
        id: 'sample',
        title: 'Sample Window',
        render: renderFn
      });

      const winState = wm.openApp('sample');
      expect(winState).not.toBeNull();
      expect(winState.id).toBe('sample');
      expect(winState.title).toBe('Sample Window');
      expect(wm.getOpenWindows()).toHaveLength(1);
      expect(wm.getActiveAppId()).toBe('sample');
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it('prevents duplicate windows on re-opening and focuses existing window', () => {
      const renderFn = vi.fn();
      wm.registerApp({
        id: 'sample',
        title: 'Sample Window',
        render: renderFn
      });

      const firstOpen = wm.openApp('sample');
      const secondOpen = wm.openApp('sample');

      expect(wm.getOpenWindows()).toHaveLength(1);
      expect(firstOpen).toBe(secondOpen);
      expect(renderFn).toHaveBeenCalledTimes(1); // Not re-rendered from scratch
    });

    it('routes payloads to onPayload on initial open and re-open', () => {
      const onPayloadMock = vi.fn();
      wm.registerApp({
        id: 'contacts',
        title: 'Contacts App',
        render: (_container, ctx) => {
          return {
            onPayload: onPayloadMock
          };
        }
      });

      // Initial open with payload
      wm.openApp('contacts', { subject: 'Hello World' });
      expect(onPayloadMock).toHaveBeenCalledWith({ subject: 'Hello World' });

      // Re-open with new payload
      wm.openApp('contacts', { subject: 'Follow Up' });
      expect(onPayloadMock).toHaveBeenCalledWith({ subject: 'Follow Up' });
      expect(onPayloadMock).toHaveBeenCalledTimes(2);
    });

    it('manages minimize, restore, and maximize states correctly', () => {
      wm.registerApp({ id: 'app1', title: 'App 1', render: vi.fn() });
      wm.openApp('app1');

      // Minimize
      wm.minimizeWindow('app1');
      let win = wm.windows.get('app1');
      expect(win.minimized).toBe(true);

      // Restore
      wm.restoreWindow('app1');
      win = wm.windows.get('app1');
      expect(win.minimized).toBe(false);

      // Maximize
      wm.setMaximized('app1', true);
      expect(win.maximized).toBe(true);

      wm.setMaximized('app1', false);
      expect(win.maximized).toBe(false);

      wm.toggleMaximize('app1');
      expect(win.maximized).toBe(true);
    });

    it('cleans up lifecycle handlers when closing a window', () => {
      const cleanupMock = vi.fn();
      wm.registerApp({
        id: 'clean-app',
        title: 'Clean App',
        render: () => ({ cleanup: cleanupMock })
      });

      wm.openApp('clean-app');
      expect(wm.getOpenWindows()).toHaveLength(1);

      wm.closeWindow('clean-app');
      expect(cleanupMock).toHaveBeenCalledTimes(1);
      expect(wm.windows.has('clean-app')).toBe(false);
    });

    it('notifies subscribers on window open and close events', () => {
      const listener = vi.fn();
      const unsub = wm.subscribe(listener);

      wm.registerApp({ id: 'app1', title: 'App 1', render: vi.fn() });
      wm.openApp('app1');

      expect(listener).toHaveBeenCalled();
      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.openWindows).toHaveLength(1);
      expect(lastCall.activeAppId).toBe('app1');

      unsub();
    });
  });
});
