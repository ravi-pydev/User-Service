/**
 * Task 1 — Bug Condition Exploration Test
 *
 * Property 1: Bug Condition — Active Filter Button Visual State
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * Tests that `.sidebar-filter-btn.active` renders with the correct blue-fill
 * appearance for all contexts where isBugCondition() returns true:
 *   - active button + hover (light mode)
 *   - active button (dark mode, no hover)
 *   - active button + hover (dark mode)
 *
 * On UNFIXED CSS these tests FAIL — confirming the bug exists.
 * On FIXED CSS these tests PASS — confirming the fix is correct.
 *
 * isBugCondition({ buttonHasActiveClass, userIsHovering, isDarkMode }):
 *   returns true when (buttonHasActiveClass AND userIsHovering)
 *              OR     (buttonHasActiveClass AND isDarkMode)
 *
 * Expected active appearance: background #3b82f6, color white, border-color #3b82f6
 *
 * Requirements: 1.1, 1.2, 1.3
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Load the REAL app.css from disk
// ---------------------------------------------------------------------------

const APP_CSS_PATH = path.resolve(__dirname, '../styles/app.css');
const REAL_APP_CSS = fs.readFileSync(APP_CSS_PATH, 'utf-8');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Inject a <style> block into the document head and return a cleanup fn.
 */
function injectCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return () => document.head.removeChild(style);
}

/**
 * Render a button with the given classes inside an optional theme wrapper,
 * optionally fire a mouseenter event, and return the button element.
 */
function renderButton({ hasActive, isHovering, isDarkMode }) {
  const container = document.createElement('div');
  if (isDarkMode) container.setAttribute('data-theme', 'dark');
  document.body.appendChild(container);

  const btn = document.createElement('button');
  btn.className = `sidebar-filter-btn${hasActive ? ' active' : ''}`;
  btn.textContent = 'Premium';
  container.appendChild(btn);

  if (isHovering) {
    fireEvent.mouseEnter(btn);
    fireEvent.mouseOver(btn);
  }

  return { btn, cleanup: () => document.body.removeChild(container) };
}

// ---------------------------------------------------------------------------
// isBugCondition predicate
// ---------------------------------------------------------------------------

function isBugCondition({ buttonHasActiveClass, userIsHovering, isDarkMode }) {
  return (
    (buttonHasActiveClass && userIsHovering) ||
    (buttonHasActiveClass && isDarkMode)
  );
}

// ---------------------------------------------------------------------------
// CSS rule extraction helpers
// ---------------------------------------------------------------------------

function getCSSRules() {
  const sheets = Array.from(document.styleSheets);
  return sheets.flatMap(sheet => {
    try { return Array.from(sheet.cssRules); } catch { return []; }
  });
}

function findRule(selectorText) {
  return getCSSRules().find(r => r.selectorText === selectorText);
}

function hasRuleMatching(predicate) {
  return getCSSRules().some(r => predicate(r.selectorText || ''));
}

// ---------------------------------------------------------------------------
// Task 1 — Bug Condition Exploration Tests (run against REAL app.css)
//
// These tests assert the EXPECTED behavior (blue fill for active buttons).
// On UNFIXED CSS (missing active:hover and dark mode active rules), these
// tests FAIL — confirming the bug exists.
//
// Documented counterexamples on UNFIXED CSS:
//   1. Active + hover (light mode): .sidebar-filter-btn.active:hover rule is absent,
//      so the :hover rule overrides active styles → background reverts to #eff6ff
//      (light blue) instead of staying #3b82f6 (blue fill), color reverts to #1d4ed8.
//   2. Active + no hover (dark mode): no [data-theme="dark"] .sidebar-filter-btn.active
//      rule exists → dark mode active button falls back to light-mode active style
//      without dark-mode-specific treatment.
//   3. Active + hover (dark mode): dark hover rule (#1e3a5f bg, #93c5fd color)
//      overrides the active state entirely.
// ---------------------------------------------------------------------------

