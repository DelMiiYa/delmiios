# Milestone Review Report: M2

## 1. Verdict
- **Status**: **PASS**
  *(Note: PASS requires 0 Blocker and 0 Major findings. Minor findings are allowed on PASS.)*

## 2. Verification Summary
- Build check (`npm run build`): **Pass** (Vite v6.4.5 built 19 modules cleanly in 254ms with 0 errors and 0 warnings; dist output verified: `dist/index.html` 0.48 kB, `dist/assets/index-BuO4RyqM.css` 43.03 kB, `dist/assets/index-zxnATcu5.js` 101.11 kB).
- Architecture & Contract Compliance: **Pass**
  - All 6 apps (`aboutApp`, `projectsApp`, `skillsApp`, `contactApp`, `terminalApp`, `settingsApp`) are imported and registered via `windowManager.registerApp(app)` in `src/main.js`.
  - App definitions follow the standard schema: `id`, `title`, `shortTitle`, `desktopLabel`, `description`, `icon`, `defaultWidth`, `defaultHeight`, and `render(container, ctx)`.
  - Desktop shortcut icons (`src/core/desktop.js`) and Start menu (`src/core/startMenu.js`) dynamically derive their lists from `windowManager.getRegisteredApps()`.
  - Cross-App Navigation & Payload Routing:
    - **About -> Projects**: "Explore Projects" button navigates to `projects` via `ctx.openApp('projects')`.
    - **About -> Contact**: "Contact Me" button navigates to `contact` via `ctx.openApp('contact')`.
    - **Projects -> Contact**: "Discuss this project" buttons in both the project list cards and the detail pane invoke `navApp('contact', { subject: 'Project Inquiry: ...' })`.
      - **Closed State**: Contact window opens with `#compose-subject` pre-filled and `#compose-body` focused.
      - **Already-Open State**: WindowManager restores/focuses existing window and executes `existing.onPayload(payload)`, which updates `#compose-subject`, applies visual highlight animation, and focuses `#compose-body`.
    - **Skills -> Projects**: Clicking any capability meter row button (`data-skill-filter`) or module chip (`sys-module-chip`) invokes `navApp('projects', { filterTag })`.
      - **Closed State**: Projects opens filtered to the clicked skill, showing the active filter pill and matching projects.
      - **Already-Open State**: `projectsApp.render()` returns `onPayload(payload)` which sets `activeTechFilter`, clears active folder to 'All', and live-rerenders grid and detail panes.
    - **Contact -> About**: "View About Me.txt" button opens `about` via `navApp('about')`.
    - **Terminal `open <app>`**: Launches any registered desktop application window (`about`, `projects`, `skills`, `contact`, `terminal`, `settings`).
  - Contact Quick Message Composer Centerpiece:
    - Implements `#compose-subject`, `#compose-body`, and generates `mailto:${email}?subject=...&body=...` with full `encodeURIComponent` escaping.
    - Primary "Send Email" direct mailto action.
    - "Copy Email" action featuring `aria-live="polite"` visual confirmation ("✓ Copied to Clipboard!"), automated text restoration, and fallback for non-secure/legacy environments via textarea select & `execCommand('copy')`.
  - Terminal Application:
    - Implements all 16 required commands: `help`, `about`, `projects`, `skills`, `contact`, `whoami`, `date`, `ls`, `cat <file>`, `open <app>`, `theme [name]`, `sound [on|off]`, `crt [...]`, `cursor [...]`, `clear`, `exit`.
    - ArrowUp and ArrowDown history navigation with index tracking and input restoration.
    - Tab autocompletion for commands, applications (`open <app>`), themes (`theme <preset|mode>`), files (`cat <file>`), sound states, and CRT/cursor sub-arguments.
    - Quick-command button bar (`help`, `about`, `projects`, `skills`, `contact`, `ls`, `theme`, `crt`, `clear`).
    - Pure functions exported for unit testing: `escapeHtml`, `parseCommandInput`, and `getAutocompleteSuggestions` (supporting both positional arguments and context objects).
  - Settings Application:
    - Complete controls for 5 themes (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`), dark/light mode toggle, 5 wallpapers with CSS pattern previews, 5 accent color swatches, Web Audio sound toggle, 4 CRT shader toggles (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`), 2 cursor toggles (`customCursor`, `cursorTrail`), and "Reset to Defaults".
    - Accessible selection states using `role="radiogroup"` with `aria-checked="true|false"` on cards and `role="switch"` on toggles.
    - Live synchronization via `settingsStore.subscribe(syncUI)`.
    - Window lifecycle cleanup: `render()` returns `{ cleanup() { unsubscribe(); } }`, which `windowManager.closeWindow` invokes upon window close, preventing memory leaks.
