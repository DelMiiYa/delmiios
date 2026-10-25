# UI Agent Handoff Prompts — Overview & Dispatch Map

The UI Agent work is split into **4 self-contained milestone prompt files** so each milestone can be built, verified (`npm run build`), reviewed by the Review Agent, and committed cleanly before advancing:

1. **Milestone 1 (M1 Core)**: [`.agents/ui-agent-m1.md`](./ui-agent-m1.md)
   - Scope: `index.html`, `public/favicon.svg`, `src/data/profile.js`, `src/core/{icons,settings,sound,windowManager,boot,desktop,taskbar,startMenu}.js`, `src/main.js` (core bootstrap + `#crt-monitor > #crt-screen` shell), and core styles in `src/style.css`.
2. **Milestone 2 (M2 Apps & Cross-App Navigation)**: [`.agents/ui-agent-m2.md`](./ui-agent-m2.md)
   - Scope: `src/apps/{about,projects,skills,contact,terminal,settings}.js`, registering all 6 apps in `src/main.js`, cross-app payload navigation (`ctx.openApp(id, payload)`), and app styles in `src/style.css`.
3. **Milestone 3 (M3 Experience: CRT Monitor Frame, Custom Cursor & Trail, Themes, Responsive & A11y)**: [`.agents/ui-agent-m3.md`](./ui-agent-m3.md)
   - Scope: `src/core/crt.js`, `src/core/cursor.js` (including exported pure math functions), wiring into `src/main.js` and core/apps, and complete CRT bezel/animations, custom cursor, 5 themes + light/dark mode + 5 wallpapers, responsive `<= 768px`, and `prefers-reduced-motion` styles in `src/style.css`.
4. **Milestone 4 (M4 Hardening: README & Final Polish)**: [`.agents/ui-agent-m4.md`](./ui-agent-m4.md)
   - Scope: `README.md` and any final polish before release.

Always dispatch the milestone-specific file (`ui-agent-m1.md`, `ui-agent-m2.md`, `ui-agent-m3.md`, `ui-agent-m4.md`) as instructed by the Project Orchestrator.
