# Project Status Tracker — `delmiios`

## Current State
- **Active Milestone**: **M3 Experience: CRT Monitor Frame, Custom Cursor & Trail, Themes, Responsive & A11y Polish** (Ready for Dispatch)
- **Next Prompt to Dispatch**: `.agents/ui-agent-m3.md` -> **UI Agent**
- **Git Repository**: `D:\delmiios` (`main` branch, synced with `origin/main` at `https://github.com/DelMiiYa/delmiios.git`).

---

## Milestone Progress

| Milestone | Build Status | Review Gate | Open Blockers/Majors | State |
| :--- | :--- | :--- | :--- | :--- |
| **Scaffolding & Plan** | Passed (`package.json`, `vite.config.js`, `.gitignore`, `.agents/*`) | N/A | 0 | **Completed** |
| **M1: Core** | **Passed** (`npm run build` ✓) | **PASS** ([`review-m1.md`](./reviews/review-m1.md)) | 0 | **Completed** |
| **M2: Apps** | **Passed** (`npm run build` ✓) | **PASS** ([`review-m2.md`](./reviews/review-m2.md)) | 0 | **Completed** |
| **M3: Experience** | Pending UI Agent | Pending `.agents/reviews/review-m3.md` | 0 | **Next Up** |
| **M4: Hardening** | Pending | Pending `.agents/reviews/review-m4.md` | 0 | Queued |

---

## Key Architectural Decisions
1. **Repository Root**: `D:\delmiios` is the project and Git root. Reference prototype directories (`featurefulweb/`, `goodlookingweb/`) and `agent-prompt-combined.md` are excluded in `.gitignore` so they are never tracked, committed, or pushed.
2. **Unified Settings Store (`src/core/settings.js`)**: Single versioned `localStorage` key `delmiios_settings_v1` managing `theme` (5 themes from `goodlookingweb`: `cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`), `mode` (`dark` / `light` from `featurefulweb`), `wallpaper` (5 CSS patterns/gradients), `accent` (5 color swatches), `soundEnabled`, CRT toggles (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`), and Cursor toggles (`customCursor`, `cursorTrail`).
3. **CRT Screen Shell (`#crt-monitor` > `#crt-screen`)**: Created in M1's DOM shell so `WindowManager` clamps and cascades windows relative to the inner `#crt-screen` bounds from day one, preventing any window from hiding under the desktop CRT bezel.
4. **Test Agent Included**: Dedicated Test Agent in M4 (`test-agent-prompt.md`) using Vitest for unit testing pure logic (`settings.js`, `windowManager.js` clamping math, `terminal.js` parser/autocomplete/XSS escaping, `cursor.js` angle/heading/trail math) and Playwright for full E2E browser smoke testing.

---

## Open Findings
- **Blockers / Majors**: `0`
- **Minor Polish Items Folded into `ui-agent-m3.md`**:
  - Route sleep/wake hardware state through `crtController.setSleeping(bool)` in M3 (`src/core/crt.js`).
  - Fix `.wallpaper-desc` CSS fallback syntax (`color: var(--text-secondary, #94a3b8);`) in `src/style.css`.
  - Dynamically read `windowManager.getRegisteredApps().map(a => a.id)` in `src/apps/terminal.js` `open` command.
