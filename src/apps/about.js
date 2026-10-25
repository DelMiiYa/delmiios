/**
 * About Me.txt Application (DelMiiOS)
 * ===================================
 * Notepad-style application presenting personal biography, quick facts,
 * experience timeline, interests, and cross-app navigation to Projects & Contact.
 */

import { profile, getAvatarInitials } from '../data/profile.js';
import { icons } from '../core/icons.js';

export const aboutApp = {
  id: 'about',
  title: 'About Me.txt — Notepad',
  shortTitle: 'About Me.txt',
  desktopLabel: 'About Me.txt',
  description: 'Personal biography, experience & interests',
  icon: icons.about,
  defaultWidth: 660,
  defaultHeight: 500,

  render(container, ctx) {
    const { openApp, windowManager } = ctx || {};
    const navApp = (appId, payload) => {
      if (typeof openApp === 'function') {
        openApp(appId, payload);
      } else if (windowManager && typeof windowManager.openApp === 'function') {
        windowManager.openApp(appId, payload);
      }
    };

    const paragraphsHtml = (profile.about.summary || [])
      .map((p) => `<p class="about-paragraph">${p}</p>`)
      .join('');

    const factsHtml = (profile.about.quickFacts || [])
      .map(
        (fact) => `
        <div class="about-fact-item">
          <span class="about-fact-label">${fact.label}</span>
          <span class="about-fact-value">${fact.value}</span>
        </div>
      `
      )
      .join('');

    const experienceHtml = (profile.about.experience || [])
      .map(
        (exp) => `
        <div class="about-timeline-item">
          <div class="timeline-header">
            <span class="timeline-role">${exp.role}</span>
            <span class="timeline-sep">·</span>
            <span class="timeline-company">${exp.company}</span>
          </div>
          <div class="timeline-period">${exp.period}</div>
          <ul class="timeline-highlights">
            ${(exp.highlights || []).map((h) => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      `
      )
      .join('');

    const interestsHtml = (profile.about.interests || [])
      .map((item) => `<li class="about-interest-tag">${item}</li>`)
      .join('');

    const initials = getAvatarInitials(profile.name);

    container.innerHTML = `
      <div class="app-about">
        <div class="notepad-toolbar" role="status" aria-label="Notepad File Information">
          <span>File: <strong>${profile.about.fileName || 'About Me.txt'}</strong></span>
          <span>Encoding: UTF-8</span>
          <span>Modified: ${profile.about.lastModified || '2026-10-25'}</span>
        </div>

        <div class="about-content">
          <div class="about-hero">
            <div class="about-photo-placeholder" aria-label="Profile Photo Placeholder">
              <span class="about-photo-initials">${initials}</span>
              <span class="about-photo-caption">TODO: Photo</span>
            </div>

            <div class="about-hero-details">
              <div class="about-status-pill">
                <span class="status-dot" aria-hidden="true"></span>
                <span>${profile.status}</span>
              </div>
              <h1 class="about-name">${profile.name}</h1>
              <p class="about-role">${profile.role}</p>
              <p class="about-location">📍 ${profile.location}</p>
            </div>
          </div>

          <hr class="app-divider" />

          <section class="about-section" aria-label="Biography">
            <h3 class="about-section-title">// README / BIOGRAPHY</h3>
            <div class="about-paragraphs-wrap">
              ${paragraphsHtml}
            </div>
          </section>

          <section class="about-section" aria-label="Quick Facts">
            <h3 class="about-section-title">// QUICK FACTS</h3>
            <div class="about-facts-grid">
              ${factsHtml}
            </div>
          </section>

          ${
            experienceHtml
              ? `
            <section class="about-section" aria-label="Experience Timeline">
              <h3 class="about-section-title">// EXPERIENCE TIMELINE</h3>
              <div class="about-timeline">
                ${experienceHtml}
              </div>
            </section>
          `
              : ''
          }

          <section class="about-section" aria-label="Interests & Focus Areas">
            <h3 class="about-section-title">// INTERESTS & FOCUS AREAS</h3>
            <ul class="about-interests-list">
              ${interestsHtml}
            </ul>
          </section>

          <div class="about-actions">
            <button type="button" class="os-btn os-btn--primary" data-open-app="projects">
              Explore Projects
            </button>
            <button type="button" class="os-btn" data-open-app="contact">
              Contact Me
            </button>
          </div>
        </div>
      </div>
    `;

    // Wire cross-app navigation buttons
    container.querySelectorAll('[data-open-app]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navApp(btn.dataset.openApp);
      });
    });

    return {};
  }
};
