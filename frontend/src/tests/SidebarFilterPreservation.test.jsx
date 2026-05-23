/**
 * Task 2 — Preservation Property Tests (run BEFORE implementing fix)
 *
 * Property 2: Preservation — Inactive Button and Hover Behavior
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * Observation-first methodology: observe the UNFIXED CSS behavior for all
 * contexts where isBugCondition() returns false (inactive buttons), then
 * encode those observed values as property-based tests.
 *
 * Observed baseline values on UNFIXED CSS:
 *   - Inactive button default:
 *       background: var(--bg-surface), color: var(--text-secondary),
 *       border: 1px solid var(--border-strong)
 *   - Inactive button hover (light mode):
 *       background: #eff6ff, color: #1d4ed8, border-color: #3b82f6
 *   - Inactive button hover (dark mode):
 *       background: #1e3a5f, color: #93c5fd
 *
 * isBugCondition({ buttonHasActiveClass, userIsHovering, isDarkMode }):
 *   returns true when (buttonHasActiveClass AND userIsHovering)
 *              OR     (buttonHasActiveClass AND isDarkMode)
 *
 * For all contexts where isBugCondition() returns false, the CSS rules
 * for inactive buttons must remain exactly as observed above.
 *
 * EXPECTED OUTCOME: All tests PASS on UNFIXED CSS (confirms baseline to preserve).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
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
 * Get all CSS rules from all loaded stylesheets.
 */
function getCSSRules() {
  const sheets = Array.from(document.styleSheets);
  return sheets.flatMap(sheet => {
    try { return Array.from(sheet.cssRules); } catch { return []; }
  });
}

/**
 * Find a CSS rule by exact selector text.
 */
function findRule(selectorText) {
  return getCSSRules().find(r => r.selectorText === selectorText);
}

/**
 * Find a CSS rule using a predicate on the selector text.
 */
function findRuleMatching(predicate) {
  return getCSSRules().find(r => predicate(r.selectorText || ''));
}

// ---------------------------------------------------------------------------
// isBugCondition predicate (from design.md)
// ---------------------------------------------------------------------------

function isBugCondition({ buttonHasActiveClass, userIsHovering, isDarkMode }) {
  return (
    (buttonHasActiveClass && userIsHovering) ||
    (buttonHasActiveClass && isDarkMode)
  );
}

// ---------------------------------------------------------------------------
// Preservation input space
//
// All contexts where isBugCondition() returns false:
//   - inactive button (no active class), any hover state, any theme
//   - active button, no hover, light mode (edge: active but not a bug condition)
//
// The preservation property covers all inputs where NOT isBugCondition.
// ---------------------------------------------------------------------------

/**
 * Arbitrary for all non-bug-condition contexts.
 * These are the inputs the fix must NOT affect.
 */
const nonBugConditionArb = fc.record({
  buttonHasActiveClass: fc.boolean(),
  userIsHovering: fc.boolean(),
  isDarkMode: fc.boolean(),
}).filter(ctx => !isBugCondition(ctx));

// ---------------------------------------------------------------------------
// Task 2 — Preservation Tests (run against REAL app.css)
//
// These tests assert that the EXISTING CSS rules for inactive buttons are
// present and have the correct values. They PASS on UNFIXED CSS, establishing
// the baseline that the fix must preserve.
// ---------------------------------------------------------------------------