- XSS & Security Audit: **Pass**
  - All command echoes, user arguments, dynamic inputs, and profile data rendered into `terminal.js` pass through `escapeHtml(str)` or are safely placed in text nodes.
  - No raw user input or unvalidated strings are interpolated into `innerHTML`.
  - Links to external project demos, repositories, and social platforms use `target="_blank" rel="noopener noreferrer"`.
  - Subject and body parameters in `mailto:` links are escaped via standard `encodeURIComponent`.
- Memory / Event Listener / rAF Cleanup Audit: **Pass**
  - `settingsApp` unsubscribes its `settingsStore` subscription when closed via `cleanup()`.
  - `windowManager.closeWindow(appId)` safely invokes `winState.cleanup()` in a `try...catch` block before tearing down DOM elements.
  - All app event listeners are bound to scoped subtree DOM nodes created during `render()`, allowing clean garbage collection when window elements are removed from `#os-window-layer`.
  - Terminal command history is kept in an in-memory array scoped to the active terminal instance.
  - No orphaned global listeners or running intervals are spawned by M2 apps.
- Accessibility (`prefers-reduced-motion`, ARIA, Keyboard, Contrast): **Pass**
  - Complete ARIA semantics: `role="dialog"` on windows, `role="region"` on project list and detail pane, `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` on skill bars, `role="radiogroup"` and `role="radio"` with `aria-checked` on settings presets, `role="switch"` on toggles, and `role="log"` with `aria-live="polite"` on terminal output.
  - Keyboard navigation: Full Tab key autocomplete and Arrow navigation in terminal; buttons, links, inputs, and custom cards receive focus and visible `:focus-visible` styling; form inputs have explicitly associated `<label>` elements.
  - `prefers-reduced-motion: reduce`: Global rule collapses all transitions and animations to `0.01ms`, disables CRT scanline/flicker animations, and eliminates unnecessary motion for sensitive users.
  - Contrast ratios meet WCAG AA across all theme presets and dark/light modes.
- Responsive (`1440px`, `1024px`, `390px` / `<=768px`): **Pass**
  - Desktop (`1440px`, `1024px`): 3-pane file explorer in Projects, side-by-side hero and quick facts in About, responsive 2-column card grids in Skills and Contact.
  - Mobile (`390px` / `<=768px`): Windows automatically maximize on open; CRT monitor frame and chin drop cleanly; Projects file explorer folds the sidebar into a horizontally scrollable chip bar, and stacks project cards and detail panes vertically; About hero stacks vertically; touch tap immediately launches apps from desktop icons.

## 3. Findings

### Blockers (Must be 0 to pass)
- None

### Major Findings (Must be 0 to pass)
- None

### Minor / Polish Suggestions
- **`src/style.css` (Line 2648)**: Inside `.wallpaper-desc`, the color property is written as `color: var(--text-secondary), #94a3b8;`. In CSS, the fallback argument must reside inside the function parentheses: `color: var(--text-secondary, #94a3b8);`. While modern browsers currently cascade to the inherited text color without breaking layout, updating this syntax during Milestone 3 will ensure strict CSS standards compliance.
- **`src/apps/terminal.js` (Lines 435–454)**: In the `open <app>` command handler, the list of valid apps is statically defined as `['about', 'projects', 'skills', 'contact', 'terminal', 'settings']`. While this covers all Milestone 2 applications, dynamically reading `windowManager.getRegisteredApps().map(a => a.id)` when `windowManager` is available would further unify app discovery with the registry.
- **`src/apps/terminal.js` (Line 184)**: Terminal default window dimensions are set to `690x460px`. On smaller desktop resolutions (e.g. 1024x768), opening multiple windows cascades neatly, but terminal quick-command chips wrap to two lines. Milestone 3 CRT polish could optionally set `flex-wrap: wrap` gap adjustments or horizontal scroll for ultra-compact window sizes.
