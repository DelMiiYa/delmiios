# Handoff Prompt: UI Agent — Fix Start Menu Visibility & Hollow Red-Outline Triangle Cursor

> **Role**: You are the **UI Agent** for **DelMiiOS (AetherOS v2.4 — Combined Edition)** in `D:\delmiios`.
> You have **no memory of prior conversations**. Everything you need is in this file.

---

## 1. Hard Rules & File Ownership

1. **Files You May Edit**:
   - `D:\delmiios\src\style.css`
   - `D:\delmiios\src\core\startMenu.js` *(if needed for clean open/close state)*
   - `D:\delmiios\src\core\cursor.js` *(if needed for SVG attributes)*
2. **No Sub-Agents & No Git Commands**: Do **NOT** launch sub-agents and do **NOT** run `git commit` or `git push`.

---

## 2. Tasks to Implement

### Task 1: Fix Start Menu Stuck Open / Not Closing (`src/style.css` & `src/core/startMenu.js`)
- **Root Cause**:
  - In `src/core/startMenu.js`, `#os-start-menu` uses `menu.hidden = true` when closed and toggles `.start-menu--open` when open.
  - However, in `src/style.css` (around line 996), `.start-menu` declares `display: flex;`, which overrides the browser's user-agent `[hidden] { display: none; }` stylesheet rule. As a result, `#os-start-menu` remains visible (`display: flex`) even when `hidden` is `true` or `close()` is called.
- **Required Fix**:
  1. In `src/style.css`:
     - Add a global utility rule near the reset section:
       ```css
       [hidden] {
         display: none !important;
       }
       ```
     - Change `.start-menu` (around line 996) from `display: flex;` to `display: none;`, and add:
       ```css
       .start-menu.start-menu--open {
         display: flex;
       }
       ```
  2. Verify in `src/core/startMenu.js` that:
     - Initial state has `menu.hidden = true` and does **not** have `.start-menu--open`.
     - Clicking the Start button (`#taskbar-start-btn`) toggles the menu open and closed cleanly (`startMenu.toggle()`).
     - Note on event ordering: `StartMenu` listens to `pointerdown` on `document` (`outsidePointerHandler`), while `#taskbar-start-btn` listens to `click`. Ensure clicking outside `#os-start-menu` and outside `#taskbar-start-btn` closes the menu immediately, clicking an app item inside the Start menu launches the app and closes the menu, and clicking `#taskbar-start-btn` when open closes it.

### Task 2: Make the Custom Triangle Cursor Unfilled with a Red Outline (`src/style.css` & `src/core/cursor.js`)
- **Current Behavior**:
  - In `src/style.css` (lines 2990–2995), `.cursor-triangle` is filled solid red (`fill: var(--cursor-color, #ff2b2b);`) with a thin white stroke (`stroke: #ffffff;`).
- **Required Change**:
  - Update `.cursor-triangle` in `src/style.css` (and `src/core/cursor.js` if needed) so that the equilateral triangle is **hollow / not filled** and has a **red outline**:
    ```css
    .cursor-triangle {
      fill: none;
      stroke: var(--cursor-color, #ff2b2b);
      stroke-width: 2px;
      stroke-linejoin: round;
    }
    ```
  - Keep the center hotspot dot (`.cursor-dot`) clearly visible at `(0, 0)` (e.g., `fill: var(--cursor-color, #ff2b2b);` or `#ffffff` with subtle contrast shadow so the exact click point remains crisp inside the hollow red triangle).

---

## 3. Verification Checklist

Run both commands in `D:\delmiios` before finishing:
1. `npm run build` — must succeed with zero errors and zero warnings.
2. `npm run test:unit` — all 71 unit tests must pass.
