import { profile } from '../data/profile.js';
import { sound } from './sound.js';

export const STORAGE_KEY = 'delmiios_settings_v1';
export const VALID_THEMES = ['cyber-dark', 'retro-teal', 'sunset-dusk', 'matrix', 'clean-slate'];
export const VALID_MODES = ['dark', 'light'];

export class SettingsStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadInitialState();
    this.apply();
  }

  loadInitialState() {
    const defaults = {
      theme: profile.system.defaultTheme || 'cyber-dark',
      mode: profile.system.defaultMode || 'dark',
      wallpaper: profile.system.defaultWallpaper || 'aurora',
      accent: profile.system.defaultAccent || '#38bdf8',
      soundEnabled: profile.system.soundEnabled ?? true,
      crtFrame: profile.system.crtFrame ?? true,
      crtScanlines: profile.system.crtScanlines ?? true,
      crtVignette: profile.system.crtVignette ?? true,
      crtFlicker: profile.system.crtFlicker ?? false,
      customCursor: profile.system.customCursor ?? true,
      cursorTrail: profile.system.cursorTrail ?? true
    };

    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              theme: VALID_THEMES.includes(parsed.theme) ? parsed.theme : defaults.theme,
              mode: VALID_MODES.includes(parsed.mode) ? parsed.mode : defaults.mode,
              wallpaper: profile.appearance.wallpapers.some((w) => w.id === parsed.wallpaper)
                ? parsed.wallpaper
                : defaults.wallpaper,
              accent:
                typeof parsed.accent === 'string' && parsed.accent.trim()
                  ? parsed.accent.trim()
                  : defaults.accent,
              soundEnabled: parsed.soundEnabled !== undefined ? Boolean(parsed.soundEnabled) : defaults.soundEnabled,
              crtFrame: parsed.crtFrame !== undefined ? Boolean(parsed.crtFrame) : defaults.crtFrame,
              crtScanlines:
                parsed.crtScanlines !== undefined ? Boolean(parsed.crtScanlines) : defaults.crtScanlines,
              crtVignette:
                parsed.crtVignette !== undefined ? Boolean(parsed.crtVignette) : defaults.crtVignette,
              crtFlicker: parsed.crtFlicker !== undefined ? Boolean(parsed.crtFlicker) : defaults.crtFlicker,
              customCursor:
                parsed.customCursor !== undefined ? Boolean(parsed.customCursor) : defaults.customCursor,
              cursorTrail:
                parsed.cursorTrail !== undefined ? Boolean(parsed.cursorTrail) : defaults.cursorTrail
            };
          }
        }
      }
    } catch {
      // Fallback to defaults if storage is unavailable or corrupt
    }

    return defaults;
  }

  save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Ignore write quota or security errors
    }
  }

  getState() {
    return { ...this.state };
  }

  notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch {
        // Prevent listener exceptions from breaking store operations
      }
    });
  }

  update(partial = {}) {
    if (!partial || typeof partial !== 'object') {
      return this.getState();
    }

    if (partial.theme !== undefined && VALID_THEMES.includes(partial.theme)) {
      this.state.theme = partial.theme;
    }

    if (partial.mode !== undefined && VALID_MODES.includes(partial.mode)) {
      this.state.mode = partial.mode;
    }

    if (
      partial.wallpaper !== undefined &&
      profile.appearance.wallpapers.some((w) => w.id === partial.wallpaper)
    ) {
      this.state.wallpaper = partial.wallpaper;
    }

    if (typeof partial.accent === 'string' && partial.accent.trim()) {
      this.state.accent = partial.accent.trim();
    }

    if (partial.soundEnabled !== undefined) {
      this.state.soundEnabled = Boolean(partial.soundEnabled);
      sound.setEnabled(this.state.soundEnabled);
    }

    if (partial.crtFrame !== undefined) {
      this.state.crtFrame = Boolean(partial.crtFrame);
    }

    if (partial.crtScanlines !== undefined) {
      this.state.crtScanlines = Boolean(partial.crtScanlines);
    }

    if (partial.crtVignette !== undefined) {
      this.state.crtVignette = Boolean(partial.crtVignette);
    }

    if (partial.crtFlicker !== undefined) {
      this.state.crtFlicker = Boolean(partial.crtFlicker);
    }

    if (partial.customCursor !== undefined) {
      this.state.customCursor = Boolean(partial.customCursor);
    }

    if (partial.cursorTrail !== undefined) {
      this.state.cursorTrail = Boolean(partial.cursorTrail);
    }

    this.save();
    this.apply();
    this.notify();
    return this.getState();
  }

  setTheme(themeOrMode) {
    if (VALID_MODES.includes(themeOrMode)) {
      return this.setMode(themeOrMode);
    }
    if (VALID_THEMES.includes(themeOrMode)) {
      this.state.theme = themeOrMode;
      this.state.mode = 'dark';
      this.save();
      this.apply();
      this.notify();
      return true;
    }
    return false;
  }

  setMode(mode) {
    if (!VALID_MODES.includes(mode)) return false;
    this.state.mode = mode;
    this.save();
    this.apply();
    this.notify();
    return true;
  }

  toggleMode() {
    const nextMode = this.state.mode === 'dark' ? 'light' : 'dark';
    this.setMode(nextMode);
    return nextMode;
  }

  toggleTheme() {
    return this.toggleMode();
  }

  setWallpaper(wallpaperId) {
    const exists = profile.appearance.wallpapers.some((w) => w.id === wallpaperId);
    if (!exists) return false;
    this.state.wallpaper = wallpaperId;
    this.save();
    this.apply();
    this.notify();
    return true;
  }

  setAccent(colorHex) {
    if (typeof colorHex !== 'string' || !colorHex.trim()) return false;
    this.state.accent = colorHex.trim();
    this.save();
    this.apply();
    this.notify();
    return true;
  }

  setSound(enabled) {
    this.state.soundEnabled = Boolean(enabled);
    sound.setEnabled(this.state.soundEnabled);
    this.save();
    this.apply();
    this.notify();
    return this.state.soundEnabled;
  }

  toggleSound() {
    return this.setSound(!this.state.soundEnabled);
  }

  setCrt(arg) {
    if (arg === 'on') {
      this.state.crtFrame = true;
      this.state.crtScanlines = true;
      this.state.crtVignette = true;
    } else if (arg === 'off') {
      this.state.crtFrame = false;
      this.state.crtScanlines = false;
      this.state.crtVignette = false;
      this.state.crtFlicker = false;
    } else if (arg === 'frame') {
      this.state.crtFrame = !this.state.crtFrame;
    } else if (arg === 'scanlines') {
      this.state.crtScanlines = !this.state.crtScanlines;
    } else if (arg === 'vignette' || arg === 'curvature') {
      this.state.crtVignette = !this.state.crtVignette;
    } else if (arg === 'flicker') {
      this.state.crtFlicker = !this.state.crtFlicker;
    } else if (arg && typeof arg === 'object') {
      if (arg.crtFrame !== undefined) this.state.crtFrame = Boolean(arg.crtFrame);
      if (arg.crtScanlines !== undefined) this.state.crtScanlines = Boolean(arg.crtScanlines);
      if (arg.crtVignette !== undefined) this.state.crtVignette = Boolean(arg.crtVignette);
      if (arg.crtFlicker !== undefined) this.state.crtFlicker = Boolean(arg.crtFlicker);
    }

    this.save();
    this.apply();
    this.notify();
    return this.getState();
  }

  toggleCrtMaster() {
    const isCurrentlyActive = Boolean(this.state.crtScanlines || this.state.crtFrame);
    this.setCrt(isCurrentlyActive ? 'off' : 'on');
    return !isCurrentlyActive;
  }

  setCursor(arg) {
    if (typeof arg === 'string') {
      const normalized = arg.toLowerCase().trim();
      if (normalized === 'on') {
        this.state.customCursor = true;
        this.state.cursorTrail = true;
      } else if (normalized === 'off') {
        this.state.customCursor = false;
        this.state.cursorTrail = false;
      } else if (normalized === 'trail on') {
        this.state.cursorTrail = true;
      } else if (normalized === 'trail off') {
        this.state.cursorTrail = false;
      } else if (normalized === 'trail') {
        this.state.cursorTrail = !this.state.cursorTrail;
      }
    } else if (arg && typeof arg === 'object') {
      if (arg.customCursor !== undefined) this.state.customCursor = Boolean(arg.customCursor);
      if (arg.cursorTrail !== undefined) this.state.cursorTrail = Boolean(arg.cursorTrail);
    }

    this.save();
    this.apply();
    this.notify();
    return this.getState();
  }

  resetDefaults() {
    this.state = {
      theme: profile.system.defaultTheme || 'cyber-dark',
      mode: profile.system.defaultMode || 'dark',
      wallpaper: profile.system.defaultWallpaper || 'aurora',
      accent: profile.system.defaultAccent || '#38bdf8',
      soundEnabled: profile.system.soundEnabled ?? true,
      crtFrame: profile.system.crtFrame ?? true,
      crtScanlines: profile.system.crtScanlines ?? true,
      crtVignette: profile.system.crtVignette ?? true,
      crtFlicker: profile.system.crtFlicker ?? false,
      customCursor: profile.system.customCursor ?? true,
      cursorTrail: profile.system.cursorTrail ?? true
    };
    this.save();
    this.apply();
    this.notify();
    return this.getState();
  }

  subscribe(cb) {
    if (typeof cb === 'function') {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    }
    return () => {};
  }

  apply() {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    // Attributes for themes, modes, wallpapers
    root.setAttribute('data-theme', this.state.theme);
    root.setAttribute('data-mode', this.state.mode);
    root.setAttribute('data-wallpaper', this.state.wallpaper);

    if (body) {
      body.setAttribute('data-theme', this.state.theme);
      body.setAttribute('data-mode', this.state.mode);
    }

    // CSS Custom Property for accent color
    if (root.style) {
      root.style.setProperty('--accent', this.state.accent);
    }

    // Sound engine synchronization
    sound.setEnabled(this.state.soundEnabled);

    // CRT DOM class synchronization
    const monitorEl = document.getElementById('crt-monitor');
    if (monitorEl) {
      monitorEl.classList.toggle('crt-monitor--bezel-on', Boolean(this.state.crtFrame));
    }

    const screenEl = document.getElementById('crt-screen');
    if (screenEl) {
      screenEl.classList.toggle('crt-screen--scanlines', Boolean(this.state.crtScanlines));
      screenEl.classList.toggle('crt-screen--vignette', Boolean(this.state.crtVignette));
      screenEl.classList.toggle('crt-screen--flicker', Boolean(this.state.crtFlicker));
      screenEl.classList.toggle(
        'crt-screen--glow',
        Boolean(this.state.crtScanlines || this.state.crtVignette)
      );
    }
  }
}

export const settingsStore = new SettingsStore();
export const themeManager = settingsStore;
