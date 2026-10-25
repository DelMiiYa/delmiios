import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  parseCommandInput,
  getAutocompleteSuggestions
} from '../../src/apps/terminal.js';
import { profile, getVirtualFiles } from '../../src/data/profile.js';

describe('Terminal Shell Engine (src/apps/terminal.js)', () => {
  describe('escapeHtml(str)', () => {
    it('escapes dangerous XSS scripts, tags, quotes, and ampersands', () => {
      const malicious = '<script>alert("xss")</script>&\'hello\'';
      const escaped = escapeHtml(malicious);
      expect(escaped).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&#039;hello&#039;'
      );
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
      expect(escaped).not.toContain("'");
    });

    it('handles null and undefined safely without throwing', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    it('converts non-string values to string', () => {
      expect(escapeHtml(12345)).toBe('12345');
      expect(escapeHtml(true)).toBe('true');
    });
  });

  describe('parseCommandInput(raw)', () => {
    it('extracts command and arguments across extra whitespace variations', () => {
      const parsed = parseCommandInput('   open   projects   --filter=ts   ');
      expect(parsed.cmd).toBe('open');
      expect(parsed.args).toEqual(['projects', '--filter=ts']);
      expect(parsed.trimmed).toBe('open   projects   --filter=ts');
      expect(parsed.argString).toBe('projects   --filter=ts');
    });

    it('normalizes command name to lowercase', () => {
      const parsed = parseCommandInput('THEME MATRIX');
      expect(parsed.cmd).toBe('theme');
      expect(parsed.args).toEqual(['MATRIX']);
    });

    it('handles empty or whitespace-only input safely', () => {
      expect(parseCommandInput('')).toEqual({
        raw: '',
        trimmed: '',
        cmd: '',
        args: [],
        argString: ''
      });
      expect(parseCommandInput('     ')).toEqual({
        raw: '     ',
        trimmed: '',
        cmd: '',
        args: [],
        argString: ''
      });
      expect(parseCommandInput(null)).toEqual({
        raw: '',
        trimmed: '',
        cmd: '',
        args: [],
        argString: ''
      });
    });
  });

  describe('getAutocompleteSuggestions(rawInput, context)', () => {
    it('completes partial command names', () => {
      const prMatch = getAutocompleteSuggestions('pr');
      expect(prMatch).toContain('projects');

      const thMatch = getAutocompleteSuggestions('th');
      expect(thMatch).toContain('theme');

      const clMatch = getAutocompleteSuggestions('cl');
      expect(clMatch).toContain('clear');

      const whoMatch = getAutocompleteSuggestions('who');
      expect(whoMatch).toEqual(['whoami']);
    });

    it('completes "open <app>" with registered application IDs', () => {
      const match = getAutocompleteSuggestions('open pr');
      expect(match).toEqual(['open projects']);

      const multiMatch = getAutocompleteSuggestions('open s');
      expect(multiMatch).toEqual(['open skills', 'open settings']);
    });

    it('completes "theme <name>" with available visual themes and modes', () => {
      const match = getAutocompleteSuggestions('theme ma');
      expect(match).toEqual(['theme matrix']);

      const retroMatch = getAutocompleteSuggestions('theme ret');
      expect(retroMatch).toEqual(['theme retro-teal']);

      const modeMatch = getAutocompleteSuggestions('theme li');
      expect(modeMatch).toEqual(['theme light']);
    });

    it('completes "cat <file>" against virtual system files', () => {
      const virtualFiles = getVirtualFiles(profile);
      const fileNames = Object.keys(virtualFiles);

      const match = getAutocompleteSuggestions('cat Ab');
      expect(match).toEqual(['cat About_Me.txt']);

      const sysMatch = getAutocompleteSuggestions('cat sys');
      expect(sysMatch).toEqual(['cat system.cfg']);

      // Case-insensitive matching
      const lowerMatch = getAutocompleteSuggestions('cat ab');
      expect(lowerMatch).toEqual(['cat About_Me.txt']);
    });

    it('completes "crt" subcommands', () => {
      const crtAll = getAutocompleteSuggestions('crt ');
      expect(crtAll).toEqual([
        'crt on',
        'crt off',
        'crt frame',
        'crt scanlines',
        'crt vignette',
        'crt flicker'
      ]);

      const crtSc = getAutocompleteSuggestions('crt sc');
      expect(crtSc).toEqual(['crt scanlines']);
    });

    it('completes "cursor" subcommands', () => {
      const cursorAll = getAutocompleteSuggestions('cursor ');
      expect(cursorAll).toEqual([
        'cursor on',
        'cursor off',
        'cursor trail on',
        'cursor trail off'
      ]);

      const cursorTr = getAutocompleteSuggestions('cursor tr');
      expect(cursorTr).toEqual(['cursor trail on', 'cursor trail off']);
    });

    it('preserves leading indentation during autocompletion', () => {
      const indented = getAutocompleteSuggestions('   open pr');
      expect(indented).toEqual(['   open projects']);
    });

    it('returns empty list for unrecognized commands with arguments', () => {
      expect(getAutocompleteSuggestions('unknowncmd foo')).toEqual([]);
    });
  });
});
