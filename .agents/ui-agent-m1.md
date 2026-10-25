# Handoff Prompt: UI Agent — Milestone 1 (M1 Core)

> **Role**: You are the **UI & Core Systems Agent** for **Milestone 1 (M1 Core)** of the **DelMiiOS (AetherOS v2.4 — Combined Edition)** project in `D:\delmiios`.
> You have **no memory of prior conversations**. This document and `D:\delmiios\.agents\plan.md` contain everything you need.

---

## 1. Hard Rules & Constraints

1. **No Sub-Agents**: Never launch, invoke, or spawn any sub-agents or delegation tools.
2. **No Git Commands**: Never run `git init`, `git add`, `git commit`, `git push`, or any destructive git command. The Project Orchestrator owns all git operations.
3. **Strict File Ownership**: Create/edit **only** the files listed in Section 3 below. Do not create `src/apps/*` in M1 (those belong to M2), and do not touch `.agents/*` or `package.json`.
4. **Zero Runtime Dependencies**: Plain HTML, CSS, and vanilla ES Modules only. No external CDNs, fonts, images, or audio files.
5. **All English**: All code, comments, identifiers, and UI text must be in English.
6. **Honest Placeholders Only**: Never use invented identities like "Alex Morgan". Use `Your Name`, `your@email.com`, `guest_user`, `personal-pc`, and `TODO` comments in `src/data/profile.js`.
7. **No Inline Styles in Templates**: Do not put static styling in `style="..."` attributes inside HTML strings (use CSS classes and custom properties in `src/style.css`). Dynamic coordinates/percentages (`left`, `top`, `width`, `height`, `zIndex`, `--accent`) set via JS or CSS variables are fine.

---

## 2. Project Context & Goal for Milestone 1

