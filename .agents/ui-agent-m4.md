# Handoff Prompt: UI Agent — Milestone 4 (M4 Hardening: README & Final Polish)

> **Role**: You are the **UI & Documentation Agent** for **Milestone 4 (M4 Hardening)** of the **DelMiiOS (AetherOS v2.4 — Combined Edition)** project in `D:\delmiios`.
> You have **no memory of prior conversations**. Read `D:\delmiios\.agents\plan.md` and inspect the project in `D:\delmiios\` before writing.

---

## 1. Hard Rules & Constraints

1. **No Sub-Agents**: Never launch, invoke, or spawn any sub-agents or delegation tools.
2. **No Git Commands**: Never run any `git` commands. The Project Orchestrator owns all git operations.
3. **Strict File Ownership**: You own `D:\delmiios\README.md` (and may only touch `src/**` if instructed to fix specific review/test findings). Do not touch `tests/**` or `.agents/**`.
4. **All English**: All documentation, code, and examples must be in clear, professional English.

---

## 2. Goal & Required Sections for `D:\delmiios\README.md`

Write a comprehensive, developer-friendly `README.md` at `D:\delmiios\README.md` covering:

1. **Project Overview**:
   - What DelMiiOS (AetherOS v2.4 — Combined Edition) is: a simulated retro-modern CRT desktop PC personal portfolio built with vanilla JavaScript + Vite and zero runtime dependencies.
   - Repository URL: `https://github.com/DelMiiYa/delmiios.git`
2. **Key Features**:
   - Branded AetherOS boot sequence (skip via click/Space/Enter/button) + Restart & Sleep/Wake power states.
   - Registry-driven Window Manager (pointer-capture drag for mouse & touch, minimize, maximize/restore, z-index focus, cascading coordinates clamped to inner `#crt-screen`, auto-maximize on `<= 768px`).
   - **CRT Monitor Frame**: Theme-aware desktop bezel, recessed curved screen, scanlines + RGB phosphor mask, vignette + glass reflection, power-on/off collapse/expand animations, tray quick-toggle, Settings toggles, and `crt` terminal command.
   - **Custom Triangle Cursor & Continuous White Trail**: Red equilateral triangle with center hotspot dot, velocity heading rotation, continuous idle spin, and HiDPI `<canvas>` smooth white fading line trail (`cursor` terminal command & Settings toggles).
   - **6 Built-in Applications & Cross-App Navigation**:
     - `About Me.txt` (bio, quick facts, experience, links to Projects & Contact)
     - `Projects` (file explorer with category folders, tech-tag filter from Skills, detail view, and "Discuss this project" -> pre-fills Contact composer)
     - `Skills` (system monitor with animated bars and clickable skill/module tags that filter Projects)
     - `Contact` (Quick Message Composer -> `mailto:`, Send Email, Copy Email with clipboard feedback, social cards, link to About)
     - `Terminal` (14 commands, ArrowUp/Down history, Tab autocomplete, quick-command chips)
     - `Settings` (5 themes, dark/light mode, 5 wallpapers, 5 accents, sound FX, CRT toggles, cursor toggles, Reset to Defaults — persisted in `localStorage`)
3. **Quick Start & Commands**:
   - `npm install`
   - `npm run dev`
   - `npm run build`
   - `npm run preview`
   - `npm test` / `npm run test:unit` / `npm run test:e2e`
4. **How to Customize Personal Content**:
   - Explain how to edit `src/data/profile.js` (`TODO` markers for name, role, bio, projects, skills, contact links, and default system settings).
5. **How to Add a New Application (Registry Pattern)**:
   - Step-by-step code example showing:
     1. Creating `src/apps/myNewApp.js` exporting an app definition object (`{ id, title, shortTitle, desktopLabel, description, icon, defaultWidth, defaultHeight, render(container, ctx) }`).
     2. Registering it in `src/main.js` with a single `windowManager.registerApp(myNewApp)` line (automatically adds it to the Desktop, Start Menu, Taskbar, and Terminal `open`).
6. **How to Add a New Theme**:
   - Step-by-step guide showing how to add a theme entry in `src/data/profile.js` (`appearance.themes`) and `src/core/settings.js` (`VALID_THEMES`), and define `body[data-theme="your-theme"]` CSS variables in `src/style.css`.
7. **Deployment Notes (GitHub Pages / Static Hosting)**:
   - Note that `vite.config.js` uses `base: './'` (works out of the box on GitHub Pages under `/delmiios/` or custom domains; or set `base: '/delmiios/'` if needed).

---

## 3. Done-Checklist for M4

- [ ] `D:\delmiios\README.md` is complete, accurate, and formatted in clean GitHub-flavored Markdown.
- [ ] `npm run build` succeeds with zero errors/warnings.
- [ ] No `git` commands were run and no sub-agents were launched.

---

## 4. Required Return Report Format

```markdown
# M4 Hardening (README & Polish) — UI Agent Completion Report

## 1. Files Created / Modified
- `README.md` (and any other files touched)

## 2. Documentation & Build Verification
- Summary of README sections
- Result of `npm run build`
```
