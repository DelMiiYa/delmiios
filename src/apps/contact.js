/**
 * Contact Address Book & Mail Composer Application (DelMiiOS)
 * ===========================================================
 * Contact directory and Quick Message Composer centerpiece.
 * Supports mailto launching with pre-filled encoded fields, clipboard email copy,
 * cross-app navigation to About, and onPayload subject pre-fill from Projects.
 */

import { profile } from '../data/profile.js';
import { icons } from '../core/icons.js';
import { sound } from '../core/sound.js';

export const contactApp = {
  id: 'contact',
  title: 'Contact — Address Book & Mail',
  shortTitle: 'Contact',
  desktopLabel: 'Contact',
  description: 'Quick message composer, email & social directory',
  icon: icons.contact,
  defaultWidth: 660,
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

    const { email, availabilityNote, socials } = profile.contact || {};

    const cardsHtml = (socials || [])
      .map((item) => {
        const isMail = item.url && item.url.startsWith('mailto:');
        return `
          <a
            href="${item.url}"
            ${isMail ? '' : 'target="_blank" rel="noopener noreferrer"'}
            class="contact-card"
          >
            <div class="contact-card-top">
              <span class="contact-platform">${item.platform}</span>
              <span class="contact-ext-icon" aria-hidden="true">${icons.external}</span>
            </div>
            <div class="contact-handle">${item.handle}</div>
            <p class="contact-desc">${item.description || ''}</p>
          </a>
        `;
      })
      .join('');

    container.innerHTML = `
      <div class="app-contact">
        <!-- Header Card with Quick Actions -->
        <div class="contact-header-card">
          <div class="contact-header-info">
            <h3 class="contact-heading">Get in Touch with ${profile.name}</h3>
            <p class="contact-note">${availabilityNote || ''}</p>
          </div>
          <div class="contact-quick-actions">
            <a href="mailto:${email}" class="os-btn os-btn--primary">
              <span class="btn-icon" aria-hidden="true">${icons.send}</span>
              <span>Send Email</span>
            </a>
            <button type="button" class="os-btn" id="copy-email-btn" aria-live="polite">
              <span class="btn-icon" aria-hidden="true">${icons.copy}</span>
              <span id="copy-btn-text">Copy Email (${email})</span>
            </button>
            <button type="button" class="os-btn" data-open-app="about">
              <span class="btn-icon" aria-hidden="true">${icons.about}</span>
              <span>View About Me.txt</span>
            </button>
          </div>
        </div>

        <!-- Social Channels & Directory -->
        <div class="contact-section">
          <h4 class="contact-subheading">Directory & Social Channels</h4>
          <div class="contact-grid">
            ${cardsHtml}
          </div>
        </div>

        <!-- Quick Message Composer (Centerpiece) -->
        <form class="contact-compose-box" id="contact-compose-form">
          <div class="contact-compose-header">
            <h4 class="contact-subheading">Quick Message Composer</h4>
            <span class="contact-compose-caption">Launches your system email client with pre-filled content</span>
          </div>

          <div class="compose-row">
            <label for="compose-subject" class="compose-label">Subject</label>
            <input
              type="text"
              id="compose-subject"
              class="compose-input"
              placeholder="Project Inquiry / Collaboration"
              required
            />
          </div>

          <div class="compose-row">
            <label for="compose-body" class="compose-label">Message</label>
            <textarea
              id="compose-body"
              class="compose-textarea"
              rows="4"
              placeholder="Write your message or inquiry here..."
              required
            ></textarea>
          </div>

          <div class="compose-actions">
            <div id="compose-status" class="compose-status" aria-live="polite"></div>
            <button type="submit" class="os-btn os-btn--primary" id="compose-submit-btn">
              <span class="btn-icon" aria-hidden="true">${icons.send}</span>
              <span>Launch Mail Client</span>
            </button>
          </div>
        </form>
      </div>
    `;

    // Copy Email to Clipboard with aria-live feedback
    const copyBtn = container.querySelector('#copy-email-btn');
    const copyBtnText = container.querySelector('#copy-btn-text');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        sound.playClick();
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(email);
          } else {
            // Fallback for older browsers or non-secure contexts
            const temp = document.createElement('textarea');
            temp.value = email;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
          }
          if (copyBtnText) copyBtnText.textContent = '✓ Copied to Clipboard!';
        } catch {
          if (copyBtnText) copyBtnText.textContent = email;
        }

        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = `Copy Email (${email})`;
        }, 2000);
      });
    }

    // View About Me.txt button
    const aboutBtn = container.querySelector('[data-open-app="about"]');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        sound.playClick();
        navApp('about');
      });
    }

    // Quick Message Composer Form Submit
    const form = container.querySelector('#contact-compose-form');
    const subjectInput = container.querySelector('#compose-subject');
    const bodyInput = container.querySelector('#compose-body');
    const statusEl = container.querySelector('#compose-status');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        sound.playClick();

        const subjectVal = (subjectInput.value || '').trim();
        const bodyVal = (bodyInput.value || '').trim();

        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
          subjectVal
        )}&body=${encodeURIComponent(bodyVal)}`;

        try {
          window.location.href = mailtoUrl;
        } catch {
          window.open(mailtoUrl, '_blank');
        }

        if (statusEl) {
          statusEl.textContent = '✓ Mail draft prepared! Your system email client has been launched.';
          statusEl.classList.add('compose-status--success');
        }
      });
    }

    function handlePayload(payload) {
      if (!payload || typeof payload !== 'object') return;

      if (payload.subject && subjectInput) {
        subjectInput.value = payload.subject;
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          form.classList.add('contact-compose-box--highlight');
          setTimeout(() => {
            form.classList.remove('contact-compose-box--highlight');
          }, 1200);
        }
        if (bodyInput) {
          bodyInput.focus();
        }
      }
    }

    // Handle initial payload if passed upon open
    if (ctx && ctx.payload) {
      handlePayload(ctx.payload);
    }

    return {
      onPayload(nextPayload) {
        handlePayload(nextPayload);
      },
      onFocus() {
        if (bodyInput && subjectInput && subjectInput.value) {
          bodyInput.focus();
        }
      }
    };
  }
};
