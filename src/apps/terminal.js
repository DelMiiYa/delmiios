/**
 * Terminal Interactive Shell Application (DelMiiOS)
 * ==================================================
 * Command-line shell supporting portfolio queries, file browsing (ls/cat),
 * settings control (theme, sound, crt, cursor), cross-app launching (open),
 * command history navigation, keystroke audio, and Tab autocompletion.
 *
 * Exports pure helpers for automated testing:
 * - escapeHtml(str)
 * - parseCommandInput(raw)
 * - getAutocompleteSuggestions(rawInput, context)
 */

import { profile, getVirtualFiles } from '../data/profile.js';
import { icons } from '../core/icons.js';
import { sound } from '../core/sound.js';
import { settingsStore, VALID_THEMES } from '../core/settings.js';

/**
 * Escapes HTML characters safely without DOM dependencies (works in Node/Vitest and browser).
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses raw command input into structured tokens.
 * @param {string} raw
 * @returns {{ raw: string, trimmed: string, cmd: string, args: string[], argString: string }}
 */
export function parseCommandInput(raw = '') {
  const str = raw == null ? '' : String(raw);
  const trimmed = str.trim();
  if (!trimmed) {
    return { raw: str, trimmed: '', cmd: '', args: [], argString: '' };
  }
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const argString = trimmed.slice(parts[0].length).trim();
  return { raw: str, trimmed, cmd, args, argString };
}

/**
 * Finds the longest common prefix among an array of strings.
 * @param {string[]} strings
 * @returns {string}
 */
