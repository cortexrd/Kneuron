# Kneuron Developer Notes

Technical reference for future development. Documents non-obvious behaviors and workarounds.

---

## Vue Virtual Scroller (`vue-recycle-scroller`)

The left sidebar tables list uses a `vue-recycle-scroller` which virtualizes rendering. This creates several challenges since Kneuron disables its positioning to enable filtering.

### How it works (Knack's implementation)
- Uses `itemSize = 40px` to calculate which items to render
- Sets `min-height` on `.vue-recycle-scroller__item-wrapper` = `itemCount * 40`
- Positions each item via inline `transform: translateY(N * 40px)`
- Only renders a **pool** of DOM elements (visible items + buffer), not all items
- Pool size = `ceil(viewportHeight / itemSize) + buffer`

### What Kneuron overrides (static CSS)
```css
#objects-nav .vue-recycle-scroller__item-view {
    transform: none !important;
    position: relative !important;
}
```
This disables virtual positioning so items stack naturally in DOM order. Required for the incremental filter to work (hiding items with `display:none` and having remaining items fill the space).

### The density + scroller interaction problem

When vertical density reduces item padding (e.g., from 40px to 24px), two issues arise:

1. **Missing items**: The scroller calculates pool size based on `viewportHeight / 40px`. With a smaller viewport (wrapper shrunk by density), fewer items are rendered. Example: 18 tables but only 13 rendered.

2. **Blank gap**: The wrapper `min-height` is `18 * 40 = 720px` but actual content is `18 * 24 = 432px`, leaving a 288px gap before User Roles.

3. **Wrong order**: When pool items are added late (via expansion trick), the scroller assigns data items to recycled pool slots in arbitrary order. Since `transform: none` makes DOM order = visual order, items appear out of sequence.

### The solution: `fixScrollerPool()`

A 3-phase approach with careful timing:

1. **Phase 1 - Let scroller render fully**: No CSS override on `min-height` at page load. The scroller renders with Vue's default `min-height: 720px`. All 18 items get valid `translateY` values (0, 40, 80, ..., 680).

2. **Phase 2 - Sort DOM by translateY** (after 200ms): Read each item-view's inline `transform`, parse the Y value, sort DOM elements ascending. Items with `translateY < 0` (parked at -9999px) go to the end.

3. **Phase 3 - Shrink wrapper**: Inject a dynamic `<style id="kneuron-scroller-fix">` with `min-height: auto !important`. This CSS rule persists against Vue's constant inline style resets.

### Guard: view-type + fixInProgress

The mutation observer fires `fixScrollerPool()` on every DOM change (including hover). Two guards prevent unnecessary re-runs:

1. **`lastFixViewType`**: Tracks the current view type (`records`/`fields`/`tasks` from URL). Only re-runs when the view type changes (e.g., Records→Fields toggle) or when forced (density change passes `force=true`). Selecting a different table stays in the same view type, so the fix is skipped — no scroll jump.

2. **`fixInProgress`**: Boolean flag prevents re-entrant calls during the 200ms expand window. Without this, mutations triggered by the expand phase would start overlapping sort+reorder cycles.

**Why it must re-run on view switches**: Vue recreates the scroller on SPA view switches with only ~13 pool items (based on viewport). Without fixScrollerPool, most tables disappear.

**Scroll preservation**: After sort+dedup, calls `scrollIntoView({ block: 'center', behavior: 'instant' })` on the `.router-link-active` element to compensate for the DOM reorder shifting the selected table off-screen.

Previous approaches that **didn't work**:
- **Style-content guard** (`if (fixStyle.textContent) return`): Too aggressive — blocked re-run on view switch entirely, causing missing tables.
- **Marker-class guard** (`kneuron-fixed` on items): Vue reuses DOM elements on view switch, so markers persisted and the guard still blocked re-run.
- **`hasFixedPool` one-shot guard**: Blocked ALL re-runs after first load. Vue recreates the scroller on view switches with only ~13 items, but fixScrollerPool was blocked from expanding it.

### Duplicate items on density change

When density CSS changes item heights, Vue's scroller recalculates the pool and creates duplicate item-views. Duplicates are hidden with `display: none` (not removed) inside `fixScrollerPool()` to preserve the pool size. Using `item.remove()` permanently shrinks the pool and Vue won't recreate removed elements.

**Key insight**: Inline `!important` beats stylesheet `!important`, BUT Vue's reactivity sets `element.style.minHeight = 'Xpx'` which strips the `!important` flag. A stylesheet `!important` rule is the only reliable way to override Vue's inline styles persistently.

---

## Vertical Density

### CSS injection pattern
Uses a dynamic `<style id="kneuron-density-style">` element. The `applyVerticalDensity(level)` function updates its `textContent` with density-specific CSS rules. Empty content = normal density.

