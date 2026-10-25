# Project Plan: "About Me" Web OS — Combined Edition (`delmiios`)

> **Single Source of Truth for Architecture & Contracts.**
> All specialist agents (UI Agent, Review Agent, Test Agent) must adhere strictly to the file ownership rules and module contracts defined in this document.

---

## 1. Executive Summary & Prototype Merge Strategy

We are building **DelMiiOS (AetherOS v2.4 — Combined Edition)** in `D:\delmiios`: a zero-runtime-dependency, static Vite vanilla JavaScript "simulated desktop PC" personal portfolio that merges the engineering strengths of `featurefulweb` with the visual polish of `goodlookingweb`, wrapped inside an interactive **CRT Monitor Frame** and driven by an osu!-style **Custom Triangle Cursor & Continuous White Trail**.

### Merged Strengths
- **From `featurefulweb/` (Architecture & Functionality)**:
  - Registry-based `WindowManager`: `windowManager.registerApp(appDef)`; desktop icons, Start menu items, taskbar tabs, and Terminal `open <app>` all read from the single registry. Adding a new app = 1 file + 1 registration line.
  - Subscribe/notify state pattern on `WindowManager` and `SettingsStore`.
  - Pointer Events with `setPointerCapture` / `pointercancel` for smooth mouse + touch window dragging, double-click titlebar to maximize/restore, cascading positions clamped to screen bounds, and `<= 768px` auto-maximize on open and resize.
  - Dedicated settings manager with `localStorage` persistence, graceful fallback on corrupt/unavailable storage, and `resetDefaults()`.
  - Settings UI with `role="radiogroup"` and `aria-checked`, light/dark mode cards, live wallpaper previews, and accent swatches.
  - Terminal quick-command button bar, `open <app>`, ArrowUp/ArrowDown history, `username@hostname` title.
  - Honest placeholder content in `src/data/profile.js` (`Your Name`, `your@email.com`, `TODO` notes, derived avatar initials).
  - **Preserved Favorites**:
    - **Cross-app navigation** via `data-open-app` and `ctx.openApp(id, payload)` (extended across About, Projects, Skills, Contact, and Terminal).
    - **Contact "Quick Message Composer"** (Subject + Message -> `mailto:` with URL-encoded subject/body, plus Send Email and Copy Email with clipboard `aria-live` feedback).
