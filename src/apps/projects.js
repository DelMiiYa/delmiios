/**
 * Projects File Explorer Application (DelMiiOS)
 * ============================================
 * File-explorer directory of featured projects with category folders,
 * technology tag filtering, project detail preview pane, and cross-app navigation
 * to Contact ("Discuss this project").
 */

import { profile } from '../data/profile.js';
import { icons } from '../core/icons.js';
import { sound } from '../core/sound.js';

export const projectsApp = {
  id: 'projects',
  title: 'Projects — File Explorer',
  shortTitle: 'Projects',
  desktopLabel: 'Projects',
  description: 'File-explorer directory of featured projects',
  icon: icons.projects,
  defaultWidth: 760,
  defaultHeight: 520,

  render(container, ctx) {
    const { openApp, windowManager } = ctx || {};
    const navApp = (appId, payload) => {
      if (typeof openApp === 'function') {
        openApp(appId, payload);
      } else if (windowManager && typeof windowManager.openApp === 'function') {
        windowManager.openApp(appId, payload);
      }
    };

    const allProjects = profile.projects || [];
    const categories = ['All', ...new Set(allProjects.map((p) => p.category).filter(Boolean))];

    let activeCategory = 'All';
    let activeTechFilter = null;
    let selectedProjectId = allProjects[0]?.id || null;

    container.innerHTML = `
      <div class="app-projects">
        <div class="explorer-bar">
          <div class="explorer-path" aria-label="Current Directory">
            <span class="explorer-path-icon" aria-hidden="true">${icons.projects}</span>
            <span class="explorer-path-text">/home/${profile.username}/projects</span>
            <div id="explorer-active-filter" class="explorer-filter-pill-wrap"></div>
          </div>
          <div class="explorer-count" id="projects-count-label"></div>
        </div>

        <div class="explorer-layout">
          <aside class="explorer-sidebar" aria-label="Project Categories">
            <div class="explorer-sidebar-title">Folders</div>
            <nav class="explorer-folder-list" id="projects-folder-list"></nav>
          </aside>

          <main class="explorer-content-split">
            <div class="explorer-main" id="projects-grid" role="region" aria-label="Project List"></div>
            <aside class="explorer-detail-pane" id="projects-detail-pane" role="region" aria-label="Project Details"></aside>
          </main>
        </div>
      </div>
    `;

    const folderListEl = container.querySelector('#projects-folder-list');
    const gridEl = container.querySelector('#projects-grid');
    const detailPaneEl = container.querySelector('#projects-detail-pane');
    const countLabelEl = container.querySelector('#projects-count-label');
    const activeFilterEl = container.querySelector('#explorer-active-filter');

    function matchesFilter(proj) {
      // Category filter
      if (activeCategory !== 'All' && proj.category !== activeCategory) {
        return false;
      }

      // Tech / skill tag filter
      if (activeTechFilter) {
        const query = activeTechFilter.trim().toLowerCase();
        const techMatch = (proj.tech || []).some(
          (t) => t.toLowerCase() === query || t.toLowerCase().includes(query)
        );
        const titleMatch = (proj.title || '').toLowerCase().includes(query);
        const descMatch = (proj.description || '').toLowerCase().includes(query);
        const catMatch = (proj.category || '').toLowerCase().includes(query);

        if (!techMatch && !titleMatch && !descMatch && !catMatch) {
          return false;
        }
      }

      return true;
    }

    function renderFilterPill() {
      if (activeTechFilter) {
        activeFilterEl.innerHTML = `
          <div class="explorer-filter-pill">
            <span>Filtered by skill: <strong>${activeTechFilter}</strong></span>
            <button type="button" class="explorer-filter-clear-btn" id="clear-filter-btn" aria-label="Clear active filter" title="Clear filter">
              &times;
            </button>
          </div>
        `;
        const clearBtn = activeFilterEl.querySelector('#clear-filter-btn');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            sound.playClick();
            activeTechFilter = null;
            renderAll();
          });
        }
      } else {
        activeFilterEl.innerHTML = '';
      }
    }

    function renderFolders() {
      folderListEl.innerHTML = categories
        .map(
          (cat) => `
          <button
            type="button"
            class="explorer-folder-btn ${cat === activeCategory && !activeTechFilter ? 'explorer-folder-btn--active' : ''}"
            data-category="${cat}"
          >
            <span class="explorer-folder-icon" aria-hidden="true">📁</span>
            <span class="explorer-folder-name">${cat}</span>
          </button>
        `
        )
        .join('');

      folderListEl.querySelectorAll('.explorer-folder-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          sound.playClick();
          activeCategory = btn.dataset.category;
          activeTechFilter = null;
          renderAll();
        });
      });
    }

    function renderDetailPane(proj) {
      if (!proj) {
        detailPaneEl.innerHTML = `
          <div class="detail-empty">
            <span class="detail-empty-icon" aria-hidden="true">${icons.folder}</span>
            <p>Select a project from the explorer list to view full specifications and architecture notes.</p>
          </div>
        `;
        return;
      }

      const liveBtn =
        proj.liveUrl && proj.liveUrl !== '#'
          ? `<a href="${proj.liveUrl}" target="_blank" rel="noopener noreferrer" class="os-btn os-btn--sm os-btn--primary">
              <span>Live Demo</span>
              <span class="btn-ext-icon">${icons.external}</span>
            </a>`
          : '';

      const repoBtn = proj.repoUrl
        ? `<a href="${proj.repoUrl}" target="_blank" rel="noopener noreferrer" class="os-btn os-btn--sm">
            <span>Source Code</span>
            <span class="btn-ext-icon">${icons.external}</span>
          </a>`
        : '';

      const tagsHtml = (proj.tech || [])
        .map(
          (t) => `
          <button type="button" class="project-tech-tag project-tech-tag--clickable" data-tag="${t}" title="Filter by ${t}">
            ${t}
          </button>
        `
        )
        .join('');

      detailPaneEl.innerHTML = `
        <div class="detail-content">
          <div class="detail-header">
            <div class="detail-category-badge">${proj.category}</div>
            <h3 class="detail-title">${proj.title}</h3>
            <div class="detail-meta">
              <span class="project-badge">${proj.status}</span>
              <span class="project-date">${proj.date}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4 class="detail-subtitle">Overview</h4>
            <p class="detail-text">${proj.description}</p>
          </div>

          ${
            proj.details
              ? `
            <div class="detail-section">
              <h4 class="detail-subtitle">Architecture & Technical Details</h4>
              <p class="detail-text detail-text--secondary">${proj.details}</p>
            </div>
          `
              : ''
          }

          <div class="detail-section">
            <h4 class="detail-subtitle">Tech Stack</h4>
            <div class="project-tech-list">
              ${tagsHtml}
            </div>
          </div>

          <div class="detail-actions">
            ${liveBtn}
            ${repoBtn}
            <button
              type="button"
              class="os-btn os-btn--sm os-btn--discuss"
              data-discuss-project="${proj.title}"
              title="Compose message inquiry regarding ${proj.title}"
            >
              <span>Discuss this project</span>
              <span class="btn-ext-icon">${icons.send}</span>
            </button>
          </div>
        </div>
      `;

      // Wire tag click filters
      detailPaneEl.querySelectorAll('[data-tag]').forEach((tagBtn) => {
        tagBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playClick();
          activeTechFilter = tagBtn.dataset.tag;
          activeCategory = 'All';
          renderAll();
        });
      });

      // Wire discuss project button
      const discussBtn = detailPaneEl.querySelector('[data-discuss-project]');
      if (discussBtn) {
        discussBtn.addEventListener('click', () => {
          sound.playClick();
          navApp('contact', {
            subject: `Project Inquiry: ${discussBtn.dataset.discussProject}`
          });
        });
      }
    }

    function renderProjects() {
      const filtered = allProjects.filter(matchesFilter);

      countLabelEl.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div class="explorer-empty-state">
            <p class="explorer-empty-msg">No projects found matching the active filter.</p>
            <button type="button" class="os-btn os-btn--sm" id="reset-projects-view-btn">
              Show All Projects
            </button>
          </div>
        `;
        const resetBtn = gridEl.querySelector('#reset-projects-view-btn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            sound.playClick();
            activeCategory = 'All';
            activeTechFilter = null;
            renderAll();
          });
        }
        renderDetailPane(null);
        return;
      }

      // If previously selected project is not in filtered list, select the first matching project
      if (!filtered.some((p) => p.id === selectedProjectId)) {
        selectedProjectId = filtered[0].id;
      }

      gridEl.innerHTML = filtered
        .map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          const tagsHtml = (proj.tech || [])
            .map(
              (t) => `
              <button type="button" class="project-tech-tag project-tech-tag--clickable" data-tag="${t}" title="Filter by ${t}">
                ${t}
              </button>
            `
            )
            .join('');

          return `
            <article class="project-card ${isSelected ? 'project-card--selected' : ''}" data-project-id="${proj.id}">
              <div class="project-card-header">
                <div class="project-card-title-row">
                  <span class="project-file-icon" aria-hidden="true">📦</span>
                  <h3 class="project-card-title">${proj.title}</h3>
                </div>
                <div class="project-card-meta">
                  <span class="project-badge">${proj.status}</span>
                  <span class="project-date">${proj.date}</span>
                </div>
              </div>

              <p class="project-card-desc">${proj.description}</p>

              <div class="project-card-footer">
                <div class="project-tech-list" aria-label="Technologies used">
                  ${tagsHtml}
                </div>
                <div class="project-card-quick-actions">
                  <button
                    type="button"
                    class="os-btn os-btn--sm"
                    data-discuss-project="${proj.title}"
                    title="Send inquiry about this project"
                  >
                    <span>Discuss</span>
                  </button>
                </div>
              </div>
            </article>
          `;
        })
        .join('');

      // Wire project card selection
      gridEl.querySelectorAll('.project-card').forEach((card) => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('[data-tag]') || e.target.closest('[data-discuss-project]')) {
            return;
          }
          sound.playClick();
          selectedProjectId = card.dataset.projectId;
          renderAll();
        });
      });

      // Wire tag click filters inside cards
      gridEl.querySelectorAll('[data-tag]').forEach((tagBtn) => {
        tagBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playClick();
          activeTechFilter = tagBtn.dataset.tag;
          activeCategory = 'All';
          renderAll();
        });
      });

      // Wire discuss project inside cards
      gridEl.querySelectorAll('[data-discuss-project]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          sound.playClick();
          navApp('contact', {
            subject: `Project Inquiry: ${btn.dataset.discussProject}`
          });
        });
      });

      // Update detail pane with current selection
      const activeProj = allProjects.find((p) => p.id === selectedProjectId) || filtered[0];
      renderDetailPane(activeProj);
    }

    function renderAll() {
      renderFilterPill();
      renderFolders();
      renderProjects();
    }

    function applyPayload(payload) {
      if (!payload || typeof payload !== 'object') return;

      if (payload.filterTag) {
        activeTechFilter = String(payload.filterTag).trim();
        activeCategory = 'All';
      }

      if (payload.projectId) {
        selectedProjectId = String(payload.projectId).trim();
      }

      renderAll();
    }

    // Process initial payload if passed upon open
    if (ctx && ctx.payload) {
      applyPayload(ctx.payload);
    } else {
      renderAll();
    }

    return {
      onPayload(nextPayload) {
        applyPayload(nextPayload);
      }
    };
  }
};