describe('Task 1 — Bug Condition: Active Filter Button Visual State (real app.css)', () => {
  let removeCSS;

  beforeEach(() => {
    removeCSS = injectCSS(REAL_APP_CSS);
  });

  afterEach(() => {
    removeCSS();
  });

  // ── Scenario A: Active + hover (light mode) ──────────────────────────────
  // Bug: .sidebar-filter-btn.active:hover rule is missing in unfixed CSS.
  // The :hover rule overrides the active state on hover.

  it('Scenario A — real CSS contains .sidebar-filter-btn.active:hover rule', () => {
    // On UNFIXED CSS: this rule is absent → test FAILS (confirms hover override bug)
    // On FIXED CSS: this rule is present → test PASSES
    const rule = findRule('.sidebar-filter-btn.active:hover');
    expect(rule).toBeDefined();
  });

  it('Scenario A — .sidebar-filter-btn.active:hover rule sets color to white', () => {
    // On UNFIXED CSS: rule absent → test FAILS
    const rule = findRule('.sidebar-filter-btn.active:hover');
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('white');
  });

  it('Scenario A — .sidebar-filter-btn.active:hover rule sets background (blue fill)', () => {
    // On UNFIXED CSS: rule absent → test FAILS
    // Expected: #3b82f6 (rgb(59,130,246)) or #2563eb (rgb(37,99,235)) — both are blue fill
    const rule = findRule('.sidebar-filter-btn.active:hover');
    expect(rule).toBeDefined();
    const bg = rule.style.background;
    // Accept either the exact blue (#3b82f6) or the darker hover blue (#2563eb)
    const isBlue = bg === 'rgb(59, 130, 246)' || bg === 'rgb(37, 99, 235)';
    expect(isBlue).toBe(true);
  });

  // ── Scenario B: Active + no hover (dark mode) ────────────────────────────
  // Bug: [data-theme="dark"] .sidebar-filter-btn.active rule is missing in unfixed CSS.

  it('Scenario B — real CSS contains [data-theme="dark"] .sidebar-filter-btn.active rule', () => {
    // On UNFIXED CSS: this rule is absent → test FAILS (confirms dark mode bug)
    // On FIXED CSS: this rule is present → test PASSES
    const hasDarkActiveRule = hasRuleMatching(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn.active') && !t.includes(':hover')
    );
    expect(hasDarkActiveRule).toBe(true);
  });

  it('Scenario B — [data-theme="dark"] .sidebar-filter-btn.active rule sets color to white', () => {
    // On UNFIXED CSS: rule absent → test FAILS
    const darkActiveRule = getCSSRules().find(r =>
      r.selectorText &&
      r.selectorText.includes('data-theme') &&
      r.selectorText.includes('.sidebar-filter-btn.active') &&
      !r.selectorText.includes(':hover')
    );
    expect(darkActiveRule).toBeDefined();
    expect(darkActiveRule.style.color).toBe('white');
  });

  it('Scenario B — [data-theme="dark"] .sidebar-filter-btn.active rule sets background to blue fill', () => {
    // On UNFIXED CSS: rule absent → test FAILS
    const darkActiveRule = getCSSRules().find(r =>
      r.selectorText &&
      r.selectorText.includes('data-theme') &&
      r.selectorText.includes('.sidebar-filter-btn.active') &&
      !r.selectorText.includes(':hover')
    );
    expect(darkActiveRule).toBeDefined();
    // #3b82f6 = rgb(59, 130, 246)
    expect(darkActiveRule.style.background).toBe('rgb(59, 130, 246)');
  });

  // ── Scenario C: Active + hover (dark mode) ───────────────────────────────
  // Bug: [data-theme="dark"] .sidebar-filter-btn.active:hover rule is missing.

  it('Scenario C — real CSS contains [data-theme="dark"] .sidebar-filter-btn.active:hover rule', () => {
    // On UNFIXED CSS: this rule is absent → test FAILS (confirms dark mode + hover bug)
    // On FIXED CSS: this rule is present → test PASSES
    const hasDarkActiveHoverRule = hasRuleMatching(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn.active:hover')
    );
    expect(hasDarkActiveHoverRule).toBe(true);
  });

  it('Scenario C — [data-theme="dark"] .sidebar-filter-btn.active:hover rule sets color to white', () => {
    // On UNFIXED CSS: rule absent → test FAILS
    const darkActiveHoverRule = getCSSRules().find(r =>
      r.selectorText &&
      r.selectorText.includes('data-theme') &&
      r.selectorText.includes('.sidebar-filter-btn.active:hover')
    );
    expect(darkActiveHoverRule).toBeDefined();
    expect(darkActiveHoverRule.style.color).toBe('white');
  });

  // ── PBT: all isBugCondition=true contexts have active class applied ───────

  it('PBT — for all bug-condition contexts, button has active class applied', () => {
    /**
     * Validates: Requirements 1.1, 1.2, 1.3
     *
     * Property: for every context where isBugCondition returns true,
     * the button element has the active CSS class applied.
     * This is the structural precondition for the CSS rules to take effect.
     */
    const bugContexts = [
      { buttonHasActiveClass: true, userIsHovering: true, isDarkMode: false },   // Scenario A
      { buttonHasActiveClass: true, userIsHovering: false, isDarkMode: true },   // Scenario B
      { buttonHasActiveClass: true, userIsHovering: true, isDarkMode: true },    // Scenario C
    ];

    for (const ctx of bugContexts) {
      expect(isBugCondition(ctx)).toBe(true);
      const { btn, cleanup } = renderButton({
        hasActive: ctx.buttonHasActiveClass,
        isHovering: ctx.userIsHovering,
        isDarkMode: ctx.isDarkMode,
      });
      expect(btn.classList.contains('active')).toBe(true);
      cleanup();
    }
  });

  // ── All three fix rules must be present in real app.css ──────────────────

  it('PBT — real app.css contains all three required fix rules for bug conditions', () => {
    /**
     * Validates: Requirements 1.2, 1.3
     *
     * Property: the real app.css must contain all three CSS rules that fix
     * the bug conditions. On UNFIXED CSS, at least one of these assertions
     * fails, surfacing the counterexample.
     *
     * Counterexamples on unfixed CSS:
     *   - .sidebar-filter-btn.active:hover is absent (Scenario A fails)
     *   - [data-theme="dark"] .sidebar-filter-btn.active is absent (Scenario B fails)
     *   - [data-theme="dark"] .sidebar-filter-btn.active:hover is absent (Scenario C fails)
     */
    const rules = getCSSRules();
    const selectors = rules.map(r => r.selectorText || '');

    // Rule 1: active:hover (light mode) — fixes Scenario A
    expect(selectors).toContain('.sidebar-filter-btn.active:hover');

    // Rule 2: dark mode active — fixes Scenario B
    const hasDarkActive = selectors.some(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn.active') && !t.includes(':hover')
    );
    expect(hasDarkActive).toBe(true);

    // Rule 3: dark mode active:hover — fixes Scenario C
    const hasDarkActiveHover = selectors.some(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn.active:hover')
    );
    expect(hasDarkActiveHover).toBe(true);
  });
});
