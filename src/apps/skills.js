/**
 * Skills System Monitor Application (DelMiiOS)
 * ============================================
 * Task-manager & system performance monitor displaying system specifications,
 * categorized capability progress meters, and interactive module tags that
 * navigate to Projects filtered by technology tag.
 */

import { profile } from '../data/profile.js';
import { icons } from '../core/icons.js';
import { sound } from '../core/sound.js';

export const skillsApp = {
  id: 'skills',
  title: 'Skills — System Monitor',
  shortTitle: 'Skills',
  desktopLabel: 'Skills',
  description: 'System capabilities, stack proficiencies & meters',
  icon: icons.skills,
  defaultWidth: 700,
  defaultHeight: 510,

  render(container, ctx) {
    const { openApp, windowManager } = ctx || {};
    const navApp = (appId, payload) => {
      if (typeof openApp === 'function') {
        openApp(appId, payload);
      } else if (windowManager && typeof windowManager.openApp === 'function') {
        windowManager.openApp(appId, payload);
      }
    };

    const { systemSpecs, categories, additionalTags } = profile.skills || {};

    const categoriesHtml = (categories || [])
      .map((cat) => {
        const rowsHtml = (cat.items || [])
          .map((skill) => {
            const filterValue = skill.filterTag || skill.name;
            return `
              <div class="skill-row">
                <button
                  type="button"
                  class="skill-row-btn"
                  data-skill-filter="${filterValue}"
                  aria-label="View projects matching ${skill.name}"
                  title="Click to view projects matching ${skill.name}"
                >
                  <div class="skill-row-header">
                    <span class="skill-name">${skill.name}</span>
                    <div class="skill-meta">
                      <span class="skill-tag">${skill.tag || 'Skill'}</span>
                      <span class="skill-percent">${skill.level}%</span>
                    </div>
                  </div>
                  <div
                    class="skill-bar-track"
                    role="progressbar"
                    aria-label="${skill.name} proficiency"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="${skill.level}"
                  >
                    <div class="skill-bar-fill" style="width: ${skill.level}%"></div>
                  </div>
                </button>
              </div>
            `;
          })
          .join('');

        return `
          <section class="skills-category-card">
            <div class="skills-category-header">
              <h3 class="skills-category-title">${cat.name}</h3>
              ${cat.description ? `<p class="skills-category-desc">${cat.description}</p>` : ''}
            </div>
            <div class="skills-list">
              ${rowsHtml}
            </div>
          </section>
        `;
      })
      .join('');

    const tagsHtml = (additionalTags || [])
      .map(
        (tag) => `
        <button
          type="button"
          class="sys-module-chip sys-module-chip--interactive"
          data-skill-filter="${tag}"
          aria-label="Filter projects by ${tag}"
          title="Click to view projects using ${tag}"
        >
          <span class="sys-module-icon" aria-hidden="true">#</span>
          <span>${tag}</span>
        </button>
      `
      )
      .join('');

    container.innerHTML = `
      <div class="app-skills">
        <!-- System Specifications Banner -->
        <div class="sysinfo-banner" role="region" aria-label="System Specifications">
          <div class="sysinfo-stat">
            <span class="sysinfo-label">OS VERSION</span>
            <span class="sysinfo-value">${systemSpecs?.osName || 'AetherOS v2.4'}</span>
          </div>
          <div class="sysinfo-stat">
            <span class="sysinfo-label">ENGINE</span>
            <span class="sysinfo-value">${systemSpecs?.kernel || 'Vanilla-JS Microkernel'}</span>
          </div>
          <div class="sysinfo-stat">
            <span class="sysinfo-label">STATUS</span>
            <span class="sysinfo-value sysinfo-value--online">${systemSpecs?.uptime || 'Online'}</span>
          </div>
          <div class="sysinfo-stat">
            <span class="sysinfo-label">MEMORY</span>
            <span class="sysinfo-value">${systemSpecs?.memory || '16.0 GB Virtual RAM'}</span>
          </div>
        </div>

        <!-- Cross-App Interaction Hint -->
        <div class="skills-tip-banner" role="note">
          <span class="skills-tip-icon" aria-hidden="true">💡</span>
          <span>Tip: Click any skill or module tag below to view matching projects in File Explorer.</span>
        </div>

        <!-- Categorized Skills Grid -->
        <div class="skills-grid">
          ${categoriesHtml}
        </div>

        <!-- Loaded Modules & Additional Capabilities -->
        <section class="skills-modules-section">
          <h3 class="skills-category-title">Loaded Modules & Additional Capabilities</h3>
          <div class="sys-modules-wrap">
            ${tagsHtml}
          </div>
        </section>
      </div>
    `;

    // Wire click events on all skill buttons and module chips
    container.querySelectorAll('[data-skill-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const filterTag = btn.dataset.skillFilter;
        navApp('projects', { filterTag });
      });
    });

    return {};
  }
};
