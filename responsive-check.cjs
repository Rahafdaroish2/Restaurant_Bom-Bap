const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/JUMBO CO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const output = path.resolve(process.env.CHECK_OUTPUT || 'responsive-verification');
const baseline = path.resolve(process.env.CHECK_BASELINE || path.join(output, 'baseline'));
const site = path.resolve('restaurant');
const mode = process.argv[2] || 'audit';
const online = process.argv.includes('--online');
const touch = process.argv.includes('--touch');
const widths = process.env.CHECK_WIDTHS ? process.env.CHECK_WIDTHS.split(',').map(Number) : [320, 375, 390, 430, 600, 768, 900, 1024, 1280, 1440, 1920];
const pagesToCheck = process.env.CHECK_PAGES ? process.env.CHECK_PAGES.split(',') : ['index', 'menu', 'contact', 'login'];
const results = [];
const server = http.createServer((req, res) => {
  const parts = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).split('/').filter(Boolean);
  const root = parts.shift() === 'before' ? baseline : site;
  let file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (root === baseline && parts[0] === 'images') file = path.resolve(site, ...parts);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
async function measure(page) {
  return page.evaluate(() => {
    const visible = el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
    const rect = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; };
    const overflowing = [...document.querySelectorAll('body *')].filter(el => {
      if (!visible(el) || el.closest('#map')) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
    }).map(el => ({ selector: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className).split(' ').join('.'), ...rect(el) }));
    const clipped = [...document.querySelectorAll('h1,h2,h3,p,.card,.featured-dishes-card,.reviews-card,input,textarea,button,.circle')].filter(el => {
      if (!visible(el) || el.closest('#map')) return false;
      return el.scrollWidth > el.clientWidth + 2 && !['auto', 'scroll'].includes(getComputedStyle(el).overflowX);
    }).map(el => el.tagName + '.' + el.className);
    const header = document.querySelector('.navbar');
    const overlaps = header ? [...document.querySelectorAll('.nav-links a,.nav-actions button,.logo')].filter(visible).flatMap((el, i, all) => all.slice(i + 1).filter(other => {
      const a = el.getBoundingClientRect(), b = other.getBoundingClientRect();
      return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    }).map(other => `${el.textContent.trim()}/${other.textContent.trim()}`)) : [];
    return { viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflowing, clipped, headerOverlaps: overlaps, brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.getAttribute('src')) };
  });
}
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, isMobile: touch, hasTouch: touch, deviceScaleFactor: touch ? 2 : 1 });
    if (!online) await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    if (mode === 'desktop') {
      // Freeze only the repeating review photo swap for comparable initial states.
      await page.addInitScript(() => { window.setInterval = () => 0; });
      for (const width of [1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        for (const name of ['index', 'menu', 'contact', 'login']) {
          const snapshots = [];
          for (const version of ['before', 'after']) {
            await page.goto(`${base}/${version}/${name}.html`);
            await page.waitForTimeout(1200);
            await page.evaluate(() => document.querySelectorAll('.reviews-card').forEach(el => el.classList.add('show')));
            const file = path.join(output, `desktop-${name}-${width}-${version}.png`);
            await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
            const styles = await page.evaluate(() => Object.fromEntries(['h1', 'h2', '.navbar', '.logo', '.nav-links', '.nav-actions', '.hero', '.about-us', '.featured-dishes', '.reviews-section', 'footer', '.auth-container', '.contact-container', '.container'].flatMap(selector => {
              const el = document.querySelector(selector);
              if (!el) return [];
              const r = el.getBoundingClientRect(), s = getComputedStyle(el);
              return [[selector, { x: r.x, y: r.y, width: r.width, height: r.height, font: s.font, color: s.color, background: s.background, border: s.border, boxShadow: s.boxShadow }]];
            })));
            snapshots.push({ file, styles });
          }
          const changed = Object.keys(snapshots[0].styles).filter(key => JSON.stringify(snapshots[0].styles[key]) !== JSON.stringify(snapshots[1].styles[key]));
          const python = 'C:/Users/JUMBO CO/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
          const diff = require('node:child_process').spawnSync(python, ['-c', 'from PIL import Image,ImageChops,ImageStat; import sys,json; a=Image.open(sys.argv[1]); b=Image.open(sys.argv[2]); result={"sameSize":a.size==b.size};\nif a.size==b.size:\n d=ImageChops.difference(a,b); result.update(maximum=max(v[1] for v in d.getextrema()),mean=ImageStat.Stat(d).mean,bounds=d.getbbox())\nprint(json.dumps(result))', snapshots[0].file, snapshots[1].file], { encoding: 'utf8' });
          assert.equal(diff.status, 0, diff.stderr);
          results.push({ page: name, width, changedSections: changed, pixels: JSON.parse(diff.stdout), before: snapshots[0].styles, after: snapshots[1].styles });
          console.log(`${name} ${width}: changed sections ${changed.join(', ') || 'none'}; ${diff.stdout.trim()}`);
        }
      }
      fs.writeFileSync(path.join(output, 'desktop-comparison.json'), JSON.stringify(results, null, 2));
      return;
    }
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of pagesToCheck) {
        const errors = [];
        const onError = e => errors.push(e.message);
        page.on('pageerror', onError);
        await page.goto(`${base}/${mode === 'audit' ? 'before' : 'after'}/${name}.html`, { waitUntil: 'load' });
        await page.waitForTimeout(1100);
        const result = { page: name, width, ...await measure(page), errors };
        if (mode !== 'audit') assert.equal(result.viewport, width, JSON.stringify({ message: 'The viewport meta tag must preserve device width', result }));
        if (mode !== 'audit') {
          if (name === 'index') {
            for (const category of ['desserts', 'drinks', 'meals', 'salads']) {
              await page.locator(`[data-category="${category}"]`).click();
              assert.equal(await page.locator('.featured-dishes-card').count(), 4);
            }
            await page.locator('.featured-dishes-heart').first().click();
            assert.equal(await page.locator('.featured-dishes-heart.active').count(), 1);
            await page.locator('.card').nth(1).focus();
            await page.keyboard.press('Enter');
            await page.waitForTimeout(260);
            assert.equal(await page.locator('.card.active').count(), 1);
            assert.ok((await page.locator('#heroImage').getAttribute('src')).includes('9e68311c'));
            await page.locator('.reviews-card').last().scrollIntoViewIfNeeded();
            await page.waitForTimeout(1800);
            assert.equal(await page.locator('.reviews-card.show').count(), 4);
            await page.evaluate(() => scrollTo(0, 0));
          }
          if (name === 'menu') {
            for (const category of ['salads', 'desserts', 'drinks', 'snacks', 'Meals']) {
              await page.locator(`[data-type="${category}"]`).click();
              await page.waitForTimeout(140);
              assert.equal(await page.locator('#cards .card').count(), 3);
              await page.waitForFunction(() => [...document.images].every(img => img.complete));
              const state = await measure(page);
              assert.ok(!state.overflowing.length && !state.clipped.length, JSON.stringify({ category, width, state }));
              assert.deepEqual(state.brokenImages, [], JSON.stringify({ category, width, brokenImages: state.brokenImages }));
            }
            for (let i = 0; i < 3; i++) { await page.locator('#next').click(); await page.waitForTimeout(140); }
            assert.ok(await page.locator('#next').evaluate(el => el.classList.contains('disabled')));
            for (let i = 0; i < 3; i++) { await page.locator('#prev').click(); await page.waitForTimeout(140); }
            assert.ok(await page.locator('#prev').evaluate(el => el.classList.contains('disabled')));
          }
          if (name === 'login') {
            await page.locator('[onclick="showRegisterForm()"]').click();
            await page.waitForTimeout(550);
            const state = await measure(page);
            assert.ok(!state.overflowing.length && !state.clipped.length, JSON.stringify({ width, state }));
            if ([320, 768, 1440].includes(width)) await page.screenshot({ path: path.join(output, `${mode}-login-register-${width}.png`), fullPage: true, animations: 'disabled' });
            await page.locator('[onclick="showLoginForm()"]').click();
          }
          if (name === 'contact' || name === 'login') {
            assert.equal(await page.locator('form').first().evaluate(el => el.checkValidity()), false);
          }
          if (online && name === 'contact') {
            await page.locator('.leaflet-control-zoom-in').click();
            await page.waitForTimeout(300);
            await page.locator('.leaflet-control-zoom-out').click();
            await page.waitForTimeout(300);
          }
          if (name !== 'login') {
            assert.equal(await page.locator('.nav-links a').count(), 4);
            assert.equal(await page.locator('.nav-actions button').count(), 3);
            assert.equal(await page.locator('.nav-links a[href="./menu.html"],.nav-links a[href="#Menu"]').count(), 1);
          }
          assert.ok(result.scrollWidth <= width + 1, JSON.stringify(result));
          assert.deepEqual(result.headerOverlaps, [], JSON.stringify(result));
          assert.deepEqual(result.overflowing, [], JSON.stringify(result));
          assert.deepEqual(result.clipped, [], JSON.stringify(result));
          assert.deepEqual(errors.filter(e => !(!online && name === 'contact' && e === 'L is not defined')), [], JSON.stringify(errors));
          result.interactions = 'passed';
        }
        if (online || [320, 768, 1440].includes(width)) {
          await page.evaluate(() => { document.querySelectorAll('.reviews-card').forEach(el => el.classList.add('show')); document.querySelectorAll('.reviews-photo img').forEach(el => el.removeAttribute('data-alt')); });
          await page.screenshot({ path: path.join(output, `${mode}${online ? '-online' : ''}${touch ? '-touch' : ''}-${name}-${width}.png`), fullPage: true, animations: 'disabled' });
        }
        if (mode === 'verify' && width === 390) {
          for (const resizedWidth of [901, 600, 1100, 1101, 1400, 1401, 375, 390]) {
            await page.setViewportSize({ width: resizedWidth, height: 900 });
            await page.evaluate(() => scrollTo(0, 0));
            await page.waitForTimeout(150);
            const state = await measure(page);
            assert.ok(state.scrollWidth <= resizedWidth + 1 && !state.overflowing.length && !state.clipped.length && !state.headerOverlaps.length, JSON.stringify({ name, resizedWidth, state }));
          }
          result.liveResize = 'passed at 901, 600, 1100, 1101, 1400, 1401, 375, 390';
        }
        page.off('pageerror', onError);
        results.push(result);
        fs.writeFileSync(path.join(output, `${mode}${online ? '-online' : ''}${touch ? '-touch' : ''}.json`), JSON.stringify(results, null, 2));
        console.log(`${name} ${width}: document ${result.scrollWidth}, outside ${result.overflowing.length}, clipped ${result.clipped.length}, nav overlaps ${result.headerOverlaps.length}`);
      }
    }
    await context.close();
  } finally { await browser.close(); server.close(); }
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
