/**
 * CRT Monitor Frame & Power Animation Controller (DelMiiOS)
 * ==========================================================
 * Manages the authentic retro-modern CRT monitor bezel, recessed screen rim,
 * scanlines + RGB phosphor sub-pixel grill, vignette curvature, glass reflection,
 * subtle 60Hz flicker + rolling horizontal scan band, and power-on/power-off animations.
 *
 * Fully synchronizes with settingsStore and respects prefers-reduced-motion.
 */

import { settingsStore } from './settings.js';

export class CRTController {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.monitorEl] - The outer monitor frame container (#crt-monitor)
   * @param {HTMLElement} [options.screenEl] - The inner screen container (#crt-screen)
   * @param {HTMLElement} [options.powerBtnEl] - The monitor bezel chin power button (#crt-power-btn)
   * @param {HTMLElement} [options.powerAnimEl] - The power animation overlay layer (#crt-power-anim)
   * @param {import('./settings.js').SettingsStore} [options.settingsStore] - System settings store
   * @param {() => void} [options.onWake] - Callback when power button or click wakes system
   */
  constructor({
    monitorEl,
    screenEl,
    powerBtnEl,
    powerAnimEl,
    settingsStore: store = settingsStore,
    onWake
  } = {}) {
    this.monitorEl = monitorEl || (typeof document !== 'undefined' ? document.getElementById('crt-monitor') : null);
    this.screenEl = screenEl || (typeof document !== 'undefined' ? document.getElementById('crt-screen') : null);
    this.powerBtnEl = powerBtnEl || (typeof document !== 'undefined' ? document.getElementById('crt-power-btn') : null);
    this.powerAnimEl = powerAnimEl || (typeof document !== 'undefined' ? document.getElementById('crt-power-anim') : null);
    this.powerLedEl = typeof document !== 'undefined' ? document.getElementById('crt-power-led') : null;
    this.settingsStore = store;
    this.onWake = onWake || (() => {});

    this.isSleeping = false;
    this.isAnimating = false;
    this.unsubscribe = null;

    this.init();
  }

  /**
   * Returns true if user prefers reduced motion.
   * @returns {boolean}
   */
  prefersReducedMotion() {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  init() {
    // Synchronize initial state
    if (this.settingsStore) {
      this.applySettings(this.settingsStore.getState());
      this.unsubscribe = this.settingsStore.subscribe((state) => {
        this.applySettings(state);
      });
    }

    // Attach power button listener if not already handled
    if (this.powerBtnEl) {
      this.handlePowerBtnClick = (e) => {
        e.stopPropagation();
        if (this.isSleeping) {
          if (typeof this.onWake === 'function') {
            this.onWake();
          }
        }
      };
      this.powerBtnEl.addEventListener('click', this.handlePowerBtnClick);
    }
  }

  /**
   * Synchronizes CRT visual classes on #crt-monitor and #crt-screen.
   * @param {Object} state
   */
  applySettings(state = {}) {
    const monitor = this.monitorEl || (typeof document !== 'undefined' ? document.getElementById('crt-monitor') : null);
    const screen = this.screenEl || (typeof document !== 'undefined' ? document.getElementById('crt-screen') : null);

    if (monitor && state.crtFrame !== undefined) {
      monitor.classList.toggle('crt-monitor--bezel-on', Boolean(state.crtFrame));
    }

    if (screen) {
      if (state.crtScanlines !== undefined) {
        screen.classList.toggle('crt-screen--scanlines', Boolean(state.crtScanlines));
      }
      if (state.crtVignette !== undefined) {
        screen.classList.toggle('crt-screen--vignette', Boolean(state.crtVignette));
      }
      if (state.crtFlicker !== undefined) {
        const reduced = this.prefersReducedMotion();
        screen.classList.toggle('crt-screen--flicker', Boolean(state.crtFlicker) && !reduced);
      }
      screen.classList.toggle(
        'crt-screen--glow',
        Boolean(state.crtScanlines || state.crtVignette)
      );
    }
  }

  /**
   * Plays the classic CRT turn-on animation (~420ms: horizontal line expanding).
   * @returns {Promise<void>}
   */
  playPowerOn() {
    const animEl = this.powerAnimEl || (typeof document !== 'undefined' ? document.getElementById('crt-power-anim') : null);
    if (!animEl) return Promise.resolve();

    return new Promise((resolve) => {
      this.isAnimating = true;
      animEl.classList.remove('crt-power-anim--off');
      animEl.classList.remove('crt-power-anim--on');

      // Force reflow so animation restarts cleanly
      void animEl.offsetWidth;

      animEl.classList.add('crt-power-anim--on');

      const duration = this.prefersReducedMotion() ? 160 : 440;
      let completed = false;

      const finish = () => {
        if (completed) return;
        completed = true;
        animEl.classList.remove('crt-power-anim--on');
        animEl.removeEventListener('animationend', finish);
        this.isAnimating = false;
        resolve();
      };

      animEl.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, duration);
    });
  }

  /**
   * Plays the classic CRT turn-off animation (~380ms: collapse to horizontal line and center dot).
   * @returns {Promise<void>}
   */
  playPowerOff() {
    const animEl = this.powerAnimEl || (typeof document !== 'undefined' ? document.getElementById('crt-power-anim') : null);
    if (!animEl) return Promise.resolve();

    return new Promise((resolve) => {
      this.isAnimating = true;
      animEl.classList.remove('crt-power-anim--on');
      animEl.classList.remove('crt-power-anim--off');

      // Force reflow
      void animEl.offsetWidth;

      animEl.classList.add('crt-power-anim--off');

      const duration = this.prefersReducedMotion() ? 160 : 400;
      let completed = false;

      const finish = () => {
        if (completed) return;
        completed = true;
        animEl.removeEventListener('animationend', finish);
        this.isAnimating = false;
        resolve();
      };

      animEl.addEventListener('animationend', finish, { once: true });
      setTimeout(finish, duration);
    });
  }

  /**
   * Updates hardware power LED state (green for awake, amber for sleep/suspended).
   * @param {boolean} sleeping
   */
  setSleeping(sleeping) {
    this.isSleeping = Boolean(sleeping);
    const led = this.powerLedEl || (typeof document !== 'undefined' ? document.getElementById('crt-power-led') : null);
    if (led) {
      led.classList.toggle('crt-power-led--sleeping', this.isSleeping);
    }
  }

  /**
   * Cleans up listeners and subscriptions.
   */
  destroy() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.powerBtnEl && this.handlePowerBtnClick) {
      this.powerBtnEl.removeEventListener('click', this.handlePowerBtnClick);
    }
  }
}

/**
 * Factory helper to instantiate and initialize the CRT Controller.
 * @param {Object} [options]
 * @returns {CRTController}
 */
export function initCRT(options) {
  return new CRTController(options);
}
