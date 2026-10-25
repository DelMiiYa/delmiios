import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SettingsStore,
  STORAGE_KEY,
  VALID_THEMES,
  VALID_MODES,
  settingsStore
} from '../../src/core/settings.js';
import { profile } from '../../src/data/profile.js';

function createMockLocalStorage(initial = {}) {
  let store = { ...initial };
  return {
    getItem: vi.fn((key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get raw() {
      return store;
    }
  };
}

describe('SettingsStore (src/core/settings.js)', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = createMockLocalStorage();
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  describe('Default State Initialization', () => {
    it('initializes default state from profile.system when storage is empty', () => {
      const store = new SettingsStore();
      const state = store.getState();

      expect(state.theme).toBe(profile.system.defaultTheme);
      expect(state.mode).toBe(profile.system.defaultMode);
      expect(state.wallpaper).toBe(profile.system.defaultWallpaper);
      expect(state.accent).toBe(profile.system.defaultAccent);
      expect(state.soundEnabled).toBe(profile.system.soundEnabled);
      expect(state.crtFrame).toBe(profile.system.crtFrame);
      expect(state.crtScanlines).toBe(profile.system.crtScanlines);
      expect(state.crtVignette).toBe(profile.system.crtVignette);
      expect(state.crtFlicker).toBe(profile.system.crtFlicker);
      expect(state.customCursor).toBe(profile.system.customCursor);
      expect(state.cursorTrail).toBe(profile.system.cursorTrail);
    });

    it('exports STORAGE_KEY as "delmiios_settings_v1"', () => {
      expect(STORAGE_KEY).toBe('delmiios_settings_v1');
    });

    it('exports valid themes and modes lists matching system spec', () => {
      expect(VALID_THEMES).toEqual([
        'cyber-dark',
        'retro-teal',
        'sunset-dusk',
        'matrix',
        'clean-slate'
      ]);
      expect(VALID_MODES).toEqual(['dark', 'light']);
    });
  });

  describe('Theme & Mode Management', () => {
    it('switches among all 5 supported themes and sets mode to dark', () => {
      const store = new SettingsStore();

      VALID_THEMES.forEach((themeId) => {
        const ok = store.setTheme(themeId);
        expect(ok).toBe(true);
        expect(store.getState().theme).toBe(themeId);
        expect(store.getState().mode).toBe('dark');
      });
    });

    it('handles dark and light mode switching via setTheme and setMode', () => {
      const store = new SettingsStore();

      expect(store.setMode('light')).toBe(true);
      expect(store.getState().mode).toBe('light');

      expect(store.setMode('dark')).toBe(true);
      expect(store.getState().mode).toBe('dark');

      expect(store.setTheme('light')).toBe(true);
      expect(store.getState().mode).toBe('light');

      expect(store.toggleMode()).toBe('dark');
      expect(store.getState().mode).toBe('dark');

      expect(store.toggleMode()).toBe('light');
      expect(store.getState().mode).toBe('light');
    });

    it('rejects invalid theme and mode IDs', () => {
      const store = new SettingsStore();
      const prev = store.getState();

      expect(store.setTheme('invalid-theme-preset')).toBe(false);
      expect(store.setMode('solarized')).toBe(false);
      expect(store.getState()).toEqual(prev);
    });
  });

  describe('Wallpaper & Accent Validation', () => {
    it('allows setting valid wallpapers and rejects invalid wallpaper IDs', () => {
      const store = new SettingsStore();
      const validWallpapers = profile.appearance.wallpapers.map((w) => w.id);

      validWallpapers.forEach((wpId) => {
        expect(store.setWallpaper(wpId)).toBe(true);
        expect(store.getState().wallpaper).toBe(wpId);
      });

      expect(store.setWallpaper('non-existent-wallpaper')).toBe(false);
    });

    it('allows setting non-empty string accent colors and rejects empty or invalid values', () => {
      const store = new SettingsStore();

      expect(store.setAccent('#10b981')).toBe(true);
      expect(store.getState().accent).toBe('#10b981');

      expect(store.setAccent('   #f59e0b  ')).toBe(true);
      expect(store.getState().accent).toBe('#f59e0b');

      expect(store.setAccent('')).toBe(false);
      expect(store.setAccent('   ')).toBe(false);
      expect(store.setAccent(null)).toBe(false);
      expect(store.setAccent(12345)).toBe(false);
    });
  });

  describe('Audio & Sound FX', () => {
    it('sets and toggles soundEnabled correctly', () => {
      const store = new SettingsStore();

      expect(store.setSound(false)).toBe(false);
      expect(store.getState().soundEnabled).toBe(false);

      expect(store.setSound(true)).toBe(true);
      expect(store.getState().soundEnabled).toBe(true);

      const next = store.toggleSound();
      expect(next).toBe(false);
      expect(store.getState().soundEnabled).toBe(false);
    });
  });

  describe('CRT Effects Control', () => {
    it('handles preset strings on, off, frame, scanlines, vignette, flicker', () => {
      const store = new SettingsStore();

      store.setCrt('off');
      let state = store.getState();
      expect(state.crtFrame).toBe(false);
      expect(state.crtScanlines).toBe(false);
      expect(state.crtVignette).toBe(false);
      expect(state.crtFlicker).toBe(false);

      store.setCrt('on');
      state = store.getState();
      expect(state.crtFrame).toBe(true);
      expect(state.crtScanlines).toBe(true);
      expect(state.crtVignette).toBe(true);

      store.setCrt('frame');
      expect(store.getState().crtFrame).toBe(false);

      store.setCrt('scanlines');
      expect(store.getState().crtScanlines).toBe(false);

      store.setCrt('vignette');
      expect(store.getState().crtVignette).toBe(false);

      store.setCrt('flicker');
      expect(store.getState().crtFlicker).toBe(true);
    });

    it('handles partial objects for setCrt', () => {
      const store = new SettingsStore();
      store.setCrt({ crtFrame: false, crtScanlines: false, crtVignette: true, crtFlicker: true });
      const state = store.getState();
      expect(state.crtFrame).toBe(false);
      expect(state.crtScanlines).toBe(false);
      expect(state.crtVignette).toBe(true);
      expect(state.crtFlicker).toBe(true);
    });

    it('toggles CRT master switch on and off', () => {
      const store = new SettingsStore();
      store.setCrt('on');
      expect(store.getState().crtScanlines || store.getState().crtFrame).toBe(true);

      const turnedOff = store.toggleCrtMaster();
      expect(turnedOff).toBe(false);
      expect(store.getState().crtScanlines).toBe(false);
      expect(store.getState().crtFrame).toBe(false);

      const turnedOn = store.toggleCrtMaster();
      expect(turnedOn).toBe(true);
      expect(store.getState().crtScanlines).toBe(true);
      expect(store.getState().crtFrame).toBe(true);
    });
  });

  describe('Cursor Settings Control', () => {
    it('handles strings on, off, trail on, trail off', () => {
      const store = new SettingsStore();

      store.setCursor('off');
      expect(store.getState().customCursor).toBe(false);
      expect(store.getState().cursorTrail).toBe(false);

      store.setCursor('on');
      expect(store.getState().customCursor).toBe(true);
      expect(store.getState().cursorTrail).toBe(true);

      store.setCursor('trail off');
      expect(store.getState().cursorTrail).toBe(false);
      expect(store.getState().customCursor).toBe(true);

      store.setCursor('trail on');
      expect(store.getState().cursorTrail).toBe(true);
    });

    it('handles partial objects for setCursor', () => {
      const store = new SettingsStore();
      store.setCursor({ customCursor: false, cursorTrail: true });
      expect(store.getState().customCursor).toBe(false);
      expect(store.getState().cursorTrail).toBe(true);
    });
  });

  describe('Persistence to localStorage & Reload', () => {
    it('persists changes to delmiios_settings_v1 in localStorage', () => {
      const store = new SettingsStore();
      store.setTheme('matrix');
      store.setWallpaper('emerald');
      store.setAccent('#22c55e');

      const savedRaw = globalThis.localStorage.getItem(STORAGE_KEY);
      expect(savedRaw).not.toBeNull();
      const parsed = JSON.parse(savedRaw);
      expect(parsed.theme).toBe('matrix');
      expect(parsed.wallpaper).toBe('emerald');
      expect(parsed.accent).toBe('#22c55e');
    });

    it('reloads saved state from localStorage in a new instance', () => {
      const payload = {
        theme: 'retro-teal',
        mode: 'dark',
        wallpaper: 'blueprint',
        accent: '#008080',
        soundEnabled: false,
        crtFrame: false,
        crtScanlines: true,
        crtVignette: false,
        crtFlicker: true,
        customCursor: false,
        cursorTrail: false
      };
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      const reloadedStore = new SettingsStore();
      const state = reloadedStore.getState();

      expect(state.theme).toBe('retro-teal');
      expect(state.wallpaper).toBe('blueprint');
      expect(state.accent).toBe('#008080');
      expect(state.soundEnabled).toBe(false);
      expect(state.crtFrame).toBe(false);
      expect(state.crtScanlines).toBe(true);
      expect(state.crtVignette).toBe(false);
      expect(state.crtFlicker).toBe(true);
      expect(state.customCursor).toBe(false);
      expect(state.cursorTrail).toBe(false);
    });

    it('falls back gracefully to defaults when localStorage contains corrupt JSON', () => {
      globalThis.localStorage.setItem(STORAGE_KEY, '{corrupt:json---bad');
      const store = new SettingsStore();
      const state = store.getState();
      expect(state.theme).toBe(profile.system.defaultTheme);
      expect(state.mode).toBe(profile.system.defaultMode);
    });

    it('falls back gracefully when localStorage.getItem throws an exception', () => {
      globalThis.localStorage.getItem = vi.fn(() => {
        throw new Error('SecurityError: Access Denied');
      });

      const store = new SettingsStore();
      expect(store.getState().theme).toBe(profile.system.defaultTheme);
    });
  });

  describe('Subscribe / Unsubscribe Pattern', () => {
    it('notifies subscribers on state updates and cleans up on unsubscribe', () => {
      const store = new SettingsStore();
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(subscriber);
      store.setTheme('sunset-dusk');

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ theme: 'sunset-dusk' }));

      unsubscribe();
      store.setTheme('matrix');
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('handles non-function subscribers safely', () => {
      const store = new SettingsStore();
      const unsub = store.subscribe(null);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('resetDefaults()', () => {
    it('restores all properties to initial defaults from profile.system', () => {
      const store = new SettingsStore();

      store.setTheme('matrix');
      store.setMode('light');
      store.setWallpaper('sunset');
      store.setAccent('#ff0055');
      store.setSound(false);
      store.setCrt('off');
      store.setCursor('off');

      store.resetDefaults();
      const reset = store.getState();

      expect(reset.theme).toBe(profile.system.defaultTheme);
      expect(reset.mode).toBe(profile.system.defaultMode);
      expect(reset.wallpaper).toBe(profile.system.defaultWallpaper);
      expect(reset.accent).toBe(profile.system.defaultAccent);
      expect(reset.soundEnabled).toBe(profile.system.soundEnabled);
      expect(reset.crtFrame).toBe(profile.system.crtFrame);
      expect(reset.crtScanlines).toBe(profile.system.crtScanlines);
      expect(reset.crtVignette).toBe(profile.system.crtVignette);
      expect(reset.crtFlicker).toBe(profile.system.crtFlicker);
      expect(reset.customCursor).toBe(profile.system.customCursor);
      expect(reset.cursorTrail).toBe(profile.system.cursorTrail);
    });
  });
});
