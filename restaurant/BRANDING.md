# BOM BAP 봄밥 branding

Updated the four existing HTML pages and added shared `branding.css`.

- Reused the original chef mascot in all existing logo placements.
- Added the English wordmark with a complementary Korean name to the shared header, homepage hero and footer, and authentication page.
- Updated each page title, description and Open Graph name/title/description, plus the existing contact map popup.
- Added subsetted Poppins and Noto Sans KR fonts with system Hangul fallbacks.
- Kept existing navigation, sections, images, palette, animations, forms and contact data. The mascot is compact at intermediate desktop widths to make room for the wordmark; mobile menu behavior and breakpoints are unchanged.

Validation:
- All four pages passed layout checks at 320, 768, 1024, 1101, 1159, 1280, 1440 and 1920 px, at 900 and 600 px heights: no horizontal overflow, text clipping or measured overlaps.
- Touch navigation passed at 320, 390 and 768 px; desktop/touch live breakpoint and keyboard focus checks passed.
- Existing homepage interactions, menu filtering/pagination, authentication switching and contact map checks passed at 390, 1024 and 1440 px.
- Asset content hashes match all 19 local stylesheet/script references.
- Verified the actual existing in-app preview; screenshot: `actual-brand.png`.
- The layout harness was copied to `branding-layout-check.cjs` to correct an existing false positive: the viewport-fixed contact header escapes its untransformed overflow ancestor. Original website CSS was not changed for this test issue.

This is a static HTML/CSS/JavaScript project with no package manifest or configured build command. Browser verification was used instead of claiming a build passed.
