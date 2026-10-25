import { test, expect } from '@playwright/test';

// Helper to skip simulated boot screen if active
async function skipBootIfPresent(page) {
  const skipBtn = page.locator('#boot-skip-btn');
  try {
    if (await skipBtn.isVisible({ timeout: 2000 })) {
      await skipBtn.click();
    }
  } catch {
    // Already skipped or completed
  }
  await expect(page.locator('#boot-screen')).toHaveCount(0, { timeout: 4000 });
}

// Helper to open an application via Start Menu
async function openAppViaStart(page, appId) {
  const win = page.locator(`.os-window[data-app-id="${appId}"]`);
  const isStartOpen = await page.locator('#os-start-menu.start-menu--open').isVisible();
  if (!isStartOpen) {
    await page.click('#taskbar-start-btn');
    await expect(page.locator('#os-start-menu.start-menu--open')).toBeVisible({ timeout: 3000 });
  }
  const item = page.locator(`.start-menu-item[data-app-id="${appId}"]`);
  await expect(item).toBeVisible({ timeout: 3000 });
  await item.click();
  await expect(win).toBeVisible({ timeout: 5000 });
  return win;
}

test.describe('DelMiiOS (AetherOS v2.4) E2E Browser Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await skipBootIfPresent(page);
  });

  test('1. Boot Skip: CRT frame renders, boot sequence skips, and About Me.txt opens automatically', async ({
    page
  }) => {
    await expect(page.locator('#crt-monitor')).toBeVisible();
    await expect(page.locator('#crt-screen')).toBeVisible();

    // Verify About Me.txt opened automatically after boot
    const aboutWin = page.locator('.os-window[data-app-id="about"]');
    await expect(aboutWin).toBeVisible({ timeout: 5000 });
    await expect(aboutWin.locator('.os-window-title')).toContainText('About Me.txt');
  });

  test('2. Open All 6 Apps & No Duplicates: opens all applications and prevents duplicate instances', async ({
    page
  }) => {
    const appIds = ['about', 'projects', 'skills', 'contact', 'terminal', 'settings'];

    for (const id of appIds) {
      await openAppViaStart(page, id);
    }

    // Verify all 6 windows are mounted
    await expect(page.locator('.os-window')).toHaveCount(6);

    // Re-open About via Start menu; verify no duplicate 7th window is created
    await openAppViaStart(page, 'about');
    await expect(page.locator('.os-window')).toHaveCount(6);

    // Verify About window is focused
    const aboutWin = page.locator('.os-window[data-app-id="about"]');
    await expect(aboutWin).toHaveClass(/os-window--focused/);
  });

  test('3. Window Controls & Drag: titlebar drag, maximize/restore, minimize/restore, and close', async ({
    page
  }) => {
    const win = page.locator('.os-window[data-app-id="about"]');
    await expect(win).toBeVisible();

    const titlebar = win.locator('.os-window-titlebar');
    const initialBox = await win.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag window titlebar
    await page.mouse.move(initialBox.x + 80, initialBox.y + 15);
    await page.mouse.down();
    await page.mouse.move(initialBox.x + 140, initialBox.y + 60, { steps: 5 });
    await page.mouse.up();

    const draggedBox = await win.boundingBox();
    expect(draggedBox.x).not.toBe(initialBox.x);

    // Maximize via button
    const maxBtn = win.locator('[data-action="maximize"]');
    await maxBtn.click();
    await expect(win).toHaveClass(/os-window--maximized/);

    // Restore via titlebar double-click
    await titlebar.dblclick();
    await expect(win).not.toHaveClass(/os-window--maximized/);

    // Minimize via button
    const minBtn = win.locator('[data-action="minimize"]');
    await minBtn.click();
    await expect(win).toHaveClass(/os-window--minimized/);

    // Restore via taskbar button
    const taskbarBtn = page.locator('.taskbar-win-btn:has-text("About")');
    await taskbarBtn.click();
    await expect(win).not.toHaveClass(/os-window--minimized/);

    // Close via close button
    const closeBtn = win.locator('[data-action="close"]');
    await closeBtn.click();
    await expect(page.locator('.os-window[data-app-id="about"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('4. Start Menu Search & Sleep / Wake: live filtering and suspension overlay', async ({
    page
  }) => {
    // Open Start menu
    await page.click('#taskbar-start-btn');
    const startMenu = page.locator('#os-start-menu.start-menu--open');
    await expect(startMenu).toBeVisible();

    // Search filter
    await page.fill('#start-search-input', 'terminal');
    const filteredItems = page.locator('#start-menu-list .start-menu-item');
    await expect(filteredItems).toHaveCount(1);
    await expect(filteredItems.first()).toHaveAttribute('data-app-id', 'terminal');

    // Trigger Sleep / Off
    await page.click('#start-sleep-btn');
    const shutdownOverlay = page.locator('#shutdown-overlay');
    await expect(shutdownOverlay).toHaveClass(/active/);

    const powerLed = page.locator('#crt-power-led');
    await expect(powerLed).toHaveClass(/crt-power-led--sleeping/);

    // Wake via clicking shutdown overlay
    await shutdownOverlay.click();
    await expect(shutdownOverlay).not.toHaveClass(/active/);
    await expect(powerLed).not.toHaveClass(/crt-power-led--sleeping/);
  });

  test('5. Theme & Settings Persistence After Reload: theme, CRT, and cursor persist', async ({
    page
  }) => {
    await openAppViaStart(page, 'settings');
    const settingsWin = page.locator('.os-window[data-app-id="settings"]');
    await expect(settingsWin).toBeVisible();

    // Select Matrix Green theme preset
    await page.click('.theme-preset-card[data-theme-id="matrix"]');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'matrix');

    // Toggle CRT flicker setting
    await page.click('label[for="toggle-crt-flicker"]');

    // Verify localStorage has persisted matrix theme
    const storedBefore = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('delmiios_settings_v1') || '{}');
    });
    expect(storedBefore.theme).toBe('matrix');
    expect(storedBefore.crtFlicker).toBe(true);

    // Reload page
    await page.reload();
    await skipBootIfPresent(page);

    // Verify matrix theme persisted after reload
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'matrix');

    const storedAfter = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('delmiios_settings_v1') || '{}');
    });
    expect(storedAfter.theme).toBe('matrix');
    expect(storedAfter.crtFlicker).toBe(true);
  });

  test('6. Contact Quick Message Composer: fields validation, email copy, and mailto submit', async ({
    page
  }) => {
    await openAppViaStart(page, 'contact');
    const contactWin = page.locator('.os-window[data-app-id="contact"]');
    await expect(contactWin).toBeVisible();

    // Fill message composer
    await page.fill('#compose-subject', 'Inquiry for DelMiiOS Project');
    await page.fill('#compose-body', 'Hello! This is an automated browser smoke test message.');

    // Test Copy Email button
    await page.click('#copy-email-btn');
    await expect(page.locator('#copy-btn-text')).toContainText('Copied');

    // Submit form and verify mailto confirmation status message
    await page.click('#compose-submit-btn');
    const statusMsg = page.locator('#compose-status');
    await expect(statusMsg).toHaveClass(/compose-status--success/);
    await expect(statusMsg).toContainText('Mail draft prepared');
  });

  test('7. Cross-App Navigation with Payloads: Projects -> Contact and Skills -> Projects', async ({
    page
  }) => {
    // 1. Projects -> Contact: "Discuss this project" pre-fills subject in Contact
    await openAppViaStart(page, 'projects');
    const projectsWin = page.locator('.os-window[data-app-id="projects"]');
    await expect(projectsWin).toBeVisible();

    // Click "Discuss this project" in the detail pane
    const discussBtn = projectsWin.locator('.detail-actions [data-discuss-project]');
    await expect(discussBtn).toBeVisible();
    await discussBtn.click();

    // Contact should be opened and focused with subject pre-filled
    const contactWin = page.locator('.os-window[data-app-id="contact"]');
    await expect(contactWin).toBeVisible();
    await expect(contactWin).toHaveClass(/os-window--focused/);

    const subjectInput = contactWin.locator('#compose-subject');
    await expect(subjectInput).toHaveValue(/^Project Inquiry:/);

    // 2. Skills -> Projects: click a skill filter chip navigates to Projects filtered by that tag
    await openAppViaStart(page, 'skills');
    const skillsWin = page.locator('.os-window[data-app-id="skills"]');
    await expect(skillsWin).toBeVisible();

    // Click TypeScript module chip or skill row
    const tsFilterBtn = skillsWin.locator('[data-skill-filter="TypeScript"]').first();
    await expect(tsFilterBtn).toBeVisible();
    await tsFilterBtn.dispatchEvent('click');

    // Projects should be focused and filtered
    await expect(projectsWin).toBeVisible();
    await expect(projectsWin).toHaveClass(/os-window--focused/);

    const activeFilterPill = projectsWin.locator('#explorer-active-filter');
    await expect(activeFilterPill).toContainText('TypeScript');
  });

  test('8. Terminal Commands & Autocomplete: help, ls, cat, theme, crt, cursor, and Tab autocomplete', async ({
    page
  }) => {
    await openAppViaStart(page, 'terminal');
    const termWin = page.locator('.os-window[data-app-id="terminal"]');
    await expect(termWin).toBeVisible();

    const input = termWin.locator('#terminal-input');
    const output = termWin.locator('#terminal-output');

    // 1. help
    await input.fill('help');
    await page.keyboard.press('Enter');
    await expect(output).toContainText('DelMiiOS Shell Commands:');

    // 2. ls
    await input.fill('ls');
    await page.keyboard.press('Enter');
    await expect(output).toContainText('About_Me.txt');

    // 3. cat About_Me.txt
    await input.fill('cat About_Me.txt');
    await page.keyboard.press('Enter');
    await expect(output).toContainText('Summary:');

    // 4. theme retro-teal
    await input.fill('theme retro-teal');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'retro-teal');

    // 5. crt off
    await input.fill('crt off');
    await page.keyboard.press('Enter');
    await expect(page.locator('#crt-screen')).not.toHaveClass(/crt-screen--scanlines/);

    // 6. cursor off
    await input.fill('cursor off');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).not.toHaveClass(/has-custom-cursor/);

    // 7. Tab autocomplete on "open pr" -> "open projects"
    await input.fill('open pr');
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('open projects');
  });

  test('9. Mobile Viewport (390x844): CRT bezel drops and open windows auto-maximize', async ({
    page
  }) => {
    // Open About and Projects windows first on desktop
    await openAppViaStart(page, 'about');
    await openAppViaStart(page, 'projects');

    // Switch to mobile portrait viewport (iPhone 12/13/14 equivalent: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);

    // Outer CRT bezel chin must drop (hidden)
    await expect(page.locator('.crt-bezel-chin')).toBeHidden();

    // Windows should be auto-maximized to full screen
    const openWins = page.locator('.os-window');
    const count = await openWins.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const win = openWins.nth(i);
      await expect(win).toHaveClass(/os-window--maximized/);
    }
  });
});