- **From `goodlookingweb/` (Visual Polish & Experience)**:
  - Branded AetherOS boot sequence with SVG logo, scrolling boot logs, progress bar, keyboard/click/button skip, and startup chime.
  - 5 full visual themes (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`) driven entirely by CSS custom properties, combined with `featurefulweb`'s `dark`/`light` mode, 5 wallpapers, and 5 accent colors.
  - Web Audio API synthesized sound effects (`src/core/sound.js`) with off-safe user-gesture gating and taskbar tray mute toggle.
  - Start Menu with user avatar + status dot, **live search filtering**, app descriptions, **Restart**, and **Sleep / Off** overlay with click-to-wake.
  - Terminal `ls`, `cat <file>`, `exit`, and `theme <name>` validated against the real theme list.
- **Weaknesses Eliminated**:
  - No monolith `main.js` (`src/main.js` is bootstrap wiring only).
  - No invented persona ("Alex Morgan" removed; all content uses honest placeholders in `src/data/profile.js`).
  - No raw `window` mouse drag without pointer capture.
  - No inline `style="..."` in JS templates (moved to CSS classes/variables; dynamic values only where strictly necessary like progress bar width or window coordinates).
  - Unified into **one** versioned `localStorage` key (`delmiios_settings_v1`).
- **New Flagship Features**:
  - **CRT Monitor Frame (`src/core/crt.js`)**: Full `#crt-monitor` bezel on desktop (theme-aware colors, recessed inner screen `#crt-screen`, badge plate, power LED) + scanlines, phosphor mask, vignette/curvature, glass reflection, subtle flicker, power-on/off animations on Boot/Restart/Sleep/Wake, taskbar tray quick-toggle, Settings toggles, Terminal `crt` command, and automatic bezel drop at `<= 768px`.
  - **Custom Cursor & Trail (`src/core/cursor.js`)**: Red equilateral triangle cursor with center hotspot dot (`--cursor-color`), smooth velocity heading rotation via shortest angular path, continuous idle spin (`~30 deg/s`) after `~180ms` idle, interactive hover/active states, and a HiDPI full-viewport `<canvas>` rendering a smooth continuous white fading line trail (`~380ms` tail decay), with Settings toggles, Terminal `cursor` command, fine-pointer detection, and `prefers-reduced-motion` support.

---

## 2. Milestones & Review Gates

| Milestone | Scope | Primary Agent | Gate Agent | Commit Message Target |
| :--- | :--- | :--- | :--- | :--- |
| **M1: Core** | `index.html`, `public/favicon.svg`, `src/data/profile.js`, `src/core/{icons,settings,sound,windowManager,boot,desktop,taskbar,startMenu}.js`, `src/main.js` (core bootstrap + `#crt-monitor`/`#crt-screen` shell), core CSS in `src/style.css` | UI Agent (`ui-agent-m1.md`) | Review Agent (`review-agent-prompt.md` — M1) | `feat(core): add window manager, settings store, and boot sequence` |
| **M2: Apps** | `src/apps/{about,projects,skills,contact,terminal,settings}.js`, app registration in `src/main.js`, cross-app payload navigation (`ctx.openApp(id, payload)`), app styles in `src/style.css` | UI Agent (`ui-agent-m2.md`) | Review Agent (`review-agent-prompt.md` — M2) | `feat(apps): add about, projects, skills, contact, terminal, settings with cross-app links` |
| **M3: Experience** | `src/core/crt.js`, `src/core/cursor.js`, full CRT bezel/overlays/animations, custom triangle cursor + continuous white trail, 5 themes + light/dark + wallpapers, responsive & accessibility polish across `src/` | UI Agent (`ui-agent-m3.md`) | Review Agent (`review-agent-prompt.md` — M3) | `feat(experience): add CRT monitor frame, custom cursor trail, and full themes` |
| **M4: Hardening** | Unit tests (Vitest) + E2E smoke test (Playwright) in `tests/`, `README.md`, final review gate & build verification | Test Agent (`test-agent-prompt.md`) & UI Agent (`ui-agent-m4.md`) | Review Agent (`review-agent-prompt.md` — M4) | `test: add unit and smoke tests` / `docs: add README` |

> **Gate Rule**: After each milestone, the Review Agent audits the codebase and writes `.agents/reviews/review-<milestone>.md`. If any **Blocker** or **Major** findings exist, the Orchestrator writes `.agents/fixes/fix-<milestone>-<n>.md` and dispatches it before advancing to the next milestone.

---

## 3. Agent Justification & Responsibilities

1. **Project Orchestrator (Lead)**:
   - Owns planning, `.agents/*`, scaffolding (`package.json`, `vite.config.js`, `.gitignore`), build verification (`npm run build`), test execution, and **all Git operations** (`git init`, `git add`, `git commit`, `git push`). Never writes application feature code and never invokes sub-agents automatically.
2. **UI Agent (`ui-agent-m1.md`, `ui-agent-m2.md`, `ui-agent-m3.md`, `ui-agent-m4.md`)**:
   - Owns `index.html`, `public/favicon.svg`, `src/**`, and `README.md`.
   - Why a single unified UI Agent across M1–M4 instead of a separate Engine Agent: in a vanilla DOM application where `windowManager`, `boot`, `desktop`, `taskbar`, `startMenu`, `crt`, and `cursor` directly manipulate DOM nodes and CSS classes, keeping `src/core/*`, `src/apps/*`, and `src/style.css` under one sequential agent per milestone prevents DOM/CSS selector drift and concurrent file edit collisions.
3. **Review Agent (`review-agent-prompt.md`)**:
   - Strictly **read-only** on application code; owns `.agents/reviews/review-<milestone>.md`.
   - Audits brief compliance, registry architecture, XSS safety, event/timer/rAF cleanup, ARIA & keyboard accessibility, `prefers-reduced-motion`, `#crt-screen` window clamping, and build cleanliness.
4. **Test Agent (`test-agent-prompt.md`) — Decision: INCLUDED (Justified)**:
   - **Justification**: The brief includes stateful synchronization (`settings.js`), coordinate clamping (`windowManager.js`), command parsing/autocompletion/XSS escaping (`terminal.js`), non-trivial trigonometry & timestamp buffer pruning (`cursor.js`), and multi-app UI flows (boot skip, cross-app payloads, CRT/cursor toggles, mobile auto-maximize). A dedicated Test Agent owning `tests/**` and `vitest.config.js` / `playwright.config.js` guarantees automated regression coverage while keeping zero runtime dependencies.

---

## 4. File Ownership Map

No two agents ever edit the same file concurrently.

| File / Path Pattern | Owner Agent | Milestone Created / Updated |
| :--- | :--- | :--- |
| `package.json`, `vite.config.js`, `.gitignore` | Orchestrator | Scaffolding (Pre-M1) |
| `.agents/plan.md`, `.agents/status.md`, `.agents/*-prompt.md`, `.agents/fixes/*` | Orchestrator | Scaffolding & Handoff Loop |
| `index.html`, `public/favicon.svg` | UI Agent | M1 |
| `src/data/profile.js` | UI Agent | M1 |
| `src/core/icons.js`, `src/core/settings.js`, `src/core/sound.js` | UI Agent | M1 |
| `src/core/windowManager.js`, `src/core/boot.js`, `src/core/desktop.js` | UI Agent | M1 (enhanced in M3 for CRT hooks) |
| `src/core/taskbar.js`, `src/core/startMenu.js` | UI Agent | M1 (enhanced in M3 for CRT power/tray) |
| `src/main.js` | UI Agent | M1 (registers apps in M2, wires CRT/cursor in M3) |
| `src/style.css` | UI Agent | M1 -> M2 -> M3 |
| `src/apps/{about,projects,skills,contact,terminal,settings}.js` | UI Agent | M2 (CRT/cursor controls wired in M2/M3) |
| `src/core/crt.js`, `src/core/cursor.js` | UI Agent | M3 |
| `.agents/reviews/review-m1.md` .. `review-m4.md` | Review Agent | After M1, M2, M3, M4 |
| `tests/**`, `vitest.config.js`, `playwright.config.js` | Test Agent | M4 |
| `README.md` | UI Agent | M4 |

---

## 5. Module & Interface Contracts

### 5.1 DOM Shell Structure (`index.html` & `src/main.js`)
The entire OS renders inside `#crt-monitor` -> `#crt-screen` so that the CRT bezel frames everything on desktop and drops cleanly on mobile (`<= 768px`), and windows clamp to `#crt-screen`:

```html
<div id="app">
  <div id="crt-monitor" class="crt-monitor">
    <div class="crt-bezel-top" aria-hidden="true"></div>
    <div id="crt-screen" class="crt-screen">
      <!-- OS Desktop Workspace -->
      <main class="os-desktop" id="os-desktop" aria-label="Simulated Desktop Environment">
        <div class="os-wallpaper-layer" aria-hidden="true"></div>
        <div class="os-desktop-layer" id="os-desktop-layer"></div>
        <div class="os-window-layer" id="os-window-layer"></div>
      </main>
      <!-- Start Menu Flyout (mounted inside #crt-screen or #os-desktop) -->
      <!-- Taskbar (mounted at bottom of #crt-screen) -->
      <!-- Boot Screen Overlay (mounted inside #crt-screen) -->
      <!-- Sleep / Suspend Overlay (mounted inside #crt-screen) -->
      <!-- CRT Non-Interactive Visual Overlays (pointer-events: none) -->
      <div class="crt-overlay-scanlines" aria-hidden="true"></div>
      <div class="crt-overlay-vignette" aria-hidden="true"></div>
      <div class="crt-overlay-flicker" aria-hidden="true"></div>
      <div class="crt-power-anim" id="crt-power-anim" aria-hidden="true"></div>
    </div>
    <!-- CRT Bottom Chin (Brand Badge + Power LED Button) -->
    <div class="crt-bezel-chin">
      <div class="crt-brand-badge" id="crt-brand-badge"></div>
      <button type="button" class="crt-power-btn" id="crt-power-btn" aria-label="Toggle Monitor Power / Wake" title="Monitor Power">
        <span class="crt-power-led" id="crt-power-led"></span>
        <span class="crt-power-label">PWR</span>
      </button>
    </div>
  </div>
</div>
```

### 5.2 `src/data/profile.js` Contract
- Exports `profile` object and helper `getAvatarInitials(name)` (derives 1–2 uppercase initials from `name`, e.g., `'Your Name'` -> `'YN'`).
- Uses **only honest placeholders** (`Your Name`, `your@email.com`, `guest_user`, `personal-pc`, `TODO:` notes).
- Contains:
  - `name`, `username`, `hostname`, `role`, `tagline`, `location`, `status`, `avatarInitials`
  - `about`: `{ fileName: 'About Me.txt', lastModified, summary: string[], interests: string[], quickFacts: Array<{label, value}>, experience: Array<{role, company, period, highlights: string[]}> }`
  - `projects`: `Array<{ id, title, category, date, status, description, details, tech: string[], liveUrl, repoUrl }>`
  - `skills`: `{ systemSpecs: { osName, osCodename, kernel, uptime, memory }, categories: Array<{ name, description, items: Array<{ name, level, tag, filterTag }> }>, additionalTags: string[] }`
  - `contact`: `{ email, availabilityNote, officeHours, socials: Array<{ platform, handle, url, description }> }`
  - `system`: `{ osName: 'AetherOS v2.4', osCodename: 'CRT Edition', kernel: 'Vanilla-JS Microkernel 64-bit', defaultTheme: 'cyber-dark', defaultMode: 'dark', defaultWallpaper: 'aurora', defaultAccent: '#38bdf8', soundEnabled: true, crtFrame: true, crtScanlines: true, crtVignette: true, crtFlicker: false, customCursor: true, cursorTrail: true }`
  - `appearance`: `{ themes: [...5 themes], wallpapers: [...5 wallpapers], accents: [...5 accents] }`

### 5.3 `src/core/settings.js` Contract
- Exports `STORAGE_KEY = 'delmiios_settings_v1'`, `VALID_THEMES = ['cyber-dark', 'retro-teal', 'sunset-dusk', 'matrix', 'clean-slate']`, `VALID_MODES = ['dark', 'light']`, class `SettingsStore`, and singleton `settingsStore`.
- State properties:
  - `theme`: `'cyber-dark' | 'retro-teal' | 'sunset-dusk' | 'matrix' | 'clean-slate'`
  - `mode`: `'dark' | 'light'`
  - `wallpaper`: `'aurora' | 'sunset' | 'blueprint' | 'emerald' | 'minimal'`
  - `accent`: string (e.g. `'#38bdf8'`)
  - `soundEnabled`: boolean
  - `crtFrame`: boolean
  - `crtScanlines`: boolean
  - `crtVignette`: boolean
  - `crtFlicker`: boolean
  - `customCursor`: boolean
  - `cursorTrail`: boolean
- Public API on `settingsStore`:
  - `getState()` -> `{ ...state }`
  - `setTheme(themeOrMode)` -> if `'dark'` or `'light'`, sets `mode` (and if `'light'`, sets `mode = 'light'`); if in `VALID_THEMES`, sets `theme` (and sets `mode = 'dark'`). Returns `boolean` indicating validity.
  - `setMode(mode)` -> sets `'dark' | 'light'`, returns `boolean`.
  - `toggleMode()` -> toggles `'dark'` / `'light'`, returns new `mode`.
  - `setWallpaper(wallpaperId)` -> validates against `profile.appearance.wallpapers`, returns `boolean`.
  - `setAccent(colorHex)` -> sets `accent`, returns `boolean`.
  - `setSound(enabled)` -> sets `soundEnabled: Boolean(enabled)`, syncs `sound.setEnabled(...)`, returns `boolean`.
  - `toggleSound()` -> flips `soundEnabled`, returns new `soundEnabled`.
  - `setCrt(partialOrPreset)` -> accepts object `{ crtFrame?, crtScanlines?, crtVignette?, crtFlicker? }` or string `'on' | 'off' | 'frame' | 'scanlines' | 'vignette' | 'flicker'`, persists and applies.
  - `toggleCrtMaster()` -> toggles CRT visual effects (`crtScanlines` & `crtVignette` & `crtFrame`) on/off as a one-click tray action; returns `boolean` (whether CRT is active).
  - `setCursor(partial)` -> accepts `{ customCursor?, cursorTrail? }`, persists and applies.
  - `resetDefaults()` -> restores defaults from `profile.system`, persists, applies, notifies.
  - `subscribe(cb)` -> registers listener `cb(state)`, returns `unsubscribe` function.
  - `apply()` -> updates `document.documentElement` and `document.body` attributes (`data-theme`, `data-mode`, `data-wallpaper`, `--accent`, CRT classes).

### 5.4 `src/core/windowManager.js` Contract
- Exports pure helpers for unit testing:
  - `clampWindowPosition({ left, top, width, height, boundsWidth, boundsHeight, minVisibleWidth = 120, topMin = 0 })` -> `{ left, top }`
  - `computeCascadePosition({ index, width, height, boundsWidth, boundsHeight })` -> `{ left, top }`
- Exports class `WindowManager`:
  - `constructor(windowLayerEl)`
  - `registerApp(appDef)` — `appDef`: `{ id, title, shortTitle, desktopLabel, description, icon, defaultWidth, defaultHeight, render(container, ctx) }`
  - `getRegisteredApps()` -> `appDef[]`
  - `getOpenWindows()` -> `winState[]`
  - `getActiveAppId()` -> `string | null`
  - `openApp(appId, payload)` -> opens window (or restores/focuses if already open) and delivers `payload` via `ctx.payload` on initial render and `winState.onPayload(payload)` when already open or freshly opened.
  - `closeWindow(appId)`, `closeAllWindows()`, `minimizeWindow(appId)`, `restoreWindow(appId)`, `setMaximized(appId, bool)`, `toggleMaximize(appId)`, `toggleTaskbarWindow(appId)`, `focusWindow(appId)`
  - `subscribe(cb)` -> calls `cb({ openWindows, activeAppId })` on state changes; returns `unsubscribe()`.
  - Clamping & sizing use `this.container.clientWidth` / `this.container.clientHeight` (the inner `#os-window-layer` inside `#crt-screen`), falling back to `window.innerWidth` / `window.innerHeight - 50` if layout dimensions are `0` (e.g. in JSDOM/unit tests).

### 5.5 App Render Context (`ctx`) & Cross-App Payload Contract
Every `appDef.render(container, ctx)` receives:
```js
ctx = {
  windowManager,
  openApp: (targetId, payload) => windowManager.openApp(targetId, payload),
  close: () => windowManager.closeWindow(appDef.id),
  payload // optional initial payload
}
```
And may return `{ cleanup?(), onFocus?(), onPayload?(payload) }`.
- **Supported Payloads**:
  - `projects`: `ctx.openApp('projects', { filterTag: 'TypeScript', projectId?: 'proj-1' })` — filters projects by tech tag (case-insensitive match against `proj.tech` or `proj.category`) or selects a project in the detail pane.
  - `contact`: `ctx.openApp('contact', { subject: 'Inquiry about Project Alpha' })` — pre-fills `#compose-subject` input in the Quick Message Composer and focuses `#compose-body`.

### 5.6 `src/core/crt.js` Contract
- Exports class `CRTController` and singleton/factory `initCRT({ monitorEl, screenEl, powerBtnEl, settingsStore, onWake })`.
- Syncs with `settingsStore` state (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`):
  - Toggles `.crt-monitor--bezel-on`, `.crt-screen--scanlines`, `.crt-screen--vignette`, `.crt-screen--flicker`, `.crt-screen--glow`.
  - Respects `prefers-reduced-motion: reduce` (suppresses flicker and collapse/expand animations).
- Methods:
  - `playPowerOn()` -> triggers CRT horizontal line expand animation (`.crt-power-anim--on`).
  - `playPowerOff()` -> triggers CRT collapse-to-line/dot animation (`.crt-power-anim--off`).
  - `setSleeping(isSleeping)` -> updates power LED state (green vs amber standby).
  - `destroy()` -> cleans up listeners and subscriptions.

### 5.7 `src/core/cursor.js` Contract
- Exports pure math functions for unit testing:
  - `shortestAngleDelta(fromRad, toRad)` -> returns angle delta in `[-Math.PI, Math.PI]`.
  - `stepAngle(currentRad, targetRad, factor)` -> returns new angle in `[-Math.PI, Math.PI]`.
  - `computeHeading(dx, dy, minSpeed = 0.6)` -> returns `Math.atan2(dy, dx)` or `null` if `Math.hypot(dx, dy) < minSpeed`.
  - `pruneTrailPoints(points, nowMs, maxAgeMs = 380, maxPoints = 80)` -> returns pruned array of `{ x, y, t }`.
  - `computeSmoothMidpoints(points)` -> returns array of segments/control points for continuous quadratic curve drawing.
- Exports class `CursorController` and factory `initCursor({ settingsStore })`:
  - Activates only when `window.matchMedia('(pointer: fine)').matches` is true.
  - Adds `has-custom-cursor` class to `document.documentElement` only after successful initialization when `customCursor` is enabled; removes it immediately when disabled.
  - Renders `<canvas class="cursor-trail-canvas" aria-hidden="true">` (full viewport, `pointer-events: none`, highest z-index `999999`) and `<div class="custom-cursor" aria-hidden="true">` (red equilateral triangle SVG pointing along `0 rad` by default with a center dot at the exact hotspot).
  - Stops `requestAnimationFrame` loop when pointer is idle AND trail is empty AND cursor spin is inactive (e.g. reduced motion or cursor disabled).
  - `destroy()` removes DOM elements, `has-custom-cursor` class, event listeners, and cancels `requestAnimationFrame`.

### 5.8 `src/apps/terminal.js` Exported Pure Helpers
- Exports `escapeHtml(str)`, `parseCommandInput(raw)`, `getAutocompleteSuggestions(inputStr, appIds, themeIds, virtualFileNames)`, and `terminalApp`.

---

## 6. Handoff Dispatch Sequence

1. **Dispatch 1**: Give `.agents/ui-agent-m1.md` to the **UI Agent** (builds M1 Core).
2. **Return 1**: Orchestrator verifies `npm run build`, commits M1, updates `status.md`, and instructs user to dispatch `.agents/review-agent-prompt.md` (for M1).
3. **Dispatch 2**: Give `.agents/review-agent-prompt.md` (with milestone = `M1`) to the **Review Agent** (writes `.agents/reviews/review-m1.md`).
4. **Return 2**: Orchestrator inspects `review-m1.md`. If blocker/major findings exist, writes `.agents/fixes/fix-m1-1.md` for UI Agent; otherwise dispatches `.agents/ui-agent-m2.md`.
5. **Dispatch 3**: Give `.agents/ui-agent-m2.md` to the **UI Agent** (builds M2 Apps & Cross-App Navigation).
6. **Return 3**: Orchestrator verifies `npm run build`, commits M2, dispatches `.agents/review-agent-prompt.md` (for M2).
7. **Dispatch 4**: Give `.agents/review-agent-prompt.md` (with milestone = `M2`) to the **Review Agent** (writes `.agents/reviews/review-m2.md`).
8. **Return 4**: Orchestrator resolves any M2 findings or advances to M3.
9. **Dispatch 5**: Give `.agents/ui-agent-m3.md` to the **UI Agent** (builds M3 Experience: CRT Monitor Frame, Custom Cursor & Trail, 5 Themes, Responsive & A11y polish).
10. **Return 5**: Orchestrator verifies `npm run build`, commits M3, dispatches `.agents/review-agent-prompt.md` (for M3).
11. **Dispatch 6**: Give `.agents/review-agent-prompt.md` (with milestone = `M3`) to the **Review Agent** (writes `.agents/reviews/review-m3.md`).
12. **Return 6**: Orchestrator resolves any M3 findings or advances to M4.
13. **Dispatch 7**: Give `.agents/test-agent-prompt.md` to the **Test Agent** (builds unit & E2E tests in `tests/`).
14. **Return 7**: Orchestrator runs tests (`npm test`), dispatches `.agents/ui-agent-m4.md` to the **UI Agent** (writes `README.md` & any test-driven polish).
15. **Dispatch 8**: Give `.agents/ui-agent-m4.md` to the **UI Agent**, followed by final Review gate (`.agents/review-agent-prompt.md` for M4), final commit & push to `origin main`, and Final Report.
