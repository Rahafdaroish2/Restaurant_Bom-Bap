# Fix for the screenshot and stale preview assets

## Root causes verified in the actual preview

The existing in-app browser at `http://127.0.0.1:8765/index.html?navigation=2` was inspected before changing the files. It had a mixed set of assets: the current navigation stylesheet/script, but the original home stylesheet. Its live CSSOM still contained `height: 90vh` and the old 1024/768/480 media rules. The on-disk stylesheet and an uncached HTTP request already contained the newer layout. An ordinary reload retained the old stylesheet.

At the actual preview size of 1159 x 676 CSS pixels, that stale stylesheet produced a 608.4 px hero and a 1354 px document. The vertical scrollbar left 1144 px of usable width. Thus the screenshot's overlap and horizontal scrollbar were real, despite previous checks using fresh browser contexts and different cached files.

After loading the correct stylesheet, the narrow desktop layout still had a brittle width threshold: the fixed 460 px image column left 455.2 px for three 144 px cards plus two 12 px gaps, which require 456 px. That subpixel shortage forced a third row. The decorative image also kept fixed dimensions instead of fitting its column. The fluid layout correction addresses this remaining problem rather than relying solely on cache refresh.

## Changes

- `style.css`: below 1400 px, use a flexible 36% image track with shrinkable text content; scale the decorative background and plate proportionally within that track; allow card widths to adapt around the three-card threshold. Retain the existing smaller-screen card sizes and stacked layouts. Reset aspect-ratio sizing where an existing breakpoint supplies a definite height. Keep the circular decoration proportional in the stacked layout. No global overflow hiding was added.
- `contact.css`: reuse the existing white navigation token on the dark contact background at desktop widths as well as smaller widths. The mobile dropdown retains dark text on its light background. Header layout and destinations are unchanged.
- `index.html`, `menu.html`, `contact.html`, `login.html`: attach deterministic content hashes to every local CSS/JavaScript reference, preventing an old stylesheet from being mixed with new markup or scripts.
- `scripts/version-assets.cjs`: update those hashes after editing local CSS/JavaScript. It skips remote resources and is idempotent.
- `serve.py`: serve the project with `Cache-Control: no-store, max-age=0` and `Pragma: no-cache`, independent of the shell's current working directory. The current corrected preview runs at `http://127.0.0.1:8766/index.html`.
- Parent workspace `navigation-check.cjs`: compare layout against actual client width; check the cards, search row, decoration, About text and badge for intersections. Support a 15 px normal-flow width reduction to exercise classic-scrollbar thresholds. Fixed viewport containers are measured against their viewport because the synthetic margin does not shrink the browser's fixed containing block.
- Parent workspace `check-asset-versions.cjs`: assert that all 15 local asset references match the actual file contents.

No image assets, category data, application routes, form contracts, menu behavior or dependencies were replaced.

## Actual browser verification

The same user-facing tab was reloaded with versioned assets, then all four pages were inspected in that browser. Each had a 1159 px inner width, 1144 px client width and 1144 px document width: no horizontal overflow. These measurements are saved in `../layout-verification/actual-preview.json`.

On home, the hero now ends at 985.2 px and About starts at 1018.4 px: a 33.2 px separation. Cards occupy two rows rather than three at this width, and the decoration scales to approximately 371 px rather than a fixed 416 px. A screenshot from the real tab is saved as `actual-about-after.png`; it shows the search controls and About content in separate layout areas.

The original tab was moved to the no-cache preview on port 8766. The original port 8765 also serves the updated versioned HTML, so its routes remain usable.

## Checks actually run

- `node navigation-check.cjs verify` with `CHECK_OUTPUT=layout-verification`: all four pages at 320, 360, 390, 430, 768, 1024, 1280 and 1440 px; 32 page/width combinations at both 900 px and 600 px heights. Passed overflow, clipping, section/header intersection, hamburger, ARIA, keyboard, short dropdown, real link destinations and account navigation checks. Breakpoint/focus transitions passed for each header.
- `node navigation-check.cjs verify --gutter --layout-only`: all four pages at 901, 1023, 1100, 1101, 1159, 1176, 1399, 1400 and 1401 px, with 15 px reserved from normal flow. All 36 page/width combinations passed at both window heights. This is a layout stress model; native classic-scrollbar behavior was independently checked in the actual in-app browser.
- `node responsive-check.cjs verify --online` at 320, 768, 1159 and 1440 px: 16 page/width combinations passed category rendering, favorites, keyboard hero selection, review reveal, menu pagination, login/register switching, required-field validation and live map zoom checks. No JavaScript page errors were introduced.
- `node check-asset-versions.cjs`: all 15 local CSS/JavaScript URLs match their content hashes.
- Application JavaScript parsed successfully with Node; `serve.py` parsed successfully with Python's AST parser.
- The running preview returned HTTP 200 with the expected no-store cache header and current stylesheet version.

Results and screenshots are in `../layout-verification`. No build, lint or type-check configuration is supplied, so those commands are unavailable rather than reported as passed. Browser checks used Microsoft Edge/Chromium and the actual in-app browser, not physical iOS or Android devices. Existing frontend-only actions still require their original backend implementation.

## Starting future previews

From the restaurant directory:

```
node scripts/version-assets.cjs
python serve.py --port 8766
```

Use an available Python interpreter if `python` is not on PATH. For static deployment, rerun the asset-version command after editing CSS or JavaScript, then deploy the HTML and referenced assets together.
