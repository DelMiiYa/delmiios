/**
 * Branded Boot Sequence for DelMiiOS (AetherOS v2.4)
 * =================================================
 * Features authentic BIOS/Kernel scrolling logs, progress indicator,
 * Web Audio startup chime, and skip support via click, Space, Enter, or Escape.
 * Respects prefers-reduced-motion by shortening or bypassing long delays.
 */

import { profile } from '../data/profile.js';
import { icons } from './icons.js';
import { sound } from './sound.js';

const BOOT_LOG_ENTRIES = [
  `Initializing ${profile.system.osName} microkernel...`,
  `Virtual CPU: Octa-Core @ 3.80 GHz (${profile.system.kernel})`,
  `Memory Check: ${profile.skills.systemSpecs.memory} [OK]`,
  `Mounting virtual filesystem /home/${profile.username} ...`,
  `Initializing window compositor, theme engine, and audio synthesizer...`,
  `Desktop environment ready. Welcome!`
];

/**
 * Runs the simulated boot sequence inside `container`.
 * Resolves and invokes `onComplete` when finished or skipped.
 * @param {HTMLElement} container
 * @param {() => void} [onComplete]
 * @returns {() => void} Function to force-cancel boot
 */
export function runBootSequence(container, onComplete) {
  if (!container) {
    if (typeof onComplete === 'function') onComplete();
    return () => {};
  }

  let completed = false;
  const timers = [];

  const overlay = document.createElement('div');
  overlay.className = 'boot-screen';
  overlay.id = 'boot-screen';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `${profile.system.osName} Boot Sequence`);
  overlay.tabIndex = -1;

  overlay.innerHTML = `
    <div class="boot-card">
      <div class="boot-header">
        <div class="boot-logo" aria-hidden="true">${icons.logo}</div>
        <div class="boot-header-meta">
          <h1 class="boot-title">${profile.system.osName} <span class="boot-badge">${profile.system.osCodename}</span></h1>
          <p class="boot-subtitle">${profile.system.kernel}</p>
        </div>
      </div>

      <div class="boot-log" id="boot-log-list" aria-live="polite"></div>

      <div class="boot-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="boot-progressbar">
        <div class="boot-progress-fill" id="boot-progress-fill"></div>
      </div>

      <div class="boot-footer">
        <span class="boot-status" id="boot-status-text">Booting system...</span>
        <button type="button" class="boot-skip-btn" id="boot-skip-btn" aria-label="Skip boot sequence">
          Skip (Click or Space / Enter / Esc)
        </button>
      </div>
    </div>
  `;

  container.appendChild(overlay);
  overlay.focus();

  const logList = overlay.querySelector('#boot-log-list');
  const progressFill = overlay.querySelector('#boot-progress-fill');
  const progressBar = overlay.querySelector('#boot-progressbar');
  const statusText = overlay.querySelector('#boot-status-text');
  const skipBtn = overlay.querySelector('#boot-skip-btn');

  function finishBoot() {
    if (completed) return;
    completed = true;

    timers.forEach((id) => clearTimeout(id));
    window.removeEventListener('keydown', handleKeydown);
    overlay.removeEventListener('click', handleOverlayClick);

    sound.playStartup();
    overlay.classList.add('boot-screen--hiding');

    setTimeout(() => {
      overlay.remove();
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, 220);
  }

  function handleKeydown(e) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      finishBoot();
    }
  }

  function handleOverlayClick(e) {
    // If user clicked inside the card on anything other than the skip button, still allow skipping
    if (e.target === overlay || e.target.closest('.boot-card')) {
      finishBoot();
    }
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      finishBoot();
    });
  }

  window.addEventListener('keydown', handleKeydown);
  overlay.addEventListener('click', handleOverlayClick);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Fast-path boot in 120ms
    const t = setTimeout(finishBoot, 120);
    timers.push(t);
    return finishBoot;
  }

  const stepDuration = 320;
  BOOT_LOG_ENTRIES.forEach((line, index) => {
    const delay = index * stepDuration + 60;
    const timerId = setTimeout(() => {
      if (completed) return;

      const isLast = index === BOOT_LOG_ENTRIES.length - 1;
      const logLine = document.createElement('div');
      logLine.className = `boot-log-line ${isLast ? 'boot-log-line--success' : ''}`;
      logLine.innerHTML = `<span class="boot-prefix" aria-hidden="true">&gt;</span> <span>${line}</span>`;

      if (logList) {
        logList.appendChild(logLine);
        logList.scrollTop = logList.scrollHeight;
      }

      const percent = Math.min(100, Math.round(((index + 1) / BOOT_LOG_ENTRIES.length) * 100));
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (progressBar) progressBar.setAttribute('aria-valuenow', String(percent));
      if (statusText) statusText.textContent = isLast ? 'Ready.' : `${percent}% complete...`;

      if (isLast) {
        const holdTimer = setTimeout(finishBoot, 350);
        timers.push(holdTimer);
      }
    }, delay);

    timers.push(timerId);
  });

  return finishBoot;
}
