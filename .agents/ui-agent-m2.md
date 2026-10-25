# Handoff Prompt: UI Agent — Milestone 2 (M2 Apps & Cross-App Navigation)

> **Role**: You are the **UI & Applications Agent** for **Milestone 2 (M2 Apps)** of the **DelMiiOS (AetherOS v2.4 — Combined Edition)** project in `D:\delmiios`.
> You have **no memory of prior conversations**. Read `D:\delmiios\.agents\plan.md` and the existing M1 files in `D:\delmiios\src\` before writing code.

---

## 1. Hard Rules & Constraints

1. **No Sub-Agents**: Never launch, invoke, or spawn any sub-agents or delegation tools.
2. **No Git Commands**: Never run any `git` commands. The Project Orchestrator owns all git operations.
3. **Strict File Ownership**: Create/update **only** `src/apps/{about,projects,skills,contact,terminal,settings}.js`, `src/main.js` (to register the 6 apps and open `about` after boot), and `src/style.css` (app-specific CSS). Do not break any M1 contracts in `.agents/plan.md`.
4. **Zero Runtime Dependencies**: Vanilla JavaScript ES Modules and CSS only.
5. **All English**: All code, comments, identifiers, and UI content must be in English.
6. **XSS Prevention**: Never pass unescaped user input (especially in `terminal.js` or search/filter inputs) into `innerHTML`. Use `escapeHtml(str)` or `textContent`.
7. **No Static Inline Styles**: Use CSS classes and custom properties in `src/style.css` instead of inline `style="..."` attributes (except dynamic values like `--swatch-color` or skill bar widths).

---

## 2. Project Context & Goal for Milestone 2

In Milestone 1, the core OS shell (`windowManager.js`, `settings.js`, `sound.js`, `boot.js`, `desktop.js`, `taskbar.js`, `startMenu.js`, `icons.js`, `profile.js`) was built.
In **Milestone 2**, you will implement all **6 Desktop Applications** using the `WindowManager.registerApp(appDef)` registry pattern, wire them into `src/main.js`, style them in `src/style.css`, and implement **full Cross-App Navigation with payload support** (`ctx.openApp(id, payload)`), working both when the target app is closed and when it is already open.

You may inspect the reference prototypes in `e:\webosproj\featurefulweb\src\apps\` and `e:\webosproj\goodlookingweb\src\apps\` (also in `D:\delmiios\featurefulweb` and `D:\delmiios\goodlookingweb`), merging the best of both into `D:\delmiios\src\apps\`.

---

## 3. Exact File Ownership for Milestone 2

1. `D:\delmiios\src\apps\about.js` — **About Me.txt** app (`aboutApp`)
2. `D:\delmiios\src\apps\projects.js` — **Projects** File Explorer & Detail Pane app (`projectsApp`)
3. `D:\delmiios\src\apps\skills.js` — **Skills** System Monitor / Task Manager app (`skillsApp`)
4. `D:\delmiios\src\apps\contact.js` — **Contact** Address Book & Quick Message Composer app (`contactApp`)
5. `D:\delmiios\src\apps\terminal.js` — **Terminal** interactive shell (`terminalApp`) + exported pure helpers (`escapeHtml`, `parseCommandInput`, `getAutocompleteSuggestions`)
6. `D:\delmiios\src\apps\settings.js` — **Settings** Personalization & Control Panel app (`settingsApp`)
7. `D:\delmiios\src\main.js` — Register `[aboutApp, projectsApp, skillsApp, contactApp, terminalApp, settingsApp]` with `windowManager.registerApp(app)` and launch `windowManager.openApp('about')` when boot completes.
8. `D:\delmiios\src\style.css` — Add/refine styles for all 6 applications, ensuring theme-variable compliance and responsive behavior at `<= 768px`.

---

## 4. Detailed App Specifications & Cross-App Navigation Contracts

### 4.1 Cross-App Navigation Matrix (REQUIRED)
Every app's `render(container, ctx)` receives `{ windowManager, openApp, close, payload }` and returns `{ cleanup?(), onFocus?(), onPayload?(payload) }`.
- **About -> Projects**: "Explore Projects" button (`data-open-app="projects"`) calls `ctx.openApp('projects')`.
- **About -> Contact**: "Contact Me" button (`data-open-app="contact"`) calls `ctx.openApp('contact')`.
- **Projects -> Contact ("Discuss this project")**: Every project card and detail view has a **"Discuss this project"** button (`data-discuss-project="${proj.title}"`) that calls:
  ```js
  ctx.openApp('contact', { subject: `Project Inquiry: ${proj.title}` });
  ```
  When Contact opens (or if Contact is **already open** in the background/minimized), `contactApp`'s `onPayload({ subject })` pre-fills `#compose-subject` with that subject, scrolls the Quick Message Composer into view, and focuses `#compose-body`.