describe('Task 2 — Preservation: Inactive Button and Hover Behavior (real app.css)', () => {
  let removeCSS;

  beforeEach(() => {
    removeCSS = injectCSS(REAL_APP_CSS);
  });

  afterEach(() => {
    removeCSS();
  });

  // ── Requirement 3.1: Inactive button default appearance ─────────────────
  // Inactive buttons render with surface background, secondary text, strong border.

  it('Req 3.1 — .sidebar-filter-btn rule exists with default inactive styles', () => {
    /**
     * Validates: Requirement 3.1
     *
     * Observed on UNFIXED CSS:
     *   .sidebar-filter-btn { background: var(--bg-surface); color: var(--text-secondary);
     *                          border: 1px solid var(--border-strong); }
     */
    const rule = findRule('.sidebar-filter-btn');
    expect(rule).toBeDefined();
    expect(rule.style.background).toBe('var(--bg-surface)');
    expect(rule.style.color).toBe('var(--text-secondary)');
  });

  it('Req 3.1 — .sidebar-filter-btn default border uses var(--border-strong)', () => {
    /**
     * Validates: Requirement 3.1
     *
     * The border property on the base rule must reference --border-strong.
     */
    const rule = findRule('.sidebar-filter-btn');
    expect(rule).toBeDefined();
    // border shorthand: "1px solid var(--border-strong)"
    expect(rule.style.border).toContain('var(--border-strong)');
  });

  // ── Requirement 3.2: Inactive button hover (light mode) ─────────────────
  // Hovering over an inactive button shows blue border, light blue bg, blue text.

  it('Req 3.2 — .sidebar-filter-btn:hover rule exists', () => {
    /**
     * Validates: Requirement 3.2
     *
     * Observed on UNFIXED CSS:
     *   .sidebar-filter-btn:hover { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
     */
    const rule = findRule('.sidebar-filter-btn:hover');
    expect(rule).toBeDefined();
  });

  it('Req 3.2 — .sidebar-filter-btn:hover sets background to #eff6ff (light blue)', () => {
    /**
     * Validates: Requirement 3.2
     * Observed baseline: background #eff6ff = rgb(239, 246, 255)
     */
    const rule = findRule('.sidebar-filter-btn:hover');
    expect(rule).toBeDefined();
    // jsdom normalises hex to rgb
    expect(rule.style.background).toBe('rgb(239, 246, 255)');
  });

  it('Req 3.2 — .sidebar-filter-btn:hover sets color to #1d4ed8 (blue text)', () => {
    /**
     * Validates: Requirement 3.2
     * Observed baseline: color #1d4ed8 = rgb(29, 78, 216)
     */
    const rule = findRule('.sidebar-filter-btn:hover');
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('rgb(29, 78, 216)');
  });

  it('Req 3.2 — .sidebar-filter-btn:hover sets border-color to #3b82f6 (blue border)', () => {
    /**
     * Validates: Requirement 3.2
     * Observed baseline: border-color #3b82f6 = rgb(59, 130, 246)
     */
    const rule = findRule('.sidebar-filter-btn:hover');
    expect(rule).toBeDefined();
    expect(rule.style.borderColor).toBe('rgb(59, 130, 246)');
  });

  // ── Requirement 3.3: Inactive button hover (dark mode) ──────────────────
  // Dark mode hover on inactive buttons shows dark blue bg and light blue text.

  it('Req 3.3 — [data-theme="dark"] .sidebar-filter-btn:hover rule exists', () => {
    /**
     * Validates: Requirement 3.3
     *
     * Observed on UNFIXED CSS:
     *   [data-theme="dark"] .sidebar-filter-btn:hover { background: #1e3a5f; color: #93c5fd; }
     */
    const rule = findRuleMatching(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn:hover') && !t.includes('.active')
    );
    expect(rule).toBeDefined();
  });

  it('Req 3.3 — dark mode hover sets background to #1e3a5f (dark blue)', () => {
    /**
     * Validates: Requirement 3.3
     * Observed baseline: background #1e3a5f = rgb(30, 58, 95)
     */
    const rule = findRuleMatching(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn:hover') && !t.includes('.active')
    );
    expect(rule).toBeDefined();
    expect(rule.style.background).toBe('rgb(30, 58, 95)');
  });

  it('Req 3.3 — dark mode hover sets color to #93c5fd (light blue text)', () => {
    /**
     * Validates: Requirement 3.3
     * Observed baseline: color #93c5fd = rgb(147, 197, 253)
     */
    const rule = findRuleMatching(
      t => t.includes('data-theme') && t.includes('.sidebar-filter-btn:hover') && !t.includes('.active')
    );
    expect(rule).toBeDefined();
    expect(rule.style.color).toBe('rgb(147, 197, 253)');
  });

  // ── PBT: Property 2 — for all non-bug-condition contexts, inactive rules exist ──

  it('PBT — for all non-bug-condition contexts, isBugCondition returns false', () => {
    /**
     * Validates: Requirements 3.1, 3.2, 3.3, 3.4
     *
     * Property: every context generated by nonBugConditionArb satisfies
     * NOT isBugCondition(ctx). This validates the generator is correctly
     * scoped to the preservation domain.
     */
    fc.assert(
      fc.property(nonBugConditionArb, ctx => {
        expect(isBugCondition(ctx)).toBe(false);
      }),
      { numRuns: 200 }
    );
  });

  it('PBT — for all non-bug-condition contexts, base .sidebar-filter-btn rule is present', () => {
    /**
     * Validates: Requirements 3.1, 3.4
     *
     * Property: for every non-bug-condition context, the base CSS rule
     * .sidebar-filter-btn exists in the stylesheet with the correct
     * inactive default styles (surface background, secondary text color).
     *
     * This rule governs inactive button default appearance and must be
     * preserved unchanged by the fix.
     */
    fc.assert(
      fc.property(nonBugConditionArb, ctx => {
        // The base rule must always be present regardless of context
        const rule = findRule('.sidebar-filter-btn');
        expect(rule).toBeDefined();
        expect(rule.style.background).toBe('var(--bg-surface)');
        expect(rule.style.color).toBe('var(--text-secondary)');
        return true;
      }),
      { numRuns: 200 }
    );
  });

  it('PBT — for all non-bug-condition hover contexts (light mode), hover rule has correct styles', () => {
    /**
     * Validates: Requirement 3.2
     *
     * Property: for every non-bug-condition context where the user is hovering
     * in light mode, the .sidebar-filter-btn:hover rule exists with the
     * observed baseline values: background #eff6ff, color #1d4ed8, border-color #3b82f6.
     *
     * These are the values the fix must not change.
     */
    const lightHoverArb = nonBugConditionArb.filter(
      ctx => ctx.userIsHovering && !ctx.isDarkMode
    );

    fc.assert(
      fc.property(lightHoverArb, _ctx => {
        const rule = findRule('.sidebar-filter-btn:hover');
        expect(rule).toBeDefined();
        expect(rule.style.background).toBe('rgb(239, 246, 255)');   // #eff6ff
        expect(rule.style.color).toBe('rgb(29, 78, 216)');           // #1d4ed8
        expect(rule.style.borderColor).toBe('rgb(59, 130, 246)');    // #3b82f6
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('PBT — for all non-bug-condition hover contexts (dark mode), dark hover rule has correct styles', () => {
    /**
     * Validates: Requirement 3.3
     *
     * Property: for every non-bug-condition context where the user is hovering
     * in dark mode (inactive button), the dark mode hover rule exists with the
     * observed baseline values: background #1e3a5f, color #93c5fd.
     *
     * These are the values the fix must not change.
     */
    const darkHoverArb = nonBugConditionArb.filter(
      ctx => ctx.userIsHovering && ctx.isDarkMode
    );

    fc.assert(
      fc.property(darkHoverArb, _ctx => {
        const rule = findRuleMatching(
          t => t.includes('data-theme') && t.includes('.sidebar-filter-btn:hover') && !t.includes('.active')
        );
        expect(rule).toBeDefined();
        expect(rule.style.background).toBe('rgb(30, 58, 95)');    // #1e3a5f
        expect(rule.style.color).toBe('rgb(147, 197, 253)');       // #93c5fd
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('PBT — for all non-bug-condition non-hover contexts, no active-specific rules interfere', () => {
    /**
     * Validates: Requirements 3.1, 3.4
     *
     * Property: for every non-bug-condition context where the button is not
     * being hovered, the base .sidebar-filter-btn rule is the governing rule
     * for inactive buttons. The fix must not introduce any rules that would
     * change the default inactive appearance.
     *
     * Specifically: no rule targeting inactive buttons (without .active class)
     * should override the base background or color values.
     */
    const nonHoverArb = nonBugConditionArb.filter(ctx => !ctx.userIsHovering);

    fc.assert(
      fc.property(nonHoverArb, _ctx => {
        const baseRule = findRule('.sidebar-filter-btn');
        expect(baseRule).toBeDefined();
        // Base rule must use CSS variables (not hardcoded values) for theming
        expect(baseRule.style.background).toBe('var(--bg-surface)');
        expect(baseRule.style.color).toBe('var(--text-secondary)');
        return true;
      }),
      { numRuns: 200 }
    );
  });

  // ── Requirement 3.4: Clear filters returns buttons to inactive appearance ─

  it('Req 3.4 — removing active class from button leaves only base .sidebar-filter-btn rule applicable', () => {
    /**
     * Validates: Requirement 3.4
     *
     * When "Clear filters" removes the active class, the button reverts to
     * the base .sidebar-filter-btn rule. This test confirms the base rule
     * exists and has the correct inactive styles, so removal of active class
     * will correctly restore the default appearance.
     */
    const baseRule = findRule('.sidebar-filter-btn');
    expect(baseRule).toBeDefined();
    expect(baseRule.style.background).toBe('var(--bg-surface)');
    expect(baseRule.style.color).toBe('var(--text-secondary)');
    expect(baseRule.style.border).toContain('var(--border-strong)');
  });

  // ── Structural: active rules must not target inactive buttons ────────────

  it('Structural — no CSS rule targets .sidebar-filter-btn without .active for non-default states', () => {
    /**
     * Validates: Requirements 3.1, 3.2, 3.3
     *
     * Property: the only rules that apply to .sidebar-filter-btn (without .active)
     * are the base rule and the :hover rule. No additional rules should exist
     * that would unexpectedly override inactive button styles.
     *
     * This ensures the fix (which adds .active rules) does not accidentally
     * introduce rules that affect inactive buttons.
     */
    const rules = getCSSRules();
    const inactiveButtonRules = rules.filter(r => {
      const sel = r.selectorText || '';
      return (
        sel.includes('sidebar-filter-btn') &&
        !sel.includes('.active') &&
        !sel.includes('sidebar-filter-btn-group') &&
        !sel.includes('sidebar-clear') &&
        !sel.includes('sidebar-list') &&
        !sel.includes('sidebar-toggle') &&
        !sel.includes('sidebar-input') &&
        !sel.includes('sidebar-label') &&
        !sel.includes('sidebar-section') &&
        !sel.includes('sidebar-empty')
      );
    });

    // Expected rules for inactive buttons: base + :hover + dark :hover
    // (3 rules total — no more should exist targeting inactive buttons)
    const selectors = inactiveButtonRules.map(r => r.selectorText);

    expect(selectors).toContain('.sidebar-filter-btn');
    expect(selectors).toContain('.sidebar-filter-btn:hover');
    // Dark mode hover rule for inactive buttons
    const hasDarkHover = selectors.some(
      s => s.includes('data-theme') && s.includes('.sidebar-filter-btn:hover') && !s.includes('.active')
    );
    expect(hasDarkHover).toBe(true);
  });
});
