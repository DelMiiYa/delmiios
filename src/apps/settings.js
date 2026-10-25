/**
 * Settings Personalization & System Control Application (DelMiiOS)
 * ================================================================
 * Personalization control panel managing visual themes, dark/light mode,
 * desktop wallpapers, accent colors, audio synthesis, CRT monitor effects,
 * and custom triangle cursor / trail toggles.
 *
 * All controls synchronize live with settingsStore.
 */

import { profile } from '../data/profile.js';
import { icons } from '../core/icons.js';
import { sound } from '../core/sound.js';
import { settingsStore } from '../core/settings.js';

export const settingsApp = {
  id: 'settings',
  title: 'Settings — Personalization & System',
  shortTitle: 'Settings',
  desktopLabel: 'Settings',
  description: 'Themes, wallpapers, accent colors, audio, CRT & cursor',
  icon: icons.settings,
  defaultWidth: 650,
  defaultHeight: 540,

  render(container) {
    const { themes, wallpapers, accents } = profile.appearance || {};

    container.innerHTML = `
      <div class="app-settings">
        <!-- Section 1: Visual Theme Preset -->
        <section class="settings-section" aria-labelledby="heading-themes">
          <h3 class="settings-title" id="heading-themes">Visual Theme Preset</h3>
          <p class="settings-subtitle">Select an authentic system color scheme and palette.</p>
          <div class="settings-theme-grid" id="settings-theme-grid" role="radiogroup" aria-label="Visual Theme Preset">
            ${(themes || [])
              .map(
                (t) => `
              <button
                type="button"
                class="theme-preset-card"
                data-theme-id="${t.id}"
                role="radio"
                aria-checked="false"
                aria-label="${t.name}: ${t.desc}"
              >
                <div class="theme-preset-swatch" style="background-color: ${t.color}"></div>
                <div class="theme-preset-info">
                  <span class="theme-preset-name">${t.name}</span>
                  <span class="theme-preset-desc">${t.desc}</span>
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- Section 2: Appearance Mode -->
        <section class="settings-section" aria-labelledby="heading-mode">
          <h3 class="settings-title" id="heading-mode">Appearance Mode</h3>
          <p class="settings-subtitle">Switch between dark and light interface contrast modes.</p>
          <div class="settings-mode-row" role="radiogroup" aria-label="Appearance Mode">
            <button
              type="button"
              class="theme-mode-card"
              data-mode-id="dark"
              role="radio"
              aria-checked="false"
              aria-label="Dark Mode"
            >
              <span class="theme-mode-icon" aria-hidden="true">☾</span>
              <span class="theme-mode-label">Dark Mode</span>
            </button>
            <button
              type="button"
              class="theme-mode-card"
              data-mode-id="light"
              role="radio"
              aria-checked="false"
              aria-label="Light Mode"
            >
              <span class="theme-mode-icon" aria-hidden="true">☀</span>
              <span class="theme-mode-label">Light Mode</span>
            </button>
          </div>
        </section>

        <!-- Section 3: Desktop Wallpaper -->
        <section class="settings-section" aria-labelledby="heading-wallpaper">
          <h3 class="settings-title" id="heading-wallpaper">Desktop Wallpaper</h3>
          <p class="settings-subtitle">Choose a generated CSS gradient or architectural pattern backdrop.</p>
          <div class="settings-wallpaper-grid" id="settings-wallpaper-grid" role="radiogroup" aria-label="Desktop Wallpaper">
            ${(wallpapers || [])
              .map(
                (wp) => `
              <button
                type="button"
                class="wallpaper-card"
                data-wallpaper-id="${wp.id}"
                role="radio"
                aria-checked="false"
                aria-label="Wallpaper ${wp.name}: ${wp.description}"
              >
                <div class="wallpaper-preview wallpaper-preview--${wp.id}" aria-hidden="true"></div>
                <div class="wallpaper-info">
                  <div class="wallpaper-name">${wp.name}</div>
                  <div class="wallpaper-desc">${wp.description}</div>
                </div>
              </button>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- Section 4: System Accent Color -->
        <section class="settings-section" aria-labelledby="heading-accent">
          <h3 class="settings-title" id="heading-accent">System Accent Color</h3>
          <p class="settings-subtitle">Tint buttons, window focus rings, progress meters, and highlights.</p>
          <div class="settings-accent-row" id="settings-accent-row" role="radiogroup" aria-label="System Accent Color">
            ${(accents || [])
              .map(
                (acc) => `
              <button
                type="button"
                class="accent-swatch-btn"
                data-accent-value="${acc.value}"
                role="radio"
                aria-checked="false"
                aria-label="Accent ${acc.name}"
                title="${acc.name}"
              >
                <span class="accent-swatch-circle" style="background-color: ${acc.value}" aria-hidden="true"></span>
                <span class="accent-swatch-name">${acc.name}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </section>

        <!-- Section 5: Audio & Sound FX -->
        <section class="settings-section" aria-labelledby="heading-audio">
          <h3 class="settings-title" id="heading-audio">Audio & Sound FX</h3>
          <p class="settings-subtitle">Synthesized Web Audio sound effects on clicks, typing, and startup.</p>
          <div class="setting-toggle-row">
            <div class="setting-toggle-info">
              <span class="toggle-label">System Sound Effects</span>
              <span class="toggle-sublabel">Audio chimes, window controls, and keyboard clicks</span>
            </div>
            <label class="switch" for="toggle-sound">
              <input type="checkbox" id="toggle-sound" role="switch" aria-label="Toggle system sound effects" />
              <span class="slider" aria-hidden="true"></span>
            </label>
          </div>
        </section>

        <!-- Section 6: CRT Monitor Frame & Effects -->
        <section class="settings-section" aria-labelledby="heading-crt">
          <h3 class="settings-title" id="heading-crt">CRT Monitor Frame & Shader Layers</h3>
          <p class="settings-subtitle">Simulate vintage cathode-ray tube monitor display aesthetics.</p>
          <div class="settings-toggles-grid">
            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">CRT Monitor Frame (Bezel)</span>
                <span class="toggle-sublabel">Retro computer bezel with power LED and badge</span>
              </div>
              <label class="switch" for="toggle-crt-frame">
                <input type="checkbox" id="toggle-crt-frame" role="switch" aria-label="Toggle CRT monitor bezel" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">Scanlines & Phosphor Mask</span>
                <span class="toggle-sublabel">Horizontal cathode scan lines and RGB sub-pixel grill</span>
              </div>
              <label class="switch" for="toggle-crt-scanlines">
                <input type="checkbox" id="toggle-crt-scanlines" role="switch" aria-label="Toggle CRT scanlines" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">Screen Curvature & Vignette</span>
                <span class="toggle-sublabel">Radial corner darkening and curved cathode lens glass</span>
              </div>
              <label class="switch" for="toggle-crt-vignette">
                <input type="checkbox" id="toggle-crt-vignette" role="switch" aria-label="Toggle CRT curvature vignette" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">CRT Flicker & Scan Band</span>
                <span class="toggle-sublabel">Subtle 60Hz cathode screen refresh rate flicker</span>
              </div>
              <label class="switch" for="toggle-crt-flicker">
                <input type="checkbox" id="toggle-crt-flicker" role="switch" aria-label="Toggle CRT screen flicker" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>
          </div>
        </section>

        <!-- Section 7: Custom Cursor & Trail -->
        <section class="settings-section" aria-labelledby="heading-cursor">
          <h3 class="settings-title" id="heading-cursor">Custom Cursor & Continuous Trail</h3>
          <p class="settings-subtitle">osu!-style animated red triangle cursor and smooth fading white trail.</p>
          <div class="settings-toggles-grid">
            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">Custom Red Triangle Cursor</span>
                <span class="toggle-sublabel">Velocity-oriented triangle with idle spin</span>
              </div>
              <label class="switch" for="toggle-custom-cursor">
                <input type="checkbox" id="toggle-custom-cursor" role="switch" aria-label="Toggle custom red triangle cursor" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>

            <div class="setting-toggle-row">
              <div class="setting-toggle-info">
                <span class="toggle-label">Continuous White Cursor Trail</span>
                <span class="toggle-sublabel">Hardware-accelerated continuous spline line trail</span>
              </div>
              <label class="switch" for="toggle-cursor-trail">
                <input type="checkbox" id="toggle-cursor-trail" role="switch" aria-label="Toggle continuous cursor trail" />
                <span class="slider" aria-hidden="true"></span>
              </label>
            </div>
          </div>
        </section>

        <!-- Section 8: Footer & Persistence -->
        <div class="settings-footer">
          <span class="settings-persist-note">✓ Preferences are saved automatically in localStorage.</span>
          <button type="button" class="os-btn" id="settings-reset-btn">
            Reset to Defaults
          </button>
        </div>
      </div>
    `;

    // References to DOM elements
    const themeCards = container.querySelectorAll('[data-theme-id]');
    const modeCards = container.querySelectorAll('[data-mode-id]');
    const wallpaperCards = container.querySelectorAll('[data-wallpaper-id]');
    const accentBtns = container.querySelectorAll('[data-accent-value]');

    const soundToggle = container.querySelector('#toggle-sound');
    const crtFrameToggle = container.querySelector('#toggle-crt-frame');
    const crtScanlinesToggle = container.querySelector('#toggle-crt-scanlines');
    const crtVignetteToggle = container.querySelector('#toggle-crt-vignette');
    const crtFlickerToggle = container.querySelector('#toggle-crt-flicker');

    const customCursorToggle = container.querySelector('#toggle-custom-cursor');
    const cursorTrailToggle = container.querySelector('#toggle-cursor-trail');
    const resetBtn = container.querySelector('#settings-reset-btn');

    // Wire Theme preset buttons
    themeCards.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        settingsStore.setTheme(btn.dataset.themeId);
      });
    });

    // Wire Mode buttons
    modeCards.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        settingsStore.setMode(btn.dataset.modeId);
      });
    });

    // Wire Wallpaper cards
    wallpaperCards.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        settingsStore.setWallpaper(btn.dataset.wallpaperId);
      });
    });

    // Wire Accent swatches
    accentBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        settingsStore.setAccent(btn.dataset.accentValue);
      });
    });

    // Wire Audio toggle
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        settingsStore.setSound(e.target.checked);
        if (e.target.checked) sound.playClick();
      });
    }

    // Wire CRT toggles
    if (crtFrameToggle) {
      crtFrameToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCrt({ crtFrame: e.target.checked });
      });
    }

    if (crtScanlinesToggle) {
      crtScanlinesToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCrt({ crtScanlines: e.target.checked });
      });
    }

    if (crtVignetteToggle) {
      crtVignetteToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCrt({ crtVignette: e.target.checked });
      });
    }

    if (crtFlickerToggle) {
      crtFlickerToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCrt({ crtFlicker: e.target.checked });
      });
    }

    // Wire Cursor toggles
    if (customCursorToggle) {
      customCursorToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCursor({ customCursor: e.target.checked });
      });
    }

    if (cursorTrailToggle) {
      cursorTrailToggle.addEventListener('change', (e) => {
        sound.playClick();
        settingsStore.setCursor({ cursorTrail: e.target.checked });
      });
    }

    // Wire Reset to Defaults
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sound.playClick();
        settingsStore.resetDefaults();
      });
    }

    // Synchronize UI elements with current settingsStore state
    function syncUI(state) {
      if (!state) return;

      themeCards.forEach((btn) => {
        const isActive = btn.dataset.themeId === state.theme;
        btn.classList.toggle('theme-preset-card--active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });

      modeCards.forEach((btn) => {
        const isActive = btn.dataset.modeId === state.mode;
        btn.classList.toggle('theme-mode-card--active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });

      wallpaperCards.forEach((btn) => {
        const isActive = btn.dataset.wallpaperId === state.wallpaper;
        btn.classList.toggle('wallpaper-card--active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });

      accentBtns.forEach((btn) => {
        const isActive =
          (btn.dataset.accentValue || '').toLowerCase() === (state.accent || '').toLowerCase();
        btn.classList.toggle('accent-swatch-btn--active', isActive);
        btn.setAttribute('aria-checked', String(isActive));
      });

      if (soundToggle) {
        soundToggle.checked = Boolean(state.soundEnabled);
        soundToggle.setAttribute('aria-checked', String(state.soundEnabled));
      }

      if (crtFrameToggle) {
        crtFrameToggle.checked = Boolean(state.crtFrame);
        crtFrameToggle.setAttribute('aria-checked', String(state.crtFrame));
      }

      if (crtScanlinesToggle) {
        crtScanlinesToggle.checked = Boolean(state.crtScanlines);
        crtScanlinesToggle.setAttribute('aria-checked', String(state.crtScanlines));
      }

      if (crtVignetteToggle) {
        crtVignetteToggle.checked = Boolean(state.crtVignette);
        crtVignetteToggle.setAttribute('aria-checked', String(state.crtVignette));
      }

      if (crtFlickerToggle) {
        crtFlickerToggle.checked = Boolean(state.crtFlicker);
        crtFlickerToggle.setAttribute('aria-checked', String(state.crtFlicker));
      }

      if (customCursorToggle) {
        customCursorToggle.checked = Boolean(state.customCursor);
        customCursorToggle.setAttribute('aria-checked', String(state.customCursor));
      }

      if (cursorTrailToggle) {
        cursorTrailToggle.checked = Boolean(state.cursorTrail);
        cursorTrailToggle.setAttribute('aria-checked', String(state.cursorTrail));
      }
    }

    // Initial sync
    syncUI(settingsStore.getState());

    // Subscribe to settings changes for live sync across windows
    const unsubscribe = settingsStore.subscribe(syncUI);

    return {
      cleanup() {
        unsubscribe();
      }
    };
  }
};
