# Handoff Prompt: UI Agent — Milestone 3 (M3 Experience: CRT Monitor Frame, Custom Cursor & Trail, Themes, Responsive & A11y Polish)

> **Role**: You are the **UI & Experience Agent** for **Milestone 3 (M3 Experience)** of the **DelMiiOS (AetherOS v2.4 — Combined Edition)** project in `D:\delmiios`.
> You have **no memory of prior conversations**. Read `D:\delmiios\.agents\plan.md` and inspect the existing M1 & M2 codebase in `D:\delmiios\src\` before writing code.

---

## 1. Hard Rules & Constraints

1. **No Sub-Agents**: Never launch, invoke, or spawn any sub-agents or delegation tools.
2. **No Git Commands**: Never run any `git` commands. The Project Orchestrator owns all git operations.
3. **Strict File Ownership**: You own `src/core/crt.js`, `src/core/cursor.js`, `src/main.js` (wiring CRT and Cursor controllers), `src/style.css` (CRT bezel/overlays/animations, custom cursor, 5 themes + light/dark + wallpapers, responsive & reduced-motion polish), and any small integration hooks in `src/core/{boot,startMenu,taskbar,windowManager}.js` or `src/apps/{settings,terminal}.js`.
4. **Zero Runtime Dependencies**: Vanilla JS and CSS only.
5. **All English**: All code, comments, identifiers, and UI text must be in English.
6. **Exported Pure Math Functions Required**: `src/core/cursor.js` **must** export the pure math functions specified in Section 4.2 below so the M4 Test Agent can unit-test them directly.

---

## 2. Project Context & Goal for Milestone 3

Milestones 1 and 2 delivered the core OS subsystems and all 6 desktop applications with cross-app navigation.
In **Milestone 3**, you will build the two flagship visual/interactive experiences required by the brief and polish all 5 themes, responsive behavior, and accessibility:
1. **CRT Monitor Frame (`src/core/crt.js` + CSS)**: Full retro-modern CRT monitor bezel on desktop, recessed curved `#crt-screen`, scanlines + RGB phosphor mask, vignette + corner glass reflection, subtle flicker + rolling scan band, subtle phosphor text glow, CRT power-on (horizontal line expand) and power-off (collapse to line/dot) animations, power LED & button on the bezel chin, one-click tray toggle, Settings toggles, Terminal `crt` command, auto-bezel drop on mobile (`<= 768px`), and `prefers-reduced-motion` compliance.
2. **Custom Cursor & Continuous White Trail (`src/core/cursor.js` + CSS)**: Red equilateral triangle cursor with center dot hotspot (`--cursor-color`), smooth velocity heading rotation along the shortest angular path (`atan2(dy, dx)`), continuous slow spin (`~30 deg/s`) after `~180ms` idle with smooth re-alignment on resume, hover scale-up + mousedown pulse, and a full-viewport HiDPI `<canvas>` rendering a smooth continuous white fading line trail (`~380ms` decay, osu!-style), with Settings & Terminal toggles, fine-pointer detection, and `prefers-reduced-motion` support.
3. **Theme, Responsive & Accessibility Polish (`src/style.css`)**: Verify all 5 themes (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`) + `dark`/`light` modes + 5 wallpapers have strong contrast, theme-coordinated CRT bezel colors, touch-friendly hit targets (`>= 40px` on mobile), and strict `prefers-reduced-motion` compliance.

---

## 3. Exact File Ownership for Milestone 3

1. `D:\delmiios\src\core\crt.js` — **CRT Monitor Frame & Power Animation Controller** (`CRTController`, `initCRT`)
2. `D:\delmiios\src\core\cursor.js` — **Custom Triangle Cursor & Canvas Trail Controller** (`CursorController`, `initCursor`, plus exported pure math functions)
3. `D:\delmiios\src\main.js` — Initialize `initCRT(...)` and `initCursor(...)`, connect Boot / Restart / Sleep / Wake to `crtController.playPowerOn()` and `crtController.playPowerOff()`.
4. `D:\delmiios\src\style.css` — Complete CRT monitor bezel, screen curvature, scanlines/vignette/flicker overlays, CRT power-on/off keyframe animations, custom cursor & canvas trail styles, theme bezel variables, responsive `<= 768px` bezel drop, and `@media (prefers-reduced-motion: reduce)` rules.
5. Integration refinements (if needed) in `src/core/{boot,startMenu,taskbar,windowManager}.js` and `src/apps/{settings,terminal}.js`.

---

## 4. Detailed Feature Specifications

### 4.1 CRT Monitor Frame (`src/core/crt.js` & `src/style.css`)

#### Visual & Structural Spec:
- **Outer Monitor Bezel (`#crt-monitor`)**:
  - Wraps the entire OS (`#crt-screen` and `.crt-bezel-chin`).
  - On desktop widths (`> 768px` and height `> 520px`) when `crtFrame` is `true` (`.crt-monitor--bezel-on`):
    - Displays a chunky, tactile plastic monitor frame (`padding: 22px 26px 44px;`) colored via theme CSS variables (`--bezel-bg`, `--bezel-border`, `--bezel-highlight`, `--bezel-shadow` — e.g. dark charcoal/indigo in `cyber-dark`, classic warm putty/beige-grey in `retro-teal`, deep plum charcoal in `sunset-dusk`, obsidian phosphor case in `matrix`, matte studio titanium in `clean-slate`, and warm ivory/putty in `data-mode="light"`).
    - Inner recessed screen rim around `#crt-screen` with multi-layered inset box-shadows.
    - Bottom monitor chin (`.crt-bezel-chin`) containing:
      - Brand plate / badge (`.crt-brand-badge`) showing an SVG monitor emblem + `profile.system.osName` (`AetherOS v2.4`) and model tag (`CRT-17 SYNC`).
      - Tactile Power button (`.crt-power-btn#crt-power-btn`) with a glowing LED indicator (`.crt-power-led#crt-power-led` — emerald green `#22c55e` when system is awake; amber `#f59e0b` when system is in Sleep/Suspended mode). Clicking the power button toggles Sleep/Off or wakes the system!
- **Inner Screen (`#crt-screen`)**:
  - Rounded corners (`border-radius: 18px` when bezel is on) and subtle barrel-curvature feel via inner vignette shadow and corner highlight (never blur text or distort pointer click coordinates).
  - Non-interactive overlay layers inside `#crt-screen` (all `pointer-events: none`, positioned `absolute; inset: 0;`, above windows/taskbar/boot/sleep):
    1. `.crt-overlay-scanlines` (active when `.crt-screen--scanlines` is present): `repeating-linear-gradient` horizontal scanlines (`3px` period) + subtle vertical RGB phosphor subpixel tint (`6px` period).
    2. `.crt-overlay-vignette` (active when `.crt-screen--vignette` is present): `radial-gradient` darkening the outer corners/edges + a soft diagonal glass reflection highlight in the top-left corner.
    3. `.crt-overlay-flicker` (active when `.crt-screen--flicker` is present): subtle opacity flicker animation + slow rolling horizontal scan band (`translateY` transform).
  - Subtle text glow (`text-shadow: 0 0 6px rgba(56, 189, 248, 0.16)`) via `.crt-screen--glow` class on `#crt-screen`.
- **Power Animations (`.crt-power-anim#crt-power-anim`)**:
  - `crtController.playPowerOn()`: plays a classic CRT turn-on animation (~420ms: bright white/cyan horizontal line expanding from center dot -> full width -> full height, fading out to reveal the screen) when initial boot starts, when Restart is triggered, or when waking from Sleep/Off.
  - `crtController.playPowerOff()`: plays a CRT turn-off animation (~380ms: screen brightness flash collapsing vertically to a thin bright horizontal line, then shrinking to a center phosphor dot) when entering Sleep/Off.
  - Clicking anywhere on `#shutdown-overlay` OR clicking `#crt-power-btn` wakes the monitor and calls `playPowerOn()`.
- **Responsive (`<= 768px` or `max-height: 520px`)**:
  - Automatically drops the outer bezel (`padding: 0`, `.crt-bezel-chin { display: none; }`, `#crt-screen { border-radius: 0; }`) so the screen is edge-to-edge on mobile and zero usable area is wasted, while keeping light scanlines/vignette if enabled.
  - Ensure `WindowManager` clamps all windows to `#os-window-layer` (inside `#crt-screen` above the taskbar) so no window ever hides under the bezel or taskbar.
- **Reduced Motion**:
  - When `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true, disable flicker, disable rolling scan band, and replace the CRT expand/collapse animations with a simple quick fade.

---

### 4.2 Custom Cursor & Continuous White Trail (`src/core/cursor.js` & `src/style.css`)

#### Required Exported Pure Math Functions (in `src/core/cursor.js`):
You **must** export these exact pure functions so the Test Agent can import and unit-test them directly:

1. `export function normalizeAngle(rad)`
   - Wraps any angle in radians into the interval `[-Math.PI, Math.PI]`.
2. `export function shortestAngleDelta(fromRad, toRad)`
   - Returns `normalizeAngle(toRad - fromRad)`, the shortest signed angular difference in `[-Math.PI, Math.PI]` (correctly handling the `+π` / `-π` wraparound).
3. `export function stepAngle(currentRad, targetRad, smoothing = 0.28)`
   - Moves `currentRad` toward `targetRad` by `shortestAngleDelta(currentRad, targetRad) * clamp(smoothing, 0, 1)` and returns `normalizeAngle(result)`.
4. `export function computeHeading(dx, dy, minSpeed = 0.6)`
   - Computes `speed = Math.hypot(dx, dy)`. If `speed < minSpeed`, returns `null` (prevents jitter on sub-pixel movement). Otherwise returns `Math.atan2(dy, dx)` in `[-Math.PI, Math.PI]`.
5. `export function pruneTrailPoints(points, nowMs, maxAgeMs = 380, maxPoints = 80)`
   - Filters `points` (each `{ x, y, t }`) to keep only points where `nowMs - p.t <= maxAgeMs`, and slices the tail so at most the newest `maxPoints` points remain. Returns a new array.
6. `export function computeSmoothTrailSegments(points)`
   - Given an array of `{ x, y, t }` points (`length >= 2`), returns an array of smooth quadratic curve segment descriptors (`{ fromX, fromY, cpX, cpY, toX, toY, t }`) using midpoint interpolation between consecutive recorded points so the rendered trail has zero sharp corners or gaps.

#### Visual & Behavioral Spec:
- **Fine Pointer Only**:
  - Check `window.matchMedia('(pointer: fine)').matches`. Never enable custom cursor or trail on touch-only (`pointer: coarse`) devices.
- **Native Cursor Replacement**:
  - Add class `has-custom-cursor` to `document.documentElement` **only after** `CursorController` successfully initializes AND `settingsStore.getState().customCursor` is `true` AND `(pointer: fine)` matches.
  - When `customCursor` is toggled OFF in Settings or Terminal, immediately remove `has-custom-cursor` from `document.documentElement` and hide `.custom-cursor`.
- **Cursor Element (`.custom-cursor`)**:
  - Fixed-position overlay (`position: fixed; top: 0; left: 0; pointer-events: none; z-index: 1000000;`), moved via `transform: translate3d(${x}px, ${y}px, 0)` with `will-change: transform`.
  - Inner rotor element rotated via `transform: rotate(${angleDeg}deg) scale(${scale})`.
  - **Shape**: A **red equilateral triangle** centered at `(0, 0)` with one vertex pointing along `+X` (`0 deg`) so `rotate(atan2(dy, dx))` aims that vertex directly along the movement vector, plus a **small red dot at the exact geometric center `(0, 0)`** marking the true click hotspot.
  - Color comes from CSS variable `--cursor-color` (default `#ff2b2b`), with a crisp thin dark/white outline for high visibility over any wallpaper or window.
  - **Moving state**: Smoothly updates velocity `(vx, vy)` on `pointermove`, computes target heading via `computeHeading(vx, vy)`, and eases current angle toward target heading via `stepAngle` in `requestAnimationFrame`.
  - **Idle state (`~180ms` after last pointer movement)**: Transitions seamlessly (zero angle snap) into a continuous slow rotation (`~30 deg/s`, i.e., `~0.52 rad/s`) around its center dot. As soon as movement resumes, it eases smoothly out of the spin to the new movement heading.
  - **Interactive feedback**:
    - Hovering over interactive elements (`button, a, input, textarea, select, label, [role="button"], [role="radio"], [role="menuitem"], .os-window-titlebar, .desktop-icon`) adds `.custom-cursor--hover` (scales smoothly to `~1.18`).
    - Pressing mouse down (`pointerdown`) adds `.custom-cursor--pressed` (quick pulse scale `~0.88`).
    - Over text inputs/textarea/terminal, **keep the red triangle cursor** (do not switch to native I-beam).
  - Hide when pointer leaves the document (`document.addEventListener('mouseleave')`), show immediately on `mouseenter` / `pointermove`.
- **Continuous White Trail (`<canvas class="cursor-trail-canvas">`)**:
  - Full-viewport `<canvas>` (`position: fixed; inset: 0; pointer-events: none; z-index: 999999;`), sized to `window.innerWidth * devicePixelRatio` by `window.innerHeight * devicePixelRatio` and scaled with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` on init and window resize.
  - Draws a **continuous, thin (~1.5px–2px), pure white (`#ffffff`) smooth curve** (osu!-style, NOT dots or particles) using quadratic curves through midpoints (`computeSmoothTrailSegments`).
  - Points fade and taper smoothly over `maxAgeMs = 380` ms from the oldest tail end to the cursor hotspot so when the pointer stops, the tail shrinks smoothly into the cursor and disappears completely within ~380ms.
  - **Idle rAF Optimization**: When the trail buffer is empty (`points.length === 0`) AND the cursor does not need per-frame spin updates (e.g., cursor is hidden, disabled, or `prefers-reduced-motion` is active), **stop the `requestAnimationFrame` loop** completely and restart it on the next `pointermove`.
- **Reduced Motion**:
  - When `prefers-reduced-motion: reduce` is active: disable the idle spin (cursor stays static or points in movement direction without continuous spinning) and disable or drastically shorten (`<= 80ms`) the trail.

---

## 5. Deliverables & Done-Checklist for M3

- [ ] `src/core/crt.js` implemented and wired into `src/main.js`, `boot.js`, `startMenu.js`, `taskbar.js`, `settings.js`, and `terminal.js`.
- [ ] `#crt-monitor` shows chunky theme-styled bezel on desktop with brand plate and working Power button + LED; drops bezel automatically at `<= 768px`.
- [ ] `#crt-screen` has scanlines, RGB phosphor mask, vignette, glass reflection, optional flicker, subtle text glow, and CRT power-on / power-off animations.
- [ ] `src/core/cursor.js` exports `normalizeAngle`, `shortestAngleDelta`, `stepAngle`, `computeHeading`, `pruneTrailPoints`, and `computeSmoothTrailSegments`.
- [ ] Red equilateral triangle cursor with center hotspot dot points in movement direction, spins smoothly when idle (`~30 deg/s` after `~180ms`), scales on interactive hover/press, and stays active during window dragging and over the CRT bezel.
- [ ] Continuous white canvas trail (`~1.5px` wide, quadratic-smoothed, HiDPI-aware) fades/shrinks over `~380ms` and stops its rAF loop when idle.
- [ ] Settings toggles (`crtFrame`, `crtScanlines`, `crtVignette`, `crtFlicker`, `customCursor`, `cursorTrail`), taskbar tray CRT button, and Terminal `crt` and `cursor` commands all stay in sync and persist in `localStorage`.
- [ ] `prefers-reduced-motion` is respected across CRT, cursor, boot, windows, and skill bars.
- [ ] `npm run build` succeeds with zero errors/warnings.
- [ ] No `git` commands were run and no sub-agents were launched.

---

## 6. Required Return Report Format

```markdown
# M3 Experience — UI Agent Completion Report

## 1. Files Created / Modified
- (List every file created or modified)

## 2. CRT Monitor Frame Verification
- Bezel, inner `#crt-screen` clamping, overlays, power-on/off animations, mobile bezel drop, settings & terminal sync

## 3. Custom Cursor & Trail Verification
- Triangle cursor heading math, idle spin, center dot hotspot, continuous white canvas trail, exported pure functions, rAF cleanup, fine-pointer & reduced-motion handling

## 4. Theme, Responsive & Accessibility Polish
- Summary of 5 themes + light/dark mode + wallpapers + contrast & keyboard focus checks

## 5. Build Verification
- Result of `npm run build`
```
