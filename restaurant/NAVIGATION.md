# Responsive navigation correction

## Why the earlier pass was insufficient

- It wrapped all header links and actions into visible rows instead of supplying a mobile disclosure. With the actual font, a 390 px header measured 216 px high. The new closed mobile header measures 88 px.
- The home hero retained a fixed `90vh` height on wide screens. Its content exceeded that height with Cairo loaded, overlapping the About section at 1440 px; shorter windows also caused the dish image to overlap. The earlier checks covered horizontal overflow, not section intersections or vertical clipping.
- Desktop review reveals could extend into an ancestor with hidden overflow.
- The small-screen menu image used a 4:5 container with `object-fit: cover`, unnecessarily cropping a round dish and reserving extra height.
- Earlier snapshots could catch the menu before its existing 100 ms delayed render. Current checks wait for its three cards and images before judging the layout.

The source immediately before this correction is saved in `../navigation-verification/baseline`.

## Implementation

`navigation.js` initializes the same disclosure on home, menu and contact. Authentication retains its existing standalone design. The existing links and destinations are preserved in one DOM tree; there is no duplicate mobile menu.

At widths up to 1023 px, the header contains the existing logo and a 44 px button. The existing navigation links and Login/Register/Reserve actions appear inside an in-flow dropdown using the existing palette, gradients, fonts, rounded corners and shadows. The expanded panel can scroll vertically on short landscape screens; it does not cover content or require a body scroll lock.

The button exposes `aria-controls`, `aria-expanded` and an updated accessible label. Enter/Space use native button behavior. Escape restores focus to the toggle. Selecting a link or clicking outside closes the menu. Visible focus rings support keyboard navigation. Crossing the breakpoint clears open state and moves focus out of a control that is becoming hidden. On wider screens, `display: contents` keeps the original desktop flex items and spacing. If JavaScript is unavailable, the navigation remains visible rather than becoming inaccessible.

Changes by file:

- `index.html`, `menu.html`, `contact.html`: add the shared deferred script, disclosure button and panel wrapper around the existing links/actions.
- `responsive.css`: replace the former phone header rows with the shared disclosure at 1023 px. Existing desktop navigation rules remain in place. No global horizontal clipping was added.
- `navigation.js`: menu state, link/outside dismissal, Escape and breakpoint focus handling.
- `style.css`: let the hero grow naturally while retaining its viewport-based minimum height; remove the duplicate media rule and allow review reveals to remain visible.
- `menu.css`: use a square, contained dish image at the existing smaller-layout breakpoint; keep the source asset unchanged.

No routes, form contracts, category datasets, pagination, review timers or assets were replaced. No dependencies were added.

## Validation and artifacts

The checks use installed Microsoft Edge through the bundled Playwright package. They load the actual fonts, icons and Leaflet resources. Network access is required.

```
node navigation-check.cjs verify
```

The default matrix covers all four pages at 320, 360, 390, 430, 768, 1024, 1280 and 1440 px. It checks both 900 px and 600 px window heights, document/element overflow, text labels, ancestor clipping and section/header intersections. Every header route and both account links are followed, including same-page anchors. Mobile tests exercise open/close, Enter, Space, Tab, Escape, outside clicks, ARIA state and visible focus. The expanded menu is also exercised at a 360 px window height, including its last action.

After the matrix, each header is resized through 1023, 1024, 1025, 1023, 900, 1100, 1101, 600, 430, 320, 1440 and 390 px. These checks cover both breakpoint directions, open-state reset, focus restoration and missing/duplicated controls.

`CHECK_WIDTHS` selects a smaller matrix; `--touch` enables mobile emulation with touch and double pixel density, and `--resize-only` isolates breakpoint/focus checks. The full matrices are retained as `navigation-verification/verify-matrix.json` and `verify-touch-matrix.json`; `verify.json` stores the later targeted rerun. `resize.json` and `resize-touch.json` record the completed breakpoint/focus checks. Representative closed/open screenshots are in the same folder.

Regression checks also use the earlier `responsive-check.cjs` with `CHECK_OUTPUT=navigation-verification` and `CHECK_WIDTHS=320,768,1440`. They exercise featured categories, favorites, keyboard hero selection, review reveal, menu categories and pagination, login/register switching, required-field validation and real map zoom controls.

Desktop before/after captures at 1440 and 1920 px are recorded in `desktop-comparison.json`. Navbar, logo, navigation links and action geometry and computed styles are compared separately from the necessary content-flow fixes. Full screenshots are visually inspected; pixel identity for the entire page is not claimed.

Completed validation:

- All 32 page/width combinations passed layout and real-route navigation checks at the eight requested widths, with both 900 px and 600 px heights. Mobile menus also fit and remained usable at a 360 px window height.
- All four pages passed mobile/touch emulation at 320, 390 and 768 px: 12 additional page/width combinations.
- Breakpoint/state/focus checks passed for all three headers in both ordinary and touch contexts. An initial focus race was found and corrected: some browsers blurred the disappearing toggle before the media-query callback; focus ownership is now remembered until it leaves the header.
- A final targeted rerun at 320 and 1024 px passed after that correction and the explicit 44 px border-box sizing of the toggle.
- Nine strict desktop header comparisons passed at 1024, 1280 and 1440 px, including every existing link and action. Geometry, font, colors, background, padding, margins, borders, radius and shadows match the immediate pre-change baseline. Results are in `desktop-navbar.json`; run `node navigation-check.cjs desktop-nav` to repeat.
- The 12 frontend regression page/width combinations at 320, 768 and 1440 px passed, including live map zoom controls. No JavaScript page errors were introduced in these connected browser runs.
- All five application scripts passed Node syntax parsing. The image assets remain unchanged.

There is no supplied build system, lint command, type checker or pre-existing test suite. JavaScript syntax parsing and the browser checks are the available validation. Browser emulation does not constitute physical iOS/Safari or Android testing. Existing actions without a supplied backend remain frontend-only.