- **Skills -> Projects (Filter by Tech Tag)**: Every skill row and module chip in `skillsApp` is interactive (`button` or clickable row with `data-skill-filter="${skill.filterTag || skill.name}"`). Clicking a skill calls:
  ```js
  ctx.openApp('projects', { filterTag: skill.filterTag || skill.name });
  ```
  When Projects opens (or if Projects is **already open**), `projectsApp`'s `onPayload({ filterTag })` filters the project list to projects matching that technology tag (or shows matching projects with a clear active filter bar: `Filtered by skill: <filterTag>` + a `Clear Filter` button to return to `All`).
- **Contact -> About**: Contact header card includes a **"View About Me.txt"** button (`data-open-app="about"`) that calls `ctx.openApp('about')`.
- **Terminal -> Any App**: `open <app>` command calls `ctx.openApp(appId)`.

---

### 4.2 App 1: `src/apps/about.js` (`aboutApp`)
- `id: 'about'`, `title: 'About Me.txt — Notepad'`, `shortTitle: 'About Me.txt'`, `desktopLabel: 'About Me.txt'`, `description: 'Personal biography, experience & interests'`, `icon: icons.about`, `defaultWidth: 660`, `defaultHeight: 500`.
- Features:
  - Notepad status toolbar (`File: About Me.txt`, `Encoding: UTF-8`, `Modified: ...`).
  - Hero card with avatar initials derived from `getAvatarInitials(profile.name)` (`TODO: Photo` caption), availability status pill with pulsing green dot, `profile.name`, `profile.role`, `profile.location`.
  - Quick Facts grid (`profile.about.quickFacts`).
  - Biography paragraphs (`profile.about.summary`).
  - Experience timeline (`profile.about.experience` if present).
  - Interests & Focus Areas tags (`profile.about.interests`).
  - Action bar with **Explore Projects** (`data-open-app="projects"`) and **Contact Me** (`data-open-app="contact"`).

### 4.3 App 2: `src/apps/projects.js` (`projectsApp`)
- `id: 'projects'`, `title: 'Projects — File Explorer'`, `shortTitle: 'Projects'`, `desktopLabel: 'Projects'`, `description: 'File-explorer directory of featured projects'`, `icon: icons.projects`, `defaultWidth: 760`, `defaultHeight: 520`.
- Features:
  - Explorer path bar (`/home/${profile.username}/projects`), active filter pill (when `activeTechFilter` is set from Skills, displays `Filtered by tag: <tag>` + `Clear Filter` button), and item count badge.
  - Sidebar with Category folders (`All`, plus unique `proj.category` values).
  - Main area with **Project List + Detail Pane** (clicking a project card selects it in the detail pane or expands its details, and each project displays: title, status badge, date, description, clickable tech tags that also filter by tag, **Live Demo** link, **Source Code** link, and **"Discuss this project"** button that calls `ctx.openApp('contact', { subject: 'Project Inquiry: ' + proj.title })`).
  - Implements `onPayload(payload)`:
    - If `payload?.filterTag`: sets `activeTechFilter = payload.filterTag`, `activeCategory = 'All'`, re-renders folders and project list (matching `proj.tech` or `proj.title` or `proj.description` case-insensitively; if no exact tech match, falls back gracefully with a clear message and "Show All Projects" button).
    - If `payload?.projectId`: selects that project in the detail pane.

### 4.4 App 3: `src/apps/skills.js` (`skillsApp`)
- `id: 'skills'`, `title: 'Skills — System Monitor'`, `shortTitle: 'Skills'`, `desktopLabel: 'Skills'`, `description: 'System capabilities, stack proficiencies & meters'`, `icon: icons.skills`, `defaultWidth: 700`, `defaultHeight: 510`.
- Features:
  - System Specifications banner (`OS VERSION`, `ENGINE`, `STATUS`, `MEMORY` from `profile.skills.systemSpecs`).
  - Hint banner: `"Tip: Click any skill or module tag below to view matching projects in File Explorer."`
  - Categorized skill cards with animated proficiency progress bars (`role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="${skill.level}"`).
  - Each skill item and each additional capability chip (`profile.skills.additionalTags`) is a keyboard-accessible button with `data-skill-filter="${skill.filterTag || skill.name}"` that calls `ctx.openApp('projects', { filterTag })`.

