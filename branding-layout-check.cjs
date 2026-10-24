const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/JUMBO CO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const mode = process.argv[2] || 'verify';
const touch = process.argv.includes('--touch');
const gutter = process.argv.includes('--gutter');
const runSuffix = `${touch ? '-touch' : ''}${gutter ? '-gutter' : ''}`;
const output = path.resolve(process.env.CHECK_OUTPUT || 'navigation-verification');
const site = path.resolve('restaurant');
const baseline = path.join(output, 'baseline');
const widths = process.env.CHECK_WIDTHS ? process.env.CHECK_WIDTHS.split(',').map(Number) : [320, 360, 390, 430, 768, 1024, 1280, 1440];
const pages = ['index', 'menu', 'contact', 'login'];
const results = [];
const server = http.createServer((req, res) => {
  const parts = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).split('/').filter(Boolean);
  const root = parts.shift() === 'before' ? baseline : site;
  const file = path.resolve(parts[0] === 'images' ? site : root, ...parts);
  if (!(file.startsWith(site + path.sep) || file.startsWith(baseline + path.sep)) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const el of document.querySelectorAll('.navbar, .auth-container, .hero, .about-content, .featured-dishes-cards')) {
      for (const animation of el.getAnimations({ subtree: true })) if (animation.effect.getTiming().iterations !== Infinity) animation.finish();
    }
  });
  if (await page.locator('#cards').count()) {
    await page.waitForFunction(() => document.querySelectorAll('#cards .card').length === 3);
    await page.waitForFunction(() => [...document.images].every(img => img.complete));
  }
}
async function layout(page) {
  return page.evaluate(({ simulateGutter }) => {
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const box = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const availableWidth = Math.min(document.documentElement.clientWidth, document.documentElement.getBoundingClientRect().right);
    const clipped = [];
    const overflow = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!visible(el) || el.closest('#map') || el instanceof SVGElement) continue;
      const r = box(el), name = el.tagName + '.' + el.className;
      // A synthetic root margin narrows normal flow, not the browser's fixed viewport.
      const boundary = simulateGutter && getComputedStyle(el).position === 'fixed' ? document.documentElement.clientWidth : availableWidth;
      if (r.width && (r.x < -1 || r.right > boundary + 1)) overflow.push(name);
      if (!el.matches('h1,h2,h3,p,a,button,input,textarea,.card,.circle,.featured-dishes-card,.reviews-card')) continue;
      if (el.matches('input,textarea')) continue; // Scrolling text fields are intentional.
      if (el.matches('button,a')) {
        // Button shine pseudo-elements deliberately travel outside their border.
        // Measure the actual label rather than counting that decoration as text overflow.
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          if ([...range.getClientRects()].some(text => text.left < r.x - 2 || text.right > r.right + 2)) clipped.push(name + ': label');
        }
      } else if (el.scrollWidth > el.clientWidth + 2 && !['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) clipped.push(name + ': inline');
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent), p = box(parent);
        // A viewport-fixed header escapes this untransformed overflow ancestor.
        const fixedHeaderOutside = parent.matches('.contact-container') && el.closest('.navbar') && getComputedStyle(el.closest('.navbar')).position === 'fixed' && style.transform === 'none' && style.filter === 'none' && style.backdropFilter === 'none';
        if (!fixedHeaderOutside && ['hidden', 'clip'].includes(style.overflowY) && (r.y < p.y - 2 || r.bottom > p.bottom + 2)) clipped.push(name + ': block in ' + parent.className);
        parent = parent.parentElement;
      }
    }
    const overlaps = [];
    const pairs = [['.hero .left', '.about-us'], ['.hero .right', '.about-us'], ['.cards', '.about-us'], ['.search-row', '.about-us'], ['.big-circle', '.about-us'], ['.experience-card', '.right-about'], ['.overlay-circle-image', '.right-about'], ['.menu-cards .card:last-child', '.nav-buttons']];
    for (const [a, b] of pairs) {
      const one = document.querySelector(a), two = document.querySelector(b);
      if (!one || !two || !visible(one) || !visible(two)) continue;
      const x = box(one), y = box(two);
      if (Math.min(x.right, y.right) - Math.max(x.x, y.x) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.y, y.y) > 1) overlaps.push(a + ' / ' + b);
    }
    const header = document.querySelector('.navbar');
    const controls = [...document.querySelectorAll('.navbar .logo,.navbar .menu-toggle,.navbar .nav-links a,.navbar .nav-actions button')].filter(visible);
    for (let i = 0; i < controls.length; i++) for (const other of controls.slice(i + 1)) {
      const a = box(controls[i]), b = box(other);
      if (Math.min(a.right, b.right) - Math.max(a.x, b.x) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y) > 1) overlaps.push('header controls');
    }
    return { viewport: innerWidth, clientWidth: document.documentElement.clientWidth, availableWidth, scrollWidth: document.documentElement.scrollWidth, overflow, clipped, overlaps, headerHeight: header ? box(header).height : null };
  }, { simulateGutter: gutter });
}
async function assertLayout(page, label) {
  const state = await layout(page);
  assert.ok(state.scrollWidth <= state.clientWidth + 1, `${label}: document overflow ${JSON.stringify(state)}`);
  assert.deepEqual(state.overflow, [], `${label}: outside viewport`);
  assert.deepEqual(state.clipped, [], `${label}: clipped content`);
  assert.deepEqual(state.overlaps, [], `${label}: overlapping sections`);
  return state;
}
async function verifyMenu(page, width, name, base) {
  const toggle = page.locator('.menu-toggle');
  const panel = page.locator('#mobile-navigation');
  const mobile = width <= 1023;
  assert.equal(await toggle.isVisible(), mobile);
  assert.equal(await panel.isVisible(), !mobile);
  const targets = await page.locator('.nav-links a').evaluateAll(links => links.map(link => ({ text: link.textContent.trim(), href: link.getAttribute('href') })));
  const expected = fs.readFileSync(path.join(baseline, `${name}.html`), 'utf8').match(/<nav class="nav-links"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual(targets.map(link => link.href), [...expected.matchAll(/href="([^"]+)"/g)].map(match => match[1]));
  if (mobile) {
    assert.equal(await toggle.getAttribute('aria-controls'), 'mobile-navigation');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    const size = await toggle.boundingBox();
    assert.equal(size.width, 44);
    assert.equal(size.height, 44);
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.equal(await panel.isVisible(), true);
    await assertLayout(page, `${name} ${width} menu open`);
    await page.screenshot({ path: path.join(output, `${touch ? 'touch-' : ''}${name}-${width}-open.png`), fullPage: false, animations: 'disabled' });
    await toggle.click();
    assert.equal(await panel.isVisible(), false);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.nav-links a').first().evaluate(el => el === document.activeElement), true);
    const outline = await page.locator('.nav-links a').first().evaluate(el => getComputedStyle(el).outlineStyle);
    assert.notEqual(outline, 'none');
    await page.keyboard.press('Escape');
    assert.equal(await panel.isVisible(), false);
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Space');
    assert.equal(await panel.isVisible(), true);
    await page.keyboard.press('Escape');
    await toggle.click();
    await page.locator('h1,h2').first().click();
    assert.equal(await panel.isVisible(), false);

    await page.setViewportSize({ width, height: 360 });
    await toggle.click();
    const bounds = await panel.boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 360, 'Dropdown must fit a short viewport');
    await page.locator('.btn-reserve').click();
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width, height: 900 });
  }
  // Follow the real links (including same-page anchors), restoring the source each time.
  for (let i = 0; i < targets.length; i++) {
    if (mobile) await toggle.click();
    const expectedURL = new URL(targets[i].href, `${base}/after/${name}.html`).href;
    await page.locator('.nav-links a').nth(i).click();
    await page.waitForURL(expectedURL);
    await page.waitForLoadState('load');
    if (mobile && await page.locator('.menu-toggle').count()) {
      assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('#mobile-navigation').isVisible(), false);
    }
    await page.goto(`${base}/after/${name}.html`);
    await settle(page);
  }
  for (const buttonClass of ['btn-login', 'btn-Regiter']) {
    if (mobile) await toggle.click();
    await page.locator('.' + buttonClass).click();
    await page.waitForURL(`${base}/after/login.html`);
    await page.goto(`${base}/after/${name}.html`);
    await settle(page);
  }
}

