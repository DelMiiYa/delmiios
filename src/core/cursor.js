/**
 * Custom Triangle Cursor & Continuous Canvas Trail Controller (DelMiiOS)
 * =====================================================================
 * Implements an osu!-style red equilateral triangle cursor with center dot hotspot,
 * velocity heading orientation along the shortest angular path, continuous idle spin
 * after ~180ms, interactive hover/press feedback, and a full-viewport HiDPI canvas
 * continuous fading white line trail with battery-friendly rAF stopping.
 *
 * Exports pure math functions for unit testing:
 * - normalizeAngle(rad)
 * - shortestAngleDelta(fromRad, toRad)
 * - stepAngle(currentRad, targetRad, smoothing)
 * - computeHeading(dx, dy, minSpeed)
 * - pruneTrailPoints(points, nowMs, maxAgeMs, maxPoints)
 * - computeSmoothTrailSegments(points)
 */

import { settingsStore } from './settings.js';

// =============================================================================
// Exported Pure Math Functions
// =============================================================================

/**
 * Wraps any angle in radians into the canonical interval [-Math.PI, Math.PI].
 * @param {number} rad
 * @returns {number}
 */
export function normalizeAngle(rad) {
  if (!Number.isFinite(rad)) return 0;
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Returns the shortest signed angular difference (toRad - fromRad) in [-Math.PI, Math.PI].
 * Correctly accounts for +/- PI wraparound.
 * @param {number} fromRad
 * @returns {number}
 */
export function shortestAngleDelta(fromRad, toRad) {
  return normalizeAngle(toRad - fromRad);
}

/**
 * Moves currentRad toward targetRad along the shortest angular path by factor smoothing.
 * @param {number} currentRad
 * @param {number} targetRad
 * @param {number} [smoothing=0.28] - Step factor in [0, 1]
 * @returns {number} Normalized angle in [-Math.PI, Math.PI]
 */
export function stepAngle(currentRad, targetRad, smoothing = 0.28) {
  const factor = Math.max(0, Math.min(1, Number.isFinite(smoothing) ? smoothing : 0.28));
  const delta = shortestAngleDelta(currentRad, targetRad);
  return normalizeAngle(currentRad + delta * factor);
}

/**
 * Computes movement heading angle in radians from velocity vector (dx, dy).
 * If movement speed is below minSpeed, returns null to avoid jitter on micro-movements.
 * @param {number} dx
 * @param {number} dy
 * @param {number} [minSpeed=0.6]
 * @returns {number|null} Angle in [-Math.PI, Math.PI] or null
 */
export function computeHeading(dx, dy, minSpeed = 0.6) {
  const speed = Math.hypot(dx, dy);
  if (speed < minSpeed) return null;
  return Math.atan2(dy, dx);
}

/**
 * Filters points keeping only those within maxAgeMs of nowMs, limited to the newest maxPoints.
 * @param {Array<{x: number, y: number, t: number}>} points
 * @param {number} nowMs
 * @param {number} [maxAgeMs=380]
 * @param {number} [maxPoints=80]
 * @returns {Array<{x: number, y: number, t: number}>}
 */
export function pruneTrailPoints(points, nowMs, maxAgeMs = 380, maxPoints = 80) {
  if (!Array.isArray(points)) return [];
  const maxAge = Number.isFinite(maxAgeMs) ? maxAgeMs : 380;
  const maxPts = Number.isFinite(maxPoints) ? maxPoints : 80;

  const filtered = points.filter(
    (p) =>
      p &&
      typeof p.x === 'number' &&
      typeof p.y === 'number' &&
      typeof p.t === 'number' &&
      nowMs - p.t <= maxAge
  );

  if (filtered.length > maxPts) {
    return filtered.slice(filtered.length - maxPts);
  }
  return filtered;
}

/**
 * Computes smooth quadratic curve segments connecting points via midpoint interpolation.
 * Produces continuous spline segments with zero sharp corners or gaps.
 * @param {Array<{x: number, y: number, t: number}>} points
 * @returns {Array<{fromX: number, fromY: number, cpX: number, cpY: number, toX: number, toY: number, t: number}>}
 */
export function computeSmoothTrailSegments(points) {
  if (!Array.isArray(points) || points.length < 2) return [];
  const segments = [];

  if (points.length === 2) {
    segments.push({
      fromX: points[0].x,
      fromY: points[0].y,
      cpX: (points[0].x + points[1].x) / 2,
      cpY: (points[0].y + points[1].y) / 2,
      toX: points[1].x,
      toY: points[1].y,
      t: points[1].t
    });
    return segments;
  }

  let prevX = points[0].x;
  let prevY = points[0].y;

  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    segments.push({
      fromX: prevX,
      fromY: prevY,
      cpX: points[i].x,
      cpY: points[i].y,
      toX: midX,
      toY: midY,
      t: points[i].t
    });
    prevX = midX;
    prevY = midY;
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  segments.push({
    fromX: prevX,
    fromY: prevY,
    cpX: secondLast.x,
    cpY: secondLast.y,
    toX: last.x,
    toY: last.y,
    t: last.t
  });

  return segments;
}

// Alias for backwards compatibility with plan references
export const computeSmoothMidpoints = computeSmoothTrailSegments;

// =============================================================================
// CursorController Class
// =============================================================================

export class CursorController {
  /**
   * @param {Object} [options]
   * @param {import('./settings.js').SettingsStore} [options.settingsStore]
   * @param {HTMLElement} [options.container]
   */
  constructor({ settingsStore: store = settingsStore, container = (typeof document !== 'undefined' ? document.body : null) } = {}) {
    this.settingsStore = store;
    this.container = container;

    // Runtime state
    this.mouseX = -100;
    this.mouseY = -100;
    this.prevMouseX = -100;
    this.prevMouseY = -100;
    this.currentAngle = 0;
    this.targetAngle = 0;
    this.lastMoveTime = 0;
    this.lastFrameTime = 0;
    this.rafId = null;

    this.points = []; // trail buffer
    this.isVisible = false;
    this.isActive = false; // true when fine pointer & customCursor enabled
    this.isPressed = false;
    this.unsubscribe = null;

    // Check fine-pointer capability
    this.isFinePointer =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(pointer: fine)').matches;

    if (this.isFinePointer && this.container) {
      this.mountDOM();
      this.bindEvents();
      this.initSettings();
    }
  }

  prefersReducedMotion() {
    return (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  mountDOM() {
    // Mount continuous trail canvas
    this.canvasEl = document.createElement('canvas');
    this.canvasEl.className = 'cursor-trail-canvas';
    this.canvasEl.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvasEl.getContext('2d');
    this.container.appendChild(this.canvasEl);
    this.resizeCanvas();

    // Mount red equilateral triangle cursor with center dot hotspot
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-cursor';
    this.cursorEl.id = 'custom-cursor';
    this.cursorEl.setAttribute('aria-hidden', 'true');

    // Equilateral triangle centered at (0, 0) with forward vertex at (14, 0) (+X, 0 deg)
    // and center dot at (0, 0)
    this.cursorEl.innerHTML = `
      <div class="custom-cursor-rotor">
        <svg class="custom-cursor-svg" viewBox="-16 -16 32 32" width="32" height="32" aria-hidden="true">
          <polygon points="14,0 -7,12.12 -7,-12.12" class="cursor-triangle" />
          <circle cx="0" cy="0" r="2.2" class="cursor-dot" />
        </svg>
      </div>
    `;

    this.rotorEl = this.cursorEl.querySelector('.custom-cursor-rotor');
    this.container.appendChild(this.cursorEl);
  }

  resizeCanvas() {
    if (!this.canvasEl || !this.ctx || typeof window === 'undefined') return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvasEl.width = Math.round(w * dpr);
    this.canvasEl.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  bindEvents() {
    this.handleResize = () => this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);

    this.handlePointerMove = (e) => {
      this.isVisible = true;
      const now = performance.now();
      const curX = e.clientX;
      const curY = e.clientY;

      if (this.prevMouseX === -100) {
        this.prevMouseX = curX;
        this.prevMouseY = curY;
      }

      const dx = curX - this.prevMouseX;
      const dy = curY - this.prevMouseY;

      this.mouseX = curX;
      this.mouseY = curY;
      this.prevMouseX = curX;
      this.prevMouseY = curY;

      const heading = computeHeading(dx, dy, 0.6);
      if (heading !== null) {
        this.targetAngle = heading;
      }
      this.lastMoveTime = now;

      const state = this.settingsStore ? this.settingsStore.getState() : { cursorTrail: true };
      const reduced = this.prefersReducedMotion();
      if (state.cursorTrail && !reduced) {
        this.points.push({ x: curX, y: curY, t: now });
      }

      this.startLoop();
    };
    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });

    this.handlePointerDown = () => {
      this.isPressed = true;
      if (this.cursorEl) {
        this.cursorEl.classList.add('custom-cursor--pressed');
      }
    };
    window.addEventListener('pointerdown', this.handlePointerDown, { passive: true });

    this.handlePointerUp = () => {
      this.isPressed = false;
      if (this.cursorEl) {
        this.cursorEl.classList.remove('custom-cursor--pressed');
      }
    };
    window.addEventListener('pointerup', this.handlePointerUp, { passive: true });

    // Interactive element hover detection
    this.handlePointerOver = (e) => {
      if (!this.cursorEl) return;
      const target = e.target;
      const isInteractive = Boolean(
        target &&
          target.closest &&
          target.closest(
            'button, a, input, textarea, select, label, [role="button"], [role="radio"], [role="menuitem"], .os-window-titlebar, .desktop-icon, .clickable, .tab-btn, .theme-preset-card, .wallpaper-card, .accent-swatch-btn, .taskbar-win-btn, .taskbar-tray-btn'
          )
      );
      this.cursorEl.classList.toggle('custom-cursor--hover', isInteractive);
    };
    window.addEventListener('pointerover', this.handlePointerOver, { passive: true });

    // Handle pointer leaving / entering document
    this.handleMouseLeave = () => {
      this.isVisible = false;
      if (this.cursorEl) {
        this.cursorEl.style.display = 'none';
      }
    };
    document.addEventListener('mouseleave', this.handleMouseLeave);

    this.handleMouseEnter = () => {
      this.isVisible = true;
      if (this.cursorEl && this.isActive) {
        this.cursorEl.style.display = 'block';
      }
      this.startLoop();
    };
    document.addEventListener('mouseenter', this.handleMouseEnter);
  }

  initSettings() {
    if (!this.settingsStore) return;

    this.applySettings(this.settingsStore.getState());
    this.unsubscribe = this.settingsStore.subscribe((state) => {
      this.applySettings(state);
    });
  }

  /**
   * Applies custom cursor & trail settings.
   * @param {Object} state
   */
  applySettings(state = {}) {
    if (!this.isFinePointer) return;

    const enabled = Boolean(state.customCursor);
    this.isActive = enabled;

    if (enabled) {
      document.documentElement.classList.add('has-custom-cursor');
      if (this.cursorEl && this.isVisible) {
        this.cursorEl.style.display = 'block';
      }
    } else {
      document.documentElement.classList.remove('has-custom-cursor');
      if (this.cursorEl) {
        this.cursorEl.style.display = 'none';
      }
    }

    if (!state.cursorTrail) {
      this.points = [];
      this.clearCanvas();
    }

    this.startLoop();
  }

  clearCanvas() {
    if (!this.ctx || typeof window === 'undefined') return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  startLoop() {
    if (!this.rafId && typeof requestAnimationFrame !== 'undefined') {
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame((now) => this.tick(now));
    }
  }

  tick(now) {
    this.rafId = null;

    const state = this.settingsStore ? this.settingsStore.getState() : { customCursor: true, cursorTrail: true };
    const reducedMotion = this.prefersReducedMotion();

    // 1. Update cursor element position and rotation
    if (this.isActive && this.isVisible && this.cursorEl) {
      this.cursorEl.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`;

      const timeSinceMove = now - this.lastMoveTime;
      if (timeSinceMove < 180) {
        // Active movement: ease toward target movement heading
        this.currentAngle = stepAngle(this.currentAngle, this.targetAngle, 0.28);
      } else if (!reducedMotion) {
        // Idle state: seamless continuous slow spin (~30 deg/s = 0.5236 rad/s)
        const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
        this.currentAngle = normalizeAngle(this.currentAngle + 0.5236 * dt);
      }

      if (this.rotorEl) {
        const deg = this.currentAngle * (180 / Math.PI);
        this.rotorEl.style.transform = `rotate(${deg}deg)`;
      }
    }

    // 2. Update continuous white trail canvas
    const maxAgeMs = reducedMotion ? 80 : 380;
    if (state.cursorTrail && this.points.length > 0) {
      this.points = pruneTrailPoints(this.points, now, maxAgeMs, 80);
      this.renderTrail(now, maxAgeMs);
    } else if (this.points.length > 0) {
      this.points = [];
      this.clearCanvas();
    }

    this.lastFrameTime = now;

    // 3. Idle rAF optimization: stop loop if no spin needed and no trail points remaining
    const shouldSpin = this.isActive && this.isVisible && !reducedMotion;
    const hasTrail = state.cursorTrail && this.points.length > 0;

    if (shouldSpin || hasTrail) {
      this.rafId = requestAnimationFrame((t) => this.tick(t));
    }
  }

  renderTrail(now, maxAgeMs) {
    if (!this.ctx || typeof window === 'undefined') return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);

    if (this.points.length < 2) return;

    const segments = computeSmoothTrailSegments(this.points);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (const seg of segments) {
      const age = now - seg.t;
      const progress = Math.max(0, Math.min(1, 1 - age / maxAgeMs));
      if (progress <= 0) continue;

      this.ctx.beginPath();
      this.ctx.moveTo(seg.fromX, seg.fromY);
      this.ctx.quadraticCurveTo(seg.cpX, seg.cpY, seg.toX, seg.toY);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${progress.toFixed(3)})`;
      this.ctx.lineWidth = Math.max(0.6, 1.8 * progress);
      this.ctx.stroke();
    }
  }

  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('pointermove', this.handlePointerMove);
      window.removeEventListener('pointerdown', this.handlePointerDown);
      window.removeEventListener('pointerup', this.handlePointerUp);
      window.removeEventListener('pointerover', this.handlePointerOver);
      document.removeEventListener('mouseleave', this.handleMouseLeave);
      document.removeEventListener('mouseenter', this.handleMouseEnter);
    }

    document.documentElement.classList.remove('has-custom-cursor');

    if (this.cursorEl) {
      this.cursorEl.remove();
      this.cursorEl = null;
    }

    if (this.canvasEl) {
      this.canvasEl.remove();
      this.canvasEl = null;
    }
  }
}

/**
 * Factory to initialize and return CursorController singleton.
 * @param {Object} [options]
 * @returns {CursorController}
 */
export function initCursor(options) {
  return new CursorController(options);
}