function findCommonPrefix(strings) {
  if (!strings || strings.length === 0) return '';
  if (strings.length === 1) return strings[0];
  let prefix = strings[0];
  for (let i = 1; i < strings.length; i++) {
    while (!strings[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix;
}

/**
 * Computes autocomplete suggestions for a given input string.
 * Supports both object context `{ commands, appIds, themeIds, fileNames }`
 * and positional arguments `(rawInput, appIds, themeIds, fileNames)`.
 * @param {string} rawInput
 * @param {Object|string[]} [contextOrAppIds]
 * @param {string[]} [maybeThemes]
 * @param {string[]} [maybeFiles]
 * @returns {string[]}
 */
export function getAutocompleteSuggestions(
  rawInput = '',
  contextOrAppIds = {},
  maybeThemes,
  maybeFiles
) {
  let commands = [
    'help',
    'about',
    'projects',
    'skills',
    'contact',
    'whoami',
    'date',
    'ls',
    'cat',
    'open',
    'theme',
    'sound',
    'crt',
    'cursor',
    'clear',
    'exit'
  ];
  let appIds = ['about', 'projects', 'skills', 'contact', 'terminal', 'settings'];
  let themeIds = [...VALID_THEMES, 'dark', 'light'];
  let fileNames = Object.keys(getVirtualFiles(profile));

  if (Array.isArray(contextOrAppIds)) {
    appIds = contextOrAppIds;
    if (Array.isArray(maybeThemes)) themeIds = maybeThemes;
    if (Array.isArray(maybeFiles)) fileNames = maybeFiles;
  } else if (contextOrAppIds && typeof contextOrAppIds === 'object') {
    if (Array.isArray(contextOrAppIds.commands)) commands = contextOrAppIds.commands;
    if (Array.isArray(contextOrAppIds.appIds)) appIds = contextOrAppIds.appIds;
    if (Array.isArray(contextOrAppIds.themeIds)) themeIds = contextOrAppIds.themeIds;
    if (Array.isArray(contextOrAppIds.fileNames)) fileNames = contextOrAppIds.fileNames;
  }

  const raw = String(rawInput);
  const leadingSpaces = raw.match(/^\s*/)[0];
  const withoutLeading = raw.slice(leadingSpaces.length);

  // If typing the first token (no space after the command yet)
  if (!withoutLeading.includes(' ')) {
    const token = withoutLeading.toLowerCase();
    if (!token) {
      return commands.map((c) => `${leadingSpaces}${c}`);
    }
    return commands
      .filter((c) => c.startsWith(token))
      .map((c) => `${leadingSpaces}${c}`);
  }

  // If a command and at least one space has been typed
  const spaceIndex = withoutLeading.indexOf(' ');
  const cmd = withoutLeading.slice(0, spaceIndex).toLowerCase();
  const argPart = withoutLeading.slice(spaceIndex + 1);
  const argPrefix = argPart.trimStart().toLowerCase();
  const prefixCmd = `${leadingSpaces}${cmd} `;

  switch (cmd) {
    case 'open':
      return appIds
        .filter((app) => app.toLowerCase().startsWith(argPrefix))
        .map((app) => `${prefixCmd}${app}`);

    case 'theme':
      return themeIds
        .filter((theme) => theme.toLowerCase().startsWith(argPrefix))
        .map((theme) => `${prefixCmd}${theme}`);

    case 'cat':
      return fileNames
        .filter((file) => file.toLowerCase().startsWith(argPrefix))
        .map((file) => `${prefixCmd}${file}`);

    case 'sound':
      return ['on', 'off']
        .filter((opt) => opt.startsWith(argPrefix))
        .map((opt) => `${prefixCmd}${opt}`);

    case 'crt':
      return ['on', 'off', 'frame', 'scanlines', 'vignette', 'flicker']
        .filter((opt) => opt.startsWith(argPrefix))
        .map((opt) => `${prefixCmd}${opt}`);

    case 'cursor':
      return ['on', 'off', 'trail on', 'trail off']
        .filter((opt) => opt.startsWith(argPrefix))
        .map((opt) => `${prefixCmd}${opt}`);

    default:
      return [];
  }
}

export const terminalApp = {
  id: 'terminal',
  title: `Terminal — ${profile.username}@${profile.hostname}`,
  shortTitle: 'Terminal',
  desktopLabel: 'Terminal',
  description: 'Interactive command-line shell with autocomplete',
  icon: icons.terminal,
  defaultWidth: 690,
  defaultHeight: 460,

  render(container, ctx) {
    const { openApp, close, windowManager } = ctx || {};
    const navApp = (appId, payload) => {
      if (typeof openApp === 'function') {
        openApp(appId, payload);
      } else if (windowManager && typeof windowManager.openApp === 'function') {
        windowManager.openApp(appId, payload);
      }
    };

    const history = [];
    let historyIndex = -1;

    const promptString = `${profile.username}@${profile.hostname}:~$`;
    const virtualFiles = getVirtualFiles(profile);

    container.innerHTML = `
      <div class="app-terminal" id="terminal-wrapper">
        <div class="terminal-quick-bar" aria-label="Quick Commands">
          <span class="terminal-quick-label">Quick:</span>
          <button type="button" class="terminal-chip" data-cmd="help">help</button>
          <button type="button" class="terminal-chip" data-cmd="about">about</button>
          <button type="button" class="terminal-chip" data-cmd="projects">projects</button>
          <button type="button" class="terminal-chip" data-cmd="skills">skills</button>
          <button type="button" class="terminal-chip" data-cmd="contact">contact</button>
          <button type="button" class="terminal-chip" data-cmd="ls">ls</button>
          <button type="button" class="terminal-chip" data-cmd="theme">theme</button>
          <button type="button" class="terminal-chip" data-cmd="crt">crt</button>
          <button type="button" class="terminal-chip" data-cmd="clear">clear</button>
        </div>

        <div class="terminal-output" id="terminal-output" role="log" aria-live="polite">
          <div class="term-line term-line--accent">${profile.system.osName} Shell [Version 2.4.0]</div>
          <div class="term-line term-line--muted">Type <span class="term-cmd-highlight">help</span> for a list of available commands, or press <span class="term-cmd-highlight">Tab</span> for autocomplete.</div>
          <div class="term-line term-line--muted">Type <span class="term-cmd-highlight">open &lt;app&gt;</span> to launch any desktop application window.</div>
          <br />
        </div>

        <form class="terminal-input-row" id="terminal-form" autocomplete="off">
          <label for="terminal-input" class="terminal-prompt">${promptString}</label>
          <input
            type="text"
            id="terminal-input"
            class="terminal-input"
            placeholder="Type a command (e.g. help, about, projects)..."
            spellcheck="false"
            autocapitalize="off"
            autofocus
          />
        </form>
      </div>
    `;

    const outputEl = container.querySelector('#terminal-output');
    const formEl = container.querySelector('#terminal-form');
    const inputEl = container.querySelector('#terminal-input');
    const wrapperEl = container.querySelector('#terminal-wrapper');

    function appendHtml(html) {
      const block = document.createElement('div');
      block.className = 'term-block';
      block.innerHTML = html;
      outputEl.appendChild(block);
      outputEl.scrollTop = outputEl.scrollHeight;
    }

    function executeCommand(rawInput) {
      const parsed = parseCommandInput(rawInput);
      const { trimmed, cmd, args, argString } = parsed;

      // Echo command line with escaped content
      appendHtml(
        `<div class="term-line"><span class="terminal-prompt">${promptString}</span> ${escapeHtml(
          trimmed
        )}</div>`
      );

      if (!trimmed) return;

      // Push to command history
      history.push(trimmed);
      historyIndex = history.length;

      switch (cmd) {
        case 'help':
          appendHtml(`
            <div class="term-line term-line--accent">DelMiiOS Shell Commands:</div>
            <div class="term-table">
              <div><span class="term-cmd-highlight">help</span>          — Show this list of available commands</div>
              <div><span class="term-cmd-highlight">about</span>         — Display biography, location & quick facts</div>
              <div><span class="term-cmd-highlight">projects</span>      — List featured portfolio projects</div>
              <div><span class="term-cmd-highlight">skills</span>        — Display technical skills and system specs</div>
              <div><span class="term-cmd-highlight">contact</span>       — Show direct email, office hours & social links</div>
              <div><span class="term-cmd-highlight">whoami</span>        — Print current user identity and active session</div>
              <div><span class="term-cmd-highlight">date</span>          — Print current system date and time</div>
              <div><span class="term-cmd-highlight">ls</span>            — List virtual files available on this system</div>
              <div><span class="term-cmd-highlight">cat &lt;file&gt;</span>     — Print contents of a virtual file</div>
              <div><span class="term-cmd-highlight">open &lt;app&gt;</span>     — Launch application window (e.g. open projects)</div>
              <div><span class="term-cmd-highlight">theme [name]</span>   — Change visual theme preset or dark/light mode</div>
              <div><span class="term-cmd-highlight">sound [on|off]</span> — Toggle or set synthesized Web Audio sound FX</div>
              <div><span class="term-cmd-highlight">crt [option]</span>    — Toggle CRT effects (on, off, frame, scanlines, vignette, flicker)</div>
              <div><span class="term-cmd-highlight">cursor [option]</span> — Toggle red triangle cursor & white trail (on, off, trail on, trail off)</div>
              <div><span class="term-cmd-highlight">clear</span>         — Clear terminal output history</div>
              <div><span class="term-cmd-highlight">exit</span>          — Close the terminal window</div>
            </div>
          `);
          break;

        case 'about': {
          const summaryText = (profile.about.summary || []).map(escapeHtml).join('<br/><br/>');
          const interestsText = (profile.about.interests || []).map(escapeHtml).join(', ');
          appendHtml(`
            <div class="term-line term-line--accent">${escapeHtml(profile.name)} — ${escapeHtml(
            profile.role
          )}</div>
            <div class="term-line term-line--muted">📍 Location: ${escapeHtml(
              profile.location
            )} | Status: ${escapeHtml(profile.status)}</div>
            <br />
            <div class="term-line">${summaryText}</div>
            <br />
            <div class="term-line term-line--muted">Interests: ${interestsText}</div>
          `);
          break;
        }

        case 'projects':
          appendHtml(`
            <div class="term-line term-line--accent">Featured Projects (${profile.projects.length}):</div>
            ${profile.projects
              .map(
                (p, idx) => `
              <div class="term-proj-item">
                <div><strong>[${idx + 1}] ${escapeHtml(p.title)}</strong> <span class="term-line--muted">(${escapeHtml(
                  p.category
                )} · ${escapeHtml(p.date)} · ${escapeHtml(p.status)})</span></div>
                <div class="term-line--muted">    ${escapeHtml(p.description)}</div>
                <div>    Tech: <span class="term-cmd-highlight">${(p.tech || []).map(escapeHtml).join(', ')}</span></div>
                ${p.liveUrl && p.liveUrl !== '#' ? `<div>    Live: <a href="${escapeHtml(p.liveUrl)}" target="_blank" rel="noopener noreferrer" class="term-link">${escapeHtml(p.liveUrl)}</a></div>` : ''}
                ${p.repoUrl ? `<div>    Repo: <a href="${escapeHtml(p.repoUrl)}" target="_blank" rel="noopener noreferrer" class="term-link">${escapeHtml(p.repoUrl)}</a></div>` : ''}
              </div>
            `
              )
              .join('')}
            <div class="term-line term-line--muted">Tip: Type <code>open projects</code> to explore in File Explorer.</div>
          `);
          break;

        case 'skills':
          appendHtml(`
            <div class="term-line term-line--accent">System Specs:</div>
            <div class="term-line">  OS: ${escapeHtml(profile.skills.systemSpecs.osName)} (${escapeHtml(
            profile.skills.systemSpecs.kernel
          )})</div>
            <div class="term-line">  Status: ${escapeHtml(
              profile.skills.systemSpecs.uptime
            )} | Memory: ${escapeHtml(profile.skills.systemSpecs.memory)}</div>
            <br />
            <div class="term-line term-line--accent">Proficiencies:</div>
            ${profile.skills.categories
              .map(
                (cat) => `
              <div class="term-line"><strong>${escapeHtml(cat.name)}:</strong></div>
              ${cat.items
                .map((s) => {
                  const filled = Math.round(s.level / 10);
                  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
                  return `<div class="term-line">  [${bar}] ${s.level}% — ${escapeHtml(s.name)} <span class="term-line--muted">[${escapeHtml(s.tag)}]</span></div>`;
                })
                .join('')}
            `
              )
              .join('')}
          `);
          break;

        case 'contact':
          appendHtml(`
            <div class="term-line term-line--accent">Contact & Social Channels:</div>
            <div class="term-line">  Email: <a href="mailto:${escapeHtml(
              profile.contact.email
            )}" class="term-link">${escapeHtml(profile.contact.email)}</a></div>
            <div class="term-line">  Office Hours: ${escapeHtml(
              profile.contact.officeHours || 'N/A'
            )}</div>
            <div class="term-line">  Note: ${escapeHtml(profile.contact.availabilityNote)}</div>
            <br />
            ${profile.contact.socials
              .map(
                (s) => `
              <div class="term-line">  • <strong>${escapeHtml(s.platform)}:</strong> <a href="${escapeHtml(
                  s.url
                )}" target="_blank" rel="noopener noreferrer" class="term-link">${escapeHtml(
                  s.handle
                )}</a> <span class="term-line--muted">(${escapeHtml(s.description)})</span></div>
            `
              )
              .join('')}
          `);
          break;

        case 'whoami':
          appendHtml(
            `<div class="term-line"><strong>${escapeHtml(profile.username)}</strong> (${escapeHtml(
              profile.name
            )} — ${escapeHtml(profile.role)})</div>`
          );
          break;

        case 'date':
          appendHtml(`<div class="term-line">${new Date().toString()}</div>`);
          break;

        case 'ls': {
          const files = Object.keys(virtualFiles);
          appendHtml(`
            <div class="term-line term-line--accent">Virtual System Files:</div>
            <div class="term-line">${files.map((f) => `<span class="term-cmd-highlight">${escapeHtml(f)}</span>`).join('   ')}</div>
            <div class="term-line term-line--muted">Use <code>cat &lt;file&gt;</code> to read any file.</div>
          `);
          break;
        }

        case 'cat': {
          const fileName = args[0];
          if (!fileName) {
            appendHtml(
              `<div class="term-line term-line--error">Usage: <code>cat &lt;filename&gt;</code> (e.g. <code>cat About_Me.txt</code>)</div>`
            );
          } else {
            // Case-insensitive file matching
            const matchedKey = Object.keys(virtualFiles).find(
              (k) => k.toLowerCase() === fileName.toLowerCase()
            );
            if (matchedKey) {
              const content = escapeHtml(virtualFiles[matchedKey]).replace(/\n/g, '<br/>');
              appendHtml(`<div class="term-line">${content}</div>`);
            } else {
              appendHtml(
                `<div class="term-line term-line--error">cat: ${escapeHtml(
                  fileName
                )}: No such file or directory</div>`
              );
            }
          }
          break;
        }

        case 'open': {
          const validApps = ['about', 'projects', 'skills', 'contact', 'terminal', 'settings'];
          const targetApp = (args[0] || '').toLowerCase();
          if (!targetApp) {
            appendHtml(
              `<div class="term-line">Usage: <code>open &lt;app&gt;</code>. Available apps: ${validApps.join(
                ', '
              )}</div>`
            );
          } else if (validApps.includes(targetApp)) {
            appendHtml(`<div class="term-line">Launching <strong>${targetApp}</strong>...</div>`);
            navApp(targetApp);
          } else {
            appendHtml(
              `<div class="term-line term-line--error">Unknown application "${escapeHtml(
                targetApp
              )}". Available: ${validApps.join(', ')}</div>`
            );
          }
          break;
        }

        case 'theme': {
          const arg = args[0] ? args[0].toLowerCase() : '';
          const currentState = settingsStore.getState();

          if (!arg) {
            appendHtml(`
              <div class="term-line">Current theme: <strong>${currentState.theme}</strong> (${currentState.mode} mode)</div>
              <div class="term-line">Available themes: ${VALID_THEMES.join(', ')}</div>
              <div class="term-line">Available modes: dark, light</div>
              <div class="term-line term-line--muted">Usage: <code>theme &lt;name&gt;</code> (e.g. <code>theme retro-teal</code> or <code>theme light</code>)</div>
            `);
          } else if (VALID_THEMES.includes(arg)) {
            settingsStore.setTheme(arg);
            appendHtml(
              `<div class="term-line">✓ Visual theme preset changed to: <strong>${arg}</strong></div>`
            );
          } else if (arg === 'dark' || arg === 'light') {
            settingsStore.setMode(arg);
            appendHtml(
              `<div class="term-line">✓ Interface mode set to: <strong>${arg}</strong></div>`
            );
          } else {
            appendHtml(
              `<div class="term-line term-line--error">Invalid theme "${escapeHtml(
                arg
              )}". Valid options: ${VALID_THEMES.join(', ')}, dark, light</div>`
            );
          }
          break;
        }

        case 'sound': {
          const arg = args[0] ? args[0].toLowerCase() : '';
          const currentState = settingsStore.getState();
          if (!arg) {
            const next = settingsStore.toggleSound();
            appendHtml(
              `<div class="term-line">System audio effects toggled: <strong>${
                next ? 'ON' : 'OFF'
              }</strong></div>`
            );
          } else if (arg === 'on') {
            settingsStore.setSound(true);
            appendHtml(`<div class="term-line">✓ System audio effects enabled.</div>`);
          } else if (arg === 'off') {
            settingsStore.setSound(false);
            appendHtml(`<div class="term-line">✓ System audio effects disabled.</div>`);
          } else {
            appendHtml(
              `<div class="term-line term-line--error">Usage: <code>sound [on|off]</code> (current: ${
                currentState.soundEnabled ? 'on' : 'off'
              })</div>`
            );
          }
          break;
        }

        case 'crt': {
          const arg = args[0] ? args[0].toLowerCase() : '';
          if (!arg) {
            const isMasterOn = settingsStore.toggleCrtMaster();
            appendHtml(
              `<div class="term-line">CRT master effects toggled: <strong>${
                isMasterOn ? 'ON' : 'OFF'
              }</strong></div>`
            );
          } else if (['on', 'off', 'frame', 'scanlines', 'vignette', 'flicker'].includes(arg)) {
            settingsStore.setCrt(arg);
            appendHtml(`<div class="term-line">✓ CRT setting updated: <strong>${arg}</strong></div>`);
          } else {
            appendHtml(
              `<div class="term-line term-line--error">Usage: <code>crt [on|off|frame|scanlines|vignette|flicker]</code></div>`
            );
          }
          break;
        }

        case 'cursor': {
          const fullArg = argString.toLowerCase();
          if (!fullArg) {
            const curState = settingsStore.getState();
            const nextCursor = !curState.customCursor;
            settingsStore.setCursor({ customCursor: nextCursor, cursorTrail: nextCursor });
            appendHtml(
              `<div class="term-line">Custom triangle cursor & trail toggled: <strong>${
                nextCursor ? 'ON' : 'OFF'
              }</strong></div>`
            );
          } else if (
            ['on', 'off', 'trail on', 'trail off', 'trail'].includes(fullArg)
          ) {
            settingsStore.setCursor(fullArg);
            appendHtml(
              `<div class="term-line">✓ Cursor setting updated: <strong>${fullArg}</strong></div>`
            );
          } else {
            appendHtml(
              `<div class="term-line term-line--error">Usage: <code>cursor [on|off|trail on|trail off]</code></div>`
            );
          }
          break;
        }

        case 'clear':
          outputEl.innerHTML = '';
          break;

        case 'exit':
          if (typeof close === 'function') {
            close();
          } else if (windowManager && typeof windowManager.closeWindow === 'function') {
            windowManager.closeWindow('terminal');
          }
          break;

        default:
          appendHtml(
            `<div class="term-line term-line--error">Command not found: <strong>${escapeHtml(
              cmd
            )}</strong>. Type <span class="term-cmd-highlight">help</span> for a list of available commands.</div>`
          );
          break;
      }
    }

    // Submit handler
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputEl.value;
      inputEl.value = '';
      executeCommand(val);
    });

    // Keydown handler: Keystroke sounds, Arrow History, Tab Autocomplete
    inputEl.addEventListener('keydown', (e) => {
      // Keystroke sound
      if (!['ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Shift', 'Control', 'Alt'].includes(e.key)) {
        sound.playKey();
      }

      // History navigation: ArrowUp
      if (e.key === 'ArrowUp') {
        if (history.length > 0 && historyIndex > 0) {
          e.preventDefault();
          historyIndex -= 1;
          inputEl.value = history[historyIndex];
        }
      }
      // History navigation: ArrowDown
      else if (e.key === 'ArrowDown') {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          historyIndex += 1;
          inputEl.value = history[historyIndex];
        } else if (historyIndex === history.length - 1) {
          e.preventDefault();
          historyIndex = history.length;
          inputEl.value = '';
        }
      }
      // Tab Autocomplete
      else if (e.key === 'Tab') {
        e.preventDefault();
        sound.playClick();

        const currentVal = inputEl.value;
        const suggestions = getAutocompleteSuggestions(currentVal);

        if (suggestions.length === 1) {
          // Exactly 1 match: complete input directly
          inputEl.value = suggestions[0];
        } else if (suggestions.length > 1) {
          // Multiple matches: complete common prefix
          const common = findCommonPrefix(suggestions);
          if (common && common.length > currentVal.length) {
            inputEl.value = common;
          }

          // Echo available matches to terminal output
          appendHtml(
            `<div class="term-line term-line--muted">${suggestions
              .map((s) => escapeHtml(s.trim()))
              .join('   ')}</div>`
          );
        }
      }
    });

    // Quick command buttons
    container.querySelectorAll('.terminal-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        sound.playClick();
        executeCommand(chip.dataset.cmd);
        inputEl.focus();
      });
    });

    // Focus input on wrapper click unless selecting text
    wrapperEl.addEventListener('click', (e) => {
      if (
        typeof window !== 'undefined' &&
        window.getSelection &&
        window.getSelection().toString().length === 0 &&
        !e.target.closest('a, button')
      ) {
        inputEl.focus();
      }
    });

    return {
      onFocus() {
        if (inputEl) {
          inputEl.focus();
        }
      }
    };
  }
};