We are merging two existing prototypes (located for reference in `e:\webosproj\featurefulweb` and `e:\webosproj\goodlookingweb`, also mirrored in `D:\delmiios\featurefulweb` and `D:\delmiios\goodlookingweb` — **read them if helpful, but only write code in `D:\delmiios\src\`, `D:\delmiios\index.html`, and `D:\delmiios\public\favicon.svg`**):
- **`featurefulweb/` strengths to keep**:
  - Registry-based `WindowManager` (`registerApp`, `subscribe`/`notify`, pointer-capture drag with `setPointerCapture` and `pointercancel`, double-click titlebar to maximize/restore, cascading positions clamped to screen bounds, mobile `<= 768px` auto-maximize on open and resize).
  - Centralized `icons.js` and well-structured `profile.js` with honest placeholders.
- **`goodlookingweb/` strengths to keep**:
  - Branded AetherOS boot sequence with SVG logo, scrolling boot logs, progress bar, keyboard (`Space`/`Enter`/`Escape`) + click + button skip, and Web Audio startup chime.
  - Synthesized Web Audio sound system (`sound.js`) with off-safe user-gesture gating and taskbar tray mute toggle.
  - Start Menu with user header (derived avatar initials + name + online status dot), **live search input** that filters registered apps by title/description, Restart button, and **Sleep / Off** button (shows full-screen suspend overlay inside `#crt-screen`, click anywhere or power button to wake).
  - Taskbar with Start button, running window tabs, and system tray (CRT quick toggle button + Sound mute toggle button + two-line live clock showing time and date).

In **Milestone 1**, you will build the complete **Core OS Shell & Subsystems** so the OS boots inside the `#crt-monitor > #crt-screen` container, renders the desktop wallpaper, desktop icon grid, taskbar, Start menu (with search, Restart, Sleep/wake), sound engine, unified settings store, and window manager.

---

## 3. Exact File Ownership for Milestone 1

You own and must create/update the following files in `D:\delmiios`:

1. `D:\delmiios\index.html` — Minimal HTML5 shell with `<div id="app"></div>` and `<script type="module" src="/src/main.js"></script>`.
2. `D:\delmiios\public\favicon.svg` — Clean self-contained SVG favicon (CRT monitor / terminal motif).
3. `D:\delmiios\src\data\profile.js` — All personal placeholder content + system & appearance defaults.
4. `D:\delmiios\src\core\icons.js` — Central inline SVG icon map (`about`, `projects`, `skills`, `contact`, `terminal`, `settings`, `logo`, `restart`, `power`, `soundOn`, `soundOff`, `crt`, `external`, `search`, `folder`, `send`, `copy`).
5. `D:\delmiios\src\core\settings.js` — Single unified settings store persisted under `localStorage` key `'delmiios_settings_v1'`.
6. `D:\delmiios\src\core\sound.js` — Web Audio API synthesized SFX (`playClick`, `playOpen`, `playClose`, `playStartup`, `playKey`), off-safe before user gesture.
7. `D:\delmiios\src\core\windowManager.js` — Registry-based window manager with `subscribe`/`notify`, pointer-capture dragging,inner `#crt-screen` clamping, `openApp(appId, payload)` cross-app payload routing, and exported pure clamping/cascade functions.
8. `D:\delmiios\src\core\boot.js` — Branded AetherOS boot sequence (`runBootSequence(container, onComplete)`), `aria-live="polite"` log list, progress bar, skip via click / Space / Enter / Escape / Skip button.
9. `D:\delmiios\src\core\desktop.js` — Desktop icon grid generated from `windowManager.getRegisteredApps()` (single click selects on desktop, double click opens on desktop, single tap opens on touch/`<=768px`, `Enter`/`Space` opens via keyboard).
10. `D:\delmiios\src\core\taskbar.js` — Start button, running window buttons (`active`/`minimized` states), tray with CRT quick-toggle button, Sound mute toggle button, and live 2-line clock (`cleanup()` clears interval).
11. `D:\delmiios\src\core\startMenu.js` — User header (derived initials from `getAvatarInitials(profile.name)`, name, role, status dot), live search input (`#start-search-input`), filtered app list with descriptions, Restart button, and Sleep/Off button + `#shutdown-overlay` wake handler.
12. `D:\delmiios\src\main.js` — Bootstrap wiring: sets `document.title`, builds `#crt-monitor > #crt-screen` shell inside `#app`, initializes `settingsStore`, `WindowManager`, `StartMenu`, `createTaskbar`, `createDesktopIcons`, and `runBootSequence`. (Note: in M1, before `src/apps/*` exist in M2, guard app registration or register a lightweight placeholder/empty list so `npm run build` and booting to the desktop work cleanly with zero errors.)
13. `D:\delmiios\src\style.css` — Variables-driven CSS for `:root`, themes (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`), light/dark mode (`data-mode="light"`), 5 wallpapers (`data-wallpaper`), `#crt-monitor` / `#crt-screen` layout, boot screen, desktop icons, window chrome, taskbar, start menu, sleep overlay, responsive (`<= 768px`), and `@media (prefers-reduced-motion: reduce)`.

---

## 4. Detailed Module Contracts (from `.agents/plan.md`)

### 4.1 DOM Shell (`src/main.js`)
Render this structure inside `#app`:
```html
<div id="crt-monitor" class="crt-monitor">
  <div id="crt-screen" class="crt-screen">
    <main class="os-desktop" id="os-desktop" aria-label="Simulated Desktop Environment">
      <div class="os-wallpaper-layer" aria-hidden="true"></div>
      <div class="os-desktop-layer" id="os-desktop-layer"></div>
      <div class="os-window-layer" id="os-window-layer"></div>
    </main>
    <!-- Start Menu, Taskbar, Boot Screen, and Sleep Overlay mount inside #crt-screen -->
    <div class="crt-overlay-scanlines" aria-hidden="true"></div>
    <div class="crt-overlay-vignette" aria-hidden="true"></div>
    <div class="crt-overlay-flicker" aria-hidden="true"></div>
    <div class="crt-power-anim" id="crt-power-anim" aria-hidden="true"></div>
  </div>
  <div class="crt-bezel-chin">
    <div class="crt-brand-badge" id="crt-brand-badge">
      <span class="crt-brand-led-dot" aria-hidden="true"></span>
      <span class="crt-brand-text">${profile.system.osName}</span>
    </div>
    <button type="button" class="crt-power-btn" id="crt-power-btn" aria-label="Toggle Monitor Power or Wake" title="Monitor Power">
      <span class="crt-power-led" id="crt-power-led"></span>
      <span class="crt-power-label">PWR</span>
    </button>
  </div>
</div>
```

### 4.2 `src/data/profile.js`
- Export `getAvatarInitials(name)`: derives 1–2 uppercase initials from `name` (e.g. `'Your Name'` -> `'YN'`).
- Export `getVirtualFiles(p = profile)`: returns an object/map of virtual files generated from `profile` for Terminal `ls` and `cat <file>` (e.g., `'About_Me.txt'`, `'projects.txt'`, `'skills.sys'`, `'contact.txt'`, `'system.cfg'`).
- Export `profile` (and `export const profileData = profile;`):
  - `name: 'Your Name'`, `username: 'guest_user'`, `hostname: 'personal-pc'`, `role: 'Full-Stack Developer & Creative Technologist'`, `tagline: 'Building thoughtful digital experiences on the web.'`, `location: 'Your City, Country (TODO: Update location)'`, `status: 'Available for new opportunities'`, `avatarInitials: 'YN'`
  - `about`: `{ fileName: 'About Me.txt', lastModified: '2026-10-25', summary: [...3 placeholder paragraphs with TODO], interests: [...], quickFacts: [...], experience: [...] }`
  - `projects`: 4 placeholder projects (`proj-1`..`proj-4`) with `id`, `title`, `category`, `date`, `status`, `description`, `details`, `tech` (include tags matching skills such as `'TypeScript'`, `'JavaScript'`, `'HTML/CSS'`, `'Node.js'`, `'Vite'`, `'CSS Variables'`, `'Accessibility'`), `liveUrl`, `repoUrl`.
  - `skills`:
    - `systemSpecs`: `{ osName: 'AetherOS v2.4', osCodename: 'CRT Edition', kernel: 'Vanilla-JS Microkernel 64-bit', uptime: '99.98% Reliable', memory: '16.0 GB Virtual RAM' }`
    - `categories`: Frontend & UI Engineering, Backend & Tooling (each item has `{ name, level, tag, filterTag }` where `filterTag` matches a tech tag in `projects`, e.g., `'HTML/CSS'`, `'CSS Variables'`, `'TypeScript'`, `'JavaScript'`, `'Node.js'`, `'Vite'`).
    - `additionalTags`: `['Accessibility', 'TypeScript', 'Vite', 'Node.js', 'CSS Variables', 'HTML/CSS', 'TODO: Add More Skills']`
  - `contact`: `{ email: 'your@email.com', availabilityNote: 'TODO: Customize your availability note...', officeHours: 'Monday — Friday, 09:00 - 18:00 UTC (TODO)', socials: [Email, GitHub, LinkedIn, X / Social] }`
  - `system`:
    ```js
    {
      osName: 'AetherOS v2.4',
      osCodename: 'CRT Edition',
      kernel: 'Vanilla-JS Microkernel 64-bit',
      defaultTheme: 'cyber-dark',
      defaultMode: 'dark',
      defaultWallpaper: 'aurora',
      defaultAccent: '#38bdf8',
      soundEnabled: true,
      crtFrame: true,
      crtScanlines: true,
      crtVignette: true,
      crtFlicker: false,
      customCursor: true,
      cursorTrail: true
    }
    ```
  - `appearance`:
    - `themes`:
      - `{ id: 'cyber-dark', name: 'Cyber Dark', color: '#1e1b4b', desc: 'Deep indigo & neon cyan' }`
      - `{ id: 'retro-teal', name: 'Retro Teal 95', color: '#008080', desc: 'Classic 90s desktop chrome' }`
      - `{ id: 'sunset-dusk', name: 'Sunset Dusk', color: '#75225b', desc: 'Vibrant synthwave dusk' }`
      - `{ id: 'matrix', name: 'Matrix Green', color: '#052e16', desc: 'Phosphor hacker terminal' }`
      - `{ id: 'clean-slate', name: 'Clean Slate', color: '#1e293b', desc: 'Modern minimalist slate' }`
    - `wallpapers`: `aurora`, `sunset`, `blueprint`, `emerald`, `minimal` (same 5 IDs as `featurefulweb`)
    - `accents`: `sky` (`#38bdf8`), `violet` (`#a78bfa`), `emerald` (`#34d399`), `amber` (`#fbbf24`), `rose` (`#fb7185`)

### 4.3 `src/core/settings.js`
- Export `STORAGE_KEY = 'delmiios_settings_v1'`, `VALID_THEMES = ['cyber-dark', 'retro-teal', 'sunset-dusk', 'matrix', 'clean-slate']`, `VALID_MODES = ['dark', 'light']`, class `SettingsStore`, and singleton `settingsStore` (also alias `export const themeManager = settingsStore;` for compatibility).
- State fields: `theme`, `mode`, `wallpaper`, `accent`, `soundEnabled`, `crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`, `customCursor`, `cursorTrail`.
- Methods:
  - `getState()` -> shallow clone of state
  - `update(partial)` -> validates & merges fields, saves to `localStorage` (wrapped in `try/catch`), calls `apply()`, notifies subscribers, returns `getState()`.
  - `setTheme(themeOrMode)` -> if `'dark'` or `'light'`, sets `mode` (and keeps current `theme`); if in `VALID_THEMES`, sets `theme` (and sets `mode = 'dark'`). Returns `true` if valid, `false` otherwise.
  - `setMode(mode)` -> sets `mode` if `'dark'` or `'light'`, returns `boolean`.
  - `toggleMode()` / `toggleTheme()` -> toggles `mode` between `'dark'` and `'light'`, returns new `mode`.
  - `setWallpaper(wallpaperId)` -> validates against `profile.appearance.wallpapers`, updates `wallpaper`, returns `boolean`.
  - `setAccent(colorHex)` -> validates non-empty string, updates `accent`, returns `boolean`.
  - `setSound(enabled)` -> sets `soundEnabled: Boolean(enabled)`, calls `sound.setEnabled(this.state.soundEnabled)`, saves/applies/notifies, returns `this.state.soundEnabled`.
  - `toggleSound()` -> toggles `soundEnabled`, returns new boolean.
  - `setCrt(arg)` ->
    - if `arg === 'on'`: sets `{ crtFrame: true, crtScanlines: true, crtVignette: true }`
    - if `arg === 'off'`: sets `{ crtFrame: false, crtScanlines: false, crtVignette: false, crtFlicker: false }`
    - if `arg === 'frame'`: toggles `crtFrame`
    - if `arg === 'scanlines'`: toggles `crtScanlines`
    - if `arg === 'vignette'` or `arg === 'curvature'`: toggles `crtVignette`
    - if `arg === 'flicker'`: toggles `crtFlicker`
    - if `typeof arg === 'object'`: updates matching boolean properties (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`).
  - `toggleCrtMaster()` -> if `crtScanlines || crtFrame` is true, turns CRT off (`setCrt('off')`); otherwise turns CRT on (`setCrt('on')`). Returns `boolean` (whether CRT is now on).
  - `setCursor(arg)` -> accepts `{ customCursor?, cursorTrail? }` or strings `'on' | 'off' | 'trail on' | 'trail off' | 'trail'`.
  - `resetDefaults()` -> resets all state fields to `profile.system` defaults, saves, applies, notifies.
  - `subscribe(cb)` -> adds `cb` to listener Set, returns `() => this.listeners.delete(cb)`.
  - `apply()` ->
    - Sets `data-theme="${this.state.theme}"` and `data-mode="${this.state.mode}"` on `document.documentElement` and `document.body`.
    - Sets `data-wallpaper="${this.state.wallpaper}"` on `document.documentElement`.
    - Sets `--accent` on `document.documentElement.style`.
    - Syncs `sound.setEnabled(this.state.soundEnabled)`.
    - Toggles CRT classes on `#crt-monitor` / `#crt-screen` (if present in DOM):
      - `#crt-monitor`: `.crt-monitor--bezel-on` (`this.state.crtFrame`)
      - `#crt-screen`: `.crt-screen--scanlines` (`this.state.crtScanlines`), `.crt-screen--vignette` (`this.state.crtVignette`), `.crt-screen--flicker` (`this.state.crtFlicker`), `.crt-screen--glow` (`this.state.crtScanlines || this.state.crtVignette`)

### 4.4 `src/core/sound.js`
- Web Audio API synthesizer (`playClick()`, `playOpen()`, `playClose()`, `playStartup()`, `playKey()`, `setEnabled(bool)`, `isEnabled()`).
- **Off-safe before user gesture**: Track `this.userInteracted = false`. Attach a one-time window listener for `'pointerdown'` / `'keydown'` to set `this.userInteracted = true`. Never instantiate or resume `AudioContext` until `this.userInteracted` is `true` AND `this.enabled` is `true`. Keep volume subtle (`0.12`).

### 4.5 `src/core/windowManager.js`
- Export pure helper functions for unit testing:
  - `export function clampWindowPosition({ left, top, width, height, boundsWidth, boundsHeight, minVisibleWidth = 120, minTop = 0 })`
    - Ensures `left` is clamped between `Math.min(0, -width + minVisibleWidth)` and `Math.max(0, boundsWidth - minVisibleWidth)` (or when placing a new window, inside `[0, Math.max(0, boundsWidth - width)]`).
    - Ensures `top` is clamped between `minTop` (`0`) and `Math.max(0, boundsHeight - 42)`.
  - `export function computeCascadePosition({ index, width, height, boundsWidth, boundsHeight })`
    - Computes staggered initial `{ left, top }` (`offset = (index % 5) * 28`, clamped so the window fits inside `boundsWidth x boundsHeight`).
- Class `WindowManager`:
  - `getBounds()`: reads `this.container.clientWidth` and `this.container.clientHeight` (which is `#os-window-layer` inside `#crt-screen`, above the taskbar). Falls back to `window.innerWidth` and `window.innerHeight - 50` if `clientWidth === 0`.
  - `isMobileViewport()`: returns `window.innerWidth <= 768`.
  - `openApp(appId, payload)`:
    - If already open: restores if minimized, focuses window, calls `existing.onFocus?.()`, and if `payload !== undefined && typeof existing.onPayload === 'function'`, calls `existing.onPayload(payload)`.
    - If not open: creates `<section class="os-window os-window--opening" data-app-id="${appId}" role="dialog" aria-label="${appDef.title}" tabindex="-1">`, renders titlebar + `.os-window-body`, calls:
      ```js
      const lifecycle = appDef.render(bodyEl, {
        windowManager: this,
        openApp: (targetId, nextPayload) => this.openApp(targetId, nextPayload),
        close: () => this.closeWindow(appId),
        payload
      });
      ```
      Stores `cleanup`, `onFocus`, `onPayload` from `lifecycle`. If `payload !== undefined && typeof winState.onPayload === 'function'`, calls `winState.onPayload(payload)` after render.
    - Plays `sound.playOpen()` on open, `sound.playClose()` on close, `sound.playClick()` on minimize/maximize/restore.
    - Dragging uses `titlebar.setPointerCapture(e.pointerId)` on `pointerdown`, updates position clamped via `clampWindowPosition` relative to `this.getBounds()` on `pointermove`, and releases capture on `pointerup` / `pointercancel`.

---

## 5. Deliverables & Done-Checklist for M1

Before finishing, verify all items below:
- [ ] All 13 files in Section 3 are created and cleanly formatted.
- [ ] `npm run build` succeeds with zero errors or warnings.
- [ ] `src/data/profile.js` contains only honest placeholders (`Your Name`, `your@email.com`, `TODO` notes) and exports `profile`, `profileData`, `getAvatarInitials`, and `getVirtualFiles`.
- [ ] `src/core/settings.js` persists under `'delmiios_settings_v1'`, handles corrupt/missing `localStorage` gracefully, and syncs `data-theme`, `data-mode`, `data-wallpaper`, `--accent`, sound, CRT, and cursor flags.
- [ ] `src/core/windowManager.js` uses the registry pattern, `setPointerCapture` dragging, inner `#crt-screen` bounds clamping, mobile auto-maximize (`<= 768px`), and supports `openApp(appId, payload)` + `onPayload(payload)`.
- [ ] `src/core/boot.js` displays logo, scrolling logs (`aria-live="polite"`), progress bar, and skips on click, `Space`, `Enter`, `Escape`, or Skip button; respects `prefers-reduced-motion`.
- [ ] `src/core/startMenu.js` has user header with derived initials, live search input filtering apps, Restart, and Sleep/Off with wake overlay.
- [ ] `src/core/taskbar.js` has Start button, window task buttons, CRT quick-toggle button, Sound mute toggle button, and 2-line clock.
- [ ] No `git` commands were run and no sub-agents were launched.

---

## 6. Required Return Report Format

When finished, reply to the user with this exact structure:

```markdown
# M1 Core — UI Agent Completion Report

## 1. Files Created / Modified
- (List every file created or modified)

## 2. Contract Compliance Summary
- `profile.js`: (Confirm placeholder integrity & exported helpers)
- `settings.js`: (Confirm `delmiios_settings_v1` key & API methods)
- `windowManager.js`: (Confirm registry, pointer capture, `#crt-screen` clamping, `openApp(id, payload)`)
- `boot.js` / `desktop.js` / `taskbar.js` / `startMenu.js` / `sound.js`: (Confirm features & a11y)

## 3. Build Verification
- Result of `npm run build`

## 4. Notes or Contract Flags for Orchestrator
- (Any edge cases or notes for M2)
```