### 4.5 App 4: `src/apps/contact.js` (`contactApp`) — FAVORITE CENTERPIECE
- `id: 'contact'`, `title: 'Contact — Address Book & Mail'`, `shortTitle: 'Contact'`, `desktopLabel: 'Contact'`, `description: 'Quick message composer, email & social directory'`, `icon: icons.contact`, `defaultWidth: 660`, `defaultHeight: 510`.
- Features:
  - Header card with `Get in Touch with ${profile.name}`, `availabilityNote`, and quick action buttons:
    - **Send Email** (`href="mailto:${email}"`)
    - **Copy Email (${email})** (`#copy-email-btn` with `aria-live="polite"`, copies `email` via `navigator.clipboard.writeText(email)` with fallback, shows `"✓ Copied to Clipboard!"` for 2s)
    - **View About Me.txt** (`data-open-app="about"`, calls `ctx.openApp('about')`)
  - Social Directory grid (`profile.contact.socials` cards with external icon).
  - **Quick Message Composer (Centerpiece)**:
    - `<form id="contact-compose-form" class="contact-compose-box">`
    - Subject input (`#compose-subject`, `required`)
    - Message textarea (`#compose-body`, `required`)
    - Submit button (`Launch Mail Client`) + status feedback (`#compose-status`, `aria-live="polite"`).
    - On submit: prevents default, encodes `subject` and `body` with `encodeURIComponent`, triggers `mailto:${email}?subject=${subject}&body=${body}`, and displays confirmation message.
  - Implements `onPayload(payload)`:
    - When `payload?.subject` is provided (both on initial `render` via `ctx.payload` and on subsequent calls via `onPayload`), sets `subjectInput.value = payload.subject`, highlights/scrolls to the composer form, and focuses `bodyInput`.

