# Responsive implementation

This report records the earlier responsive pass. The current hamburger navigation correction and expanded validation are documented in `NAVIGATION.md`.

## Audit and approach

This is a static four-page website with page CSS and vanilla JavaScript. The pre-change HTML, CSS and JavaScript are saved in `../responsive-verification/baseline`; the unchanged images are shared by the verification server.

The audit found the following layout problems:

- At 320 px the home document expanded to 415 px. Narrow content wrappers, fixed card widths and an unadapted fixed header caused overflow.
- At 1024 px the home document expanded to 1272 px. Four fixed featured cards and a category rail did not fit the available width.
- Menu navigation used a 16 rem gap and the page lacked a viewport declaration. Fixed card offsets, a fixed card-list height and eight-pixel category containers clipped content or made actions difficult to reach.
- Review photos and fixed-height cards left insufficient room for text at intermediate widths.
- The contact map's overlaid information cards covered map controls on smaller screens. The mobile form's white description text also lacked contrast against its light background.
- Authentication needed fluid outer padding and wrapping social buttons while keeping its desktop panel intact.

The implementation prioritizes shared navigation, then page layouts, then controls and forms. Existing repeated responsive sections were replaced with grouped, content-driven breakpoints at 1400, 1100, 900 and 600 px as applicable. No framework, dependency, theme or asset migration was introduced.

## Files and behavior

- `responsive.css`: shared wrapping navigation below 1100 px, in normal document flow so a taller header cannot cover content. Below 600 px logo, links and actions occupy separate rows. All existing links and buttons remain visible. Safe-area padding is respected.
- `style.css`: fluid home tracks and input sizing; featured cards become two columns when the rail and four cards no longer fit, then one column on phones. The hero and about sections stack when their columns become cramped. Existing about images and experience badge remain visible. The about text's entrance motion stays inside smaller gutters so mobile browsers do not expand their layout viewport during animation. Review cards grow with their content and the footer stacks. Wide-screen section composition remains intact.
- `menu.css`: replace oversized header gaps, constrain shrinking children and reduce the middle-card offset only when needed. Keep three paginated cards visible in a tablet grid or a phone stack. Category dots retain their appearance inside larger labeled tap targets. Existing wide-screen staggered cards remain.
- `contact.css`: stack map and information cards within their column below 1100 px so map controls remain exposed; stack the main columns below 900 px. The decorative curved split no longer intercepts map clicks at any width. Reuse existing white and dark theme tokens for legible mobile navigation and form copy.
- `login.css`: fluid padding, wrapping social buttons and comfortable controls at narrower widths; desktop rules remain untouched.
- `index.html`, `menu.html`, `contact.html`: load the shared responsive stylesheet. Fix malformed Register link wrappers on home/contact, add the missing menu viewport meta tag, and supply the existing Contact anchor with its target ID.
- `menu.js`, `menu.html`: normalize the existing Meals image path to forward slashes. Returning to Meals previously produced a broken image because JavaScript consumed the backslashes as escape characters. The image asset itself is unchanged.

No content was removed to make layouts fit. There is no document-level horizontal overflow suppression. Existing routes, category data, pagination, review timers, hero events and form contracts remain in place. No application dependencies were added.

## Verification

The parent-workspace `responsive-check.cjs` serves both versions and uses the bundled Playwright package with installed Microsoft Edge. It supports:

```
node responsive-check.cjs audit
node responsive-check.cjs verify
node responsive-check.cjs verify --online
node responsive-check.cjs verify --online --touch
node responsive-check.cjs desktop
```

`CHECK_WIDTHS` can restrict the viewport matrix, for example `320,768,1440`. The online mode needs network access for the existing Google Fonts, icon stylesheets and Leaflet resources. Offline mode intentionally blocks external requests and records the resulting existing Leaflet-unavailable error instead of representing it as a live-map test.

Checks cover document and element overflow, text/control clipping, navigation collisions, category rendering, favorites, keyboard hero selection, review reveal, menu pagination bounds, login/register switching and native required-field validation. Online mode also clicks the real Leaflet zoom controls. At 390 px the suite resizes each loaded page through 901, 600, 1100, 1101, 1400, 1401, 375 and 390 px to check breakpoint transitions without reloading.

Screenshots and machine-readable results are saved under `../responsive-verification`. Desktop comparison captures both versions at 1440 and 1920 px, including section geometry and computed typography, colors, backgrounds, borders and shadows. Full screenshots contain normal rendering differences, so exact pixel identity is not claimed. The menu intentionally differs where navigation and category targets were corrected.

Completed checks:

- All four pages at 320, 375, 390, 430, 600, 768, 900, 1024, 1280, 1440 and 1920 px: 44 offline page/width checks passed.
- The same 44 page/width combinations passed with real fonts, icons and Leaflet loaded and no JavaScript page errors. The large-screen segment was rerun after the map hit-target fix; combined results are in `verify-online-complete.json`.
- Touch/mobile emulation at double pixel density passed on all four pages at 320, 390 and 768 px, including live resize transitions at 390 px. Unlike a plain resized desktop window, this also checks that the mobile layout viewport stays at the requested width.
- At 1440 and 1920 px the sampled section geometry and computed typography, theme colors, backgrounds, borders and shadows match the saved desktop baseline on all pages. Home has small pixel-level rendering differences in otherwise matching section layouts; menu has intentional navigation/category-control changes. The login desktop screenshots matched exactly in both captures.
- Before/after screenshots and representative mobile/tablet/desktop captures were visually inspected. All 130 original image assets were verified unchanged by SHA-256.

All four application JavaScript files passed Node syntax parsing. This project has no configured package build, lint, type-check or pre-existing automated test command. Those checks are unavailable rather than reported as passed.

## Limits

Browser coverage is headless Chromium through Microsoft Edge, not physical iOS/Safari or Android devices. Existing forms and several action buttons have no supplied backend; the checks preserve and exercise the available frontend behavior without inventing submission services. External fonts, icons and map tiles still depend on their original providers. The earlier `REFACTORING.md` and parent `verify.cjs` document the previous refactoring task; their byte-for-byte stylesheet assertions are historical and do not apply to this intentional responsive change.
