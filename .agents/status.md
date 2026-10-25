# Project Status Tracker — `delmiios`

## Current State
- **Active Milestone**: **M3 Experience — Review Gate** (`M3` build complete; awaiting Review Agent audit)
- **Next Prompt to Dispatch**: `.agents/review-agent-prompt.md` -> **Review Agent** (auditing **M3** and writing `.agents/reviews/review-m3.md`)
- **Git Repository**: `D:\delmiios` (`main` branch, synced with `origin/main` at `https://github.com/DelMiiYa/delmiios.git`).

---

## Milestone Progress

| Milestone | Build Status | Review Gate | Open Blockers/Majors | State |
| :--- | :--- | :--- | :--- | :--- |
| **Scaffolding & Plan** | Passed (`package.json`, `vite.config.js`, `.gitignore`, `.agents/*`) | N/A | 0 | **Completed** |
| **M1: Core** | **Passed** (`npm run build` ✓) | **PASS** ([`review-m1.md`](./reviews/review-m1.md)) | 0 | **Completed** |
| **M2: Apps** | **Passed** (`npm run build` ✓) | **PASS** ([`review-m2.md`](./reviews/review-m2.md)) | 0 | **Completed** |
| **M3: Experience** | **Passed** (`npm run build` ✓ 21 modules, 0 errors/warnings) | **In Review** (`.agents/reviews/review-m3.md`) | 0 | **Under Review** |
| **M4: Hardening** | Pending | Pending `.agents/reviews/review-m4.md` | 0 | Queued |

---

## Key Architectural Decisions
1. **Repository Root**: `D:\delmiios` is the project and Git root. Reference prototype directories (`featurefulweb/`, `goodlookingweb/`) and `agent-prompt-combined.md` are excluded in `.gitignore` so they are never tracked, committed, or pushed.
2. **Unified Settings Store (`src/core/settings.js`)**: Single versioned `localStorage` key `delmiios_settings_v1` managing `theme` (5 themes from `goodlookingweb`: `cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`), `mode` (`dark` / `light` from `featurefulweb`), `wallpaper` (5 CSS patterns/gradients), `accent` (5 color swatches), `soundEnabled`, CRT toggles (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`), and Cursor toggles (`customCursor`, `cursorTrail`).
3. **CRT Screen Shell (`#crt-monitor` > `#crt-screen`)**: Created in M1's DOM shell and controlled by `src/core/crt.js` in M3 so `WindowManager` clamps and cascades windows relative to the inner `#crt-screen` bounds, preventing any window from hiding under the desktop CRT bezel.
4. **Test Agent Included**: Dedicated Test Agent in M4 (`test-agent-prompt.md`) using Vitest for unit testing pure logic (`settings.js`, `windowManager.js` clamping math, `terminal.js` parser/autocomplete/XSS escaping, `cursor.js` angle/heading/trail math) and Playwright for full E2E browser smoke testing.

---

## Open Findings
- **Blockers / Majors**: `0` (awaiting `.agents/reviews/review-m3.md`)
- **M1/M2 Minor Polish Items**: Resolved in M3 (`crtController.setSleeping` wired in `startMenu.js`, `.wallpaper-desc` CSS fallback fixed in `style.css`, dynamic registry lookup wired in `terminal.js`).
