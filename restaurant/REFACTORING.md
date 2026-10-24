# Refactoring notes

## Scope and architecture

Four standalone HTML pages, four CSS files, vanilla browser JavaScript and 130 images. No package manifest, build pipeline, existing tests, backend, API implementation or framework is supplied. The home page owns hero selection, featured dishes and rotating/revealed reviews. The menu page owns category selection and three-card pagination. Login switches two local forms. Contact initializes a Leaflet map after DOMContentLoaded.

The supplied archive was copied into this workspace before editing. The archive source remains the baseline. Styles, assets, navigation, form attributes, generated card templates and animation delays are preserved. No dependency versions were changed.

## Changes by file

- `main.js`: reuse the static hero card collection rather than querying it again on every click and for hover binding. Remove the abandoned menu dataset, unused state, five unused DOM references and uncalled `createCardHTML` helper after checking references throughout the project. The actual menu implementation lives on the menu page.
- `menu.html`, `menu.js`: move the existing inline menu implementation into a dedicated script loaded at the same position. Preserve data, card markup, pagination limits, event registration and the 100 ms render delay.
- `login.html`, `login.js`: extract the script and share the repeated class-switching operations through `setActiveAuthForm`. Preserve both global functions used by inline handlers and the order of class changes.
- `contact.html`, `contact.js`: extract map initialization without changing Leaflet load order, coordinates, tile settings, popup or initialization event.

## Validation

Run `node verify.cjs` from the parent workspace. It uses the locally bundled Playwright package and installed Microsoft Edge; it adds no application dependencies. The baseline path in that script points to the supplied temporary archive folder and must be adjusted if the archive is moved.

The harness checks JavaScript syntax, byte equality of every stylesheet and the home HTML, and equality of the other HTML pages after removing script elements. All 130 image files were also verified unchanged by SHA-256. It compares full-page PNGs for all pages at 1440, 768 and 390 pixels; also login/register states and all menu categories. Identical PNGs pass directly; nonidentical PNGs are decoded with Pillow. A maximum channel difference of 4/255 is labeled within rasterization tolerance; larger differences are recorded as REVIEW rather than silently accepted. Each comparison records whether it was exact. Interaction checks compare featured category output, favorite toggling, keyboard hero selection and pagination including bounds. Runtime errors are compared against the baseline.

Completed run: syntax, static preservation and interaction assertions passed. Of 33 screenshot pairs, 30 were byte-identical. Three require review: home at 1440 px (maximum channel difference 17/255), home at 768 px (5/255), and menu Meals at 768 px (112/255). These are retained in the results; the harness finishing successfully does not certify visual equivalence for REVIEW entries. Inspection found matching layouts in the reviewed tablet captures, but exact visual equivalence remains unproven for those three captures. Earlier repeated captures sometimes matched exactly, indicating capture variability; that observation does not establish the cause of every differing pixel.

External requests are blocked for deterministic comparisons: downloaded fonts, icon stylesheets, Leaflet and live map tiles are not covered by those screenshots. The expected `L is not defined` contact error is retained under that condition. This is a controlled offline comparison, not a claim that every online integration or interactive visual state was verified. Results and before/after PNGs are in the sibling `verification` folder.

No existing lint, type-check, test or production-build commands are available. The project uses untyped JavaScript and is served directly as static files.

## Existing issues left for separate work

- Login, social login, booking, search, basket, subscribe and several call-to-action controls have no supplied backend or business implementation. Native form submission behavior was preserved.
- Home and contact contain malformed Register anchor markup. Menu lacks a viewport meta tag. These affect existing behavior/layout and were deliberately preserved.
- The menu Meals JavaScript image string uses backslashes, which JavaScript interprets as escapes. Featured dishes read a missing `bg` field, generating a `url('undefined')` background. Correcting either could change the approved rendering.
- Rapid menu clicks may queue overlapping delayed renders; repeated scroll events can queue review reveal timers. Changing timing requires explicit behavior decisions and broader interaction verification.
- Styles contain repeated navigation rules, undefined custom properties and competing page/global rules. Consolidating them risks cascade changes; styles remain byte-for-byte intact.
- Online fonts, icons and map rendering need a connected-browser manual check. Comprehensive hover/animation-frame and form-submission visual coverage remains manual.