async function verifyResizing(page, name, base) {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(`${base}/after/${name}.html`);
  await settle(page);
  const toggle = page.locator('.menu-toggle');
  const panel = page.locator('#mobile-navigation');
  for (const width of [1023, 1024, 1025, 1023, 900, 1100, 1101, 600, 430, 320, 1440, 390]) {
    if (await toggle.isVisible()) await toggle.click();
    await page.setViewportSize({ width, height: 700 });
    await page.waitForTimeout(80);
    const mobile = width <= 1023;
    assert.equal(await toggle.isVisible(), mobile, `${name} toggle at ${width}`);
    // An open disclosure stays open only while remaining on the mobile side.
    if (!mobile) {
      assert.equal(await panel.isVisible(), true);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    } else if (await toggle.getAttribute('aria-expanded') === 'true') {
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => scrollTo(0, 0));
    await assertLayout(page, `${name} live resize ${width}`);
  }
  await page.setViewportSize({ width: 1023, height: 700 });
  await toggle.focus();
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.nav-links a').first().evaluate(el => el === document.activeElement), true);
  await page.setViewportSize({ width: 1023, height: 700 });
  await page.waitForTimeout(80);
  assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
}
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
    const page = await context.newPage();
    if (gutter) await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.marginRight = '15px'; });
    });
    page.setDefaultTimeout(10000);
    if (mode === 'desktop-nav') {
      const comparisons = [];
      for (const width of [1024, 1280, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const name of ['index', 'menu', 'contact']) {
          const captures = [];
          for (const version of ['before', 'after']) {
            await page.goto(`${base}/${version}/${name}.html`);
            await settle(page);
            captures.push(await page.evaluate(() => [...document.querySelectorAll('.navbar,.navbar .logo,.nav-links,.nav-links a,.nav-actions,.nav-actions button')].map(el => {
              const r = el.getBoundingClientRect(), s = getComputedStyle(el);
              return { label: (el.matches('.navbar') ? 'navbar' : el.className) + ':' + (el.matches('a,button') ? el.textContent.trim() : ''), x: r.x, y: r.y, width: r.width, height: r.height, font: s.font, color: s.color, background: s.background, padding: s.padding, margin: s.margin, border: s.border, radius: s.borderRadius, shadow: s.boxShadow };
            })));
          }
          assert.deepEqual(captures[1], captures[0], `${name} ${width}: desktop navbar changed`);
          comparisons.push({ name, width, result: 'identical geometry and computed styles' });
          console.log(`${name} ${width}: desktop navbar unchanged`);
        }
      }
      fs.writeFileSync(path.join(output, 'desktop-navbar.json'), JSON.stringify(comparisons, null, 2));
      return;
    }
    for (const width of process.argv.includes('--resize-only') ? [] : widths) {
      for (const name of pages) {
        await page.setViewportSize({ width, height: 900 });
        const errors = [];
        const onError = error => errors.push(error.message);
        page.on('pageerror', onError);
        await page.goto(`${base}/${mode === 'audit' ? 'before' : 'after'}/${name}.html`);
        await settle(page);
        const state = mode === 'audit' ? await layout(page) : await assertLayout(page, `${name} ${width}`);
        await page.screenshot({ path: path.join(output, `${touch ? 'touch-' : ''}${mode}-${name}-${width}.png`), fullPage: false, animations: 'disabled' });
        if (mode !== 'audit' && name !== 'login' && !process.argv.includes('--layout-only')) await verifyMenu(page, width, name, base);
        await page.setViewportSize({ width, height: 600 });
        await settle(page);
        const short = mode === 'audit' ? await layout(page) : await assertLayout(page, `${name} ${width} short`);
        if (mode !== 'audit') assert.deepEqual(errors, [], `${name} ${width}: page errors`);
        page.off('pageerror', onError);
        results.push({ name, width, state, short, errors });
        fs.writeFileSync(path.join(output, `${mode}${runSuffix}.json`), JSON.stringify(results, null, 2));
        console.log(`${name} ${width}: ${JSON.stringify({ state, short })}`);
      }
    }
    if (mode !== 'audit') {
      for (const name of ['index', 'menu', 'contact']) {
        await verifyResizing(page, name, base);
        console.log(`${name}: live breakpoint and focus transitions passed`);
      }
      fs.writeFileSync(path.join(output, `resize${runSuffix}.json`), JSON.stringify({ pages: ['index', 'menu', 'contact'], widths: [1023, 1024, 1025, 1023, 900, 1100, 1101, 600, 430, 320, 1440, 390], focusTransitions: 'passed', result: 'passed' }, null, 2));
    }
    await context.close();
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