### What it affects
- **Nav items**: `#objects-nav .nav-item a` padding
- **Record table cells**: `.kn-table-element td` padding and line-height
- **Scroller pool**: Must call `fixScrollerPool(true)` after density change (force flag bypasses view-type guard)

### UI placement
Density radio buttons (Low/Med/High) are injected into `#topbar-nav-left` (the persistent header bar with app name). This makes them visible across all views: Data, Pages, Records, Fields. The `addDensityControl()` function is triggered by the mutation observer when `#topbar-nav-left` appears without `#kneuron-density-control`.

### Filter recalculation
When density changes while a table filter is active, the filter's scroller height calculation uses `sampleItem.offsetHeight` to measure actual item height dynamically. The density radio button handler re-dispatches the filter's `input` event to trigger recalculation.

---

## Table Sorting

Optional alphabetical sorting of tables in the left nav, toggled via an ABC/abc button in the Tables header (next to the filter input).

- `sortTables()` sorts `.vue-recycle-scroller__item-view` elements by their `span[content]` attribute (stripping "View " prefix and " records" suffix)
- Called at the end of `fixScrollerPool()` after items are sorted by translateY and deduplicated
- Setting stored as `tableSorting` in localStorage (`'true'`/`'false'`)
- Toggle button triggers `location.reload()` to ensure clean re-render

---

## Row Hover Highlight

### The sticky column challenge
Sticky columns have `position: sticky` with an opaque `background-color` set by JS (in `applyStickyCols()`). This creates two problems with row hover:

1. **Transparency bleed**: Using `rgba()` background on hover overrides the opaque background, letting scrolled content show through sticky columns. Fix: use opaque `#fffcfe` (pre-blended pink-tinted white) for `.kneuron-sticky` cells.

2. **Missing glow**: The `box-shadow: inset` on `tr:hover` is hidden behind sticky cells (they have `z-index: 1`). Fix: add top/bottom-only inset shadows on sticky cells to avoid per-cell glow borders:
   ```css
   box-shadow: inset 0 8px 8px -7px ..., inset 0 -8px 8px -7px ...;
   ```

### CSS class marker
`applyStickyCols()` adds `.kneuron-sticky` class to each sticky `<td>`, enabling targeted CSS for hover highlights.

---

## localStorage

All settings stored under a single `Kneuron` key as JSON. Access via:
- `getSettings()` — returns parsed object or `{}`
- `setSetting(key, value)` — merges into existing object

Properties: `stickyCols`, `pageSorting`, `verticalDensity`, `tableSorting`, `recordCounts`

---

## Active Table Selector

The selected/active table in the left nav has class `router-link-active` directly on the `<a>` tag, NOT on a `.nav-item` wrapper. The `<a>` sits directly inside `.vue-recycle-scroller__item-view`.

**Correct**: `.router-link-active`
**Wrong**: `.nav-item.active`, `.nav-item .router-link-active`

This affects all `scrollIntoView` calls: `fixScrollerPool`, tables filter `onEscape`, and the global Escape handler.

---

## Tables Filter Escape Behavior

When Escape is pressed in the tables filter:
1. `handleFilterKeydown` clears the input, dispatches `input` event, blurs, resets scroller height
2. The `onEscape` callback (100ms delay) finds `.router-link-active` and scrolls it to center

The Pages filter already had this pattern; the Tables filter was missing it.

---

## CSS Specificity Battles

### Accounts user role in tables filter
The Accounts element uses `<li data-cy="nav-account-link">` with NO `id` attribute (unlike regular tables which have `id="object-li-object_X"`). The filter selectors include `[data-cy="nav-account-link"].nav-item` in addition to the id-based selectors.

### Bold labels on density radio buttons
Knack's CSS rule `form>div label { font-weight: 600 }` targets `<label>` elements directly. Adding `font-weight: normal` to a parent container doesn't override it. Fix: set `font-weight: normal` as inline style on each `<label>` element (inline styles beat stylesheet rules at same specificity).

### Vue inline style resets
Vue's reactivity continuously sets inline styles on scroller elements. `element.style.X = value` strips any `!important` flag. Only a CSS `!important` rule in a `<style>` element can persistently override these.

---

## File Encoding

All source files use CRLF line endings. The `Edit` tool may fail on exact string matches — use `sed -i` via Bash as a fallback.

## Zip Packaging

The `zip` command is not available in bash on this Windows environment. Use PowerShell:
```powershell
powershell -Command "Remove-Item Kneuron.zip -ErrorAction SilentlyContinue; Compress-Archive -Path Kneuron.js, manifest.json, popup.html, page-script.js, Kneuron-Icon128.png, Kneuron-Icon48.png, Kneuron-Icon16.png -DestinationPath Kneuron.zip"
```