### 4.6 App 5: `src/apps/terminal.js` (`terminalApp`)
- `id: 'terminal'`, `title: 'Terminal — ' + profile.username + '@' + profile.hostname`, `shortTitle: 'Terminal'`, `desktopLabel: 'Terminal'`, `description: 'Interactive command-line shell with autocomplete'`, `icon: icons.terminal`, `defaultWidth: 690`, `defaultHeight: 460`.
- **Exported Pure Helpers (REQUIRED for Test Agent)**:
  1. `export function escapeHtml(str)` — escapes `&`, `<`, `>`, `"`, `'` safely without DOM dependency so it works in both Node/Vitest and browser.
  2. `export function parseCommandInput(raw)` — trims `raw`, returns `{ raw, trimmed, cmd, args, argString }` where `cmd` is lowercase first token and `args` is array of remaining tokens.
  3. `export function getAutocompleteSuggestions(rawInput, context)` — given current input string and `{ commands, appIds, themeIds, fileNames }`, returns array of matching completions:
     - If typing first token (no space yet): matches command names starting with token (`help`, `about`, `projects`, `skills`, `contact`, `whoami`, `date`, `ls`, `cat`, `open`, `theme`, `sound`, `crt`, `cursor`, `clear`, `exit`).
     - If `cmd === 'open'`: matches `appIds` (`about`, `projects`, `skills`, `contact`, `terminal`, `settings`) and returns full completed command `"open <match>"`.
     - If `cmd === 'theme'`: matches `themeIds` (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`, `dark`, `light`) and returns `"theme <match>"`.
     - If `cmd === 'cat'`: matches `fileNames` (case-insensitive) and returns `"cat <match>"`.
     - If `cmd === 'sound'`: matches `['on', 'off']`.
     - If `cmd === 'crt'`: matches `['on', 'off', 'frame', 'scanlines', 'vignette', 'flicker']`.
     - If `cmd === 'cursor'`: matches `['on', 'off', 'trail on', 'trail off']`.
- **Supported Commands**:
  - `help`, `about`, `projects`, `skills`, `contact`, `whoami`, `date`, `ls`, `cat <file>`, `open <app>`, `theme [name]`, `sound [on|off]`, `crt [on|off|frame|scanlines|vignette|flicker]`, `cursor [on|off|trail on|trail off]`, `clear`, `exit`.
- **Interactive Features**:
  - Quick-command button bar (`help`, `about`, `projects`, `skills`, `contact`, `ls`, `theme`, `crt`, `clear`).
  - `ArrowUp` / `ArrowDown` command history navigation.
  - `Tab` key autocomplete using `getAutocompleteSuggestions`: if 1 match, replaces input value with the match; if multiple matches, completes common prefix and prints possible completions to terminal output.
  - Keystroke sound (`sound.playKey()`) on typing.
  - Strict HTML escaping on echoed commands and arguments (`escapeHtml`).

### 4.7 App 6: `src/apps/settings.js` (`settingsApp`)
- `id: 'settings'`, `title: 'Settings — Personalization & System'`, `shortTitle: 'Settings'`, `desktopLabel: 'Settings'`, `description: 'Themes, wallpapers, accent colors, audio, CRT & cursor'`, `icon: icons.settings`, `defaultWidth: 650`, `defaultHeight: 540`.
- Sections (all synced live with `settingsStore.subscribe`, proper `role="radiogroup"` / `role="radio"` / `aria-checked` or `role="switch"` semantics):
  1. **Visual Theme Preset** (`role="radiogroup"`): 5 theme cards (`cyber-dark`, `retro-teal`, `sunset-dusk`, `matrix`, `clean-slate`) with color preview and description.
  2. **Appearance Mode** (`role="radiogroup"`): Dark Mode (`dark`) / Light Mode (`light`) cards.
  3. **Desktop Wallpaper** (`role="radiogroup"`): 5 wallpaper preview cards (`aurora`, `sunset`, `blueprint`, `emerald`, `minimal`).
  4. **System Accent Color** (`role="radiogroup"`): 5 accent color swatches (`#38bdf8`, `#a78bfa`, `#34d399`, `#fbbf24`, `#fb7185`).
  5. **Audio & Sound FX**: Toggle button/switch for `soundEnabled` (`System Sound Effects`).
  6. **CRT Monitor Frame & Effects**: Individual toggles for:
     - `CRT Monitor Frame (Bezel)` (`crtFrame`)
     - `Scanlines & Phosphor Mask` (`crtScanlines`)
     - `Screen Curvature & Vignette` (`crtVignette`)
     - `CRT Flicker & Scan Band` (`crtFlicker`)
  7. **Custom Cursor & Trail**: Individual toggles for:
     - `Custom Red Triangle Cursor` (`customCursor`)
     - `Continuous White Cursor Trail` (`cursorTrail`)
  8. **Footer**: Persistence note + **Reset to Defaults** button (`#settings-reset-btn` calling `settingsStore.resetDefaults()`).
- Returns `{ cleanup() { unsubscribe(); } }` so closing the Settings window removes the store listener.

---

## 5. Deliverables & Done-Checklist for M2

- [ ] All 6 app files created in `src/apps/` and registered in `src/main.js`.
- [ ] Boot sequence opens `about` automatically upon completion.
- [ ] All cross-app links work (About -> Projects/Contact, Projects -> Contact with prefilled subject, Skills -> Projects filter by tag, Contact -> About, Terminal `open <app>`), **including when the target window is already open**.
- [ ] Contact Quick Message Composer launches `mailto:` with URL-encoded subject/body, and Copy Email copies to clipboard with `aria-live` feedback.
- [ ] Terminal implements all 14 commands (`help`, `about`, `projects`, `skills`, `contact`, `whoami`, `date`, `ls`, `cat`, `open`, `theme`, `sound`, `crt`, `cursor`, `clear`, `exit`), ArrowUp/Down history, Tab autocomplete, quick-command bar, and exports `escapeHtml`, `parseCommandInput`, `getAutocompleteSuggestions`.
- [ ] Settings app controls 5 themes, dark/light mode, 5 wallpapers, 5 accents, sound, 4 CRT toggles, 2 cursor toggles, and Reset to Defaults, with `aria-checked` and live sync across Settings, Terminal, and Taskbar tray.
- [ ] `npm run build` passes with zero errors/warnings.
- [ ] No `git` commands were run and no sub-agents were launched.

---

## 6. Required Return Report Format

```markdown
# M2 Apps — UI Agent Completion Report

## 1. Files Created / Modified
- (List every file created or modified)

## 2. Feature & Cross-App Navigation Verification
- About / Projects / Skills / Contact / Terminal / Settings summary
- Cross-app payload flows verified (closed & already-open states)
- Exported pure helpers in `src/apps/terminal.js` confirmed

## 3. Build Verification
- Result of `npm run build`

## 4. Notes for Orchestrator
- (Any notes for M3)
```
