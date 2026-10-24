const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/JUMBO CO/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const original = 'C:/Users/JUMBOC~1/AppData/Local/Temp/Rar$DRa13376.3761/restaurant';
const result = path.resolve('restaurant');
const artifacts = path.resolve('verification');
fs.mkdirSync(artifacts, { recursive: true });
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
  const root = path.resolve(parts.shift() === 'before' ? original : result);
  const file = path.join(root, ...parts);
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
  res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
const stripScripts = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
async function main() {
  for (const name of ['style.css', 'menu.css', 'contact.css', 'login.css', 'index.html']) {
    assert.deepEqual(fs.readFileSync(path.join(original, name)), fs.readFileSync(path.join(result, name)));
  }
  for (const name of ['menu', 'contact', 'login']) {
    assert.equal(stripScripts(fs.readFileSync(path.join(original, name + '.html'), 'utf8')), stripScripts(fs.readFileSync(path.join(result, name + '.html'), 'utf8')));
  }
  for (const name of fs.readdirSync(result).filter(name => name.endsWith('.js'))) {
    new (require('node:vm').Script)(fs.readFileSync(path.join(result, name), 'utf8'), { filename: name });
  }
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const checks = [];
  try {
    for (const width of [1440, 768, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      // Isolate layout comparisons from CDN availability, changing map tiles and font downloads.
      await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
      for (const name of ['index', 'menu', 'login', 'contact']) {
        const pages = await Promise.all([context.newPage(), context.newPage()]);
        const errors = [[], []];
        pages.forEach((p, i) => p.on('pageerror', e => errors[i].push(e.message)));
        await Promise.all(pages.map((p, i) => p.goto(`${base}/${i ? 'after' : 'before'}/${name}.html`)));
        async function compare(state) {
          await Promise.all(pages.map(p => p.waitForTimeout(1300)));
          // Review photos cycle every three seconds; freeze at the same original source.
          await Promise.all(pages.map(p => p.evaluate(() => document.querySelectorAll('.reviews-photo img').forEach(img => img.src = img.getAttribute('src')))));
          const shots = await Promise.all(pages.map((p, i) => p.screenshot({ fullPage: true, animations: 'disabled', path: path.join(artifacts, `${name}-${width}-${state}-${i ? 'after' : 'before'}.png`) })));
          let comparison = 'identical screenshot';
          if (!shots[1].equals(shots[0])) {
            const before = path.join(artifacts, `${name}-${width}-${state}-before.png`);
            const after = path.join(artifacts, `${name}-${width}-${state}-after.png`);
            const python = 'C:/Users/JUMBO CO/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
            const diff = require('node:child_process').spawnSync(python, ['-c', 'from PIL import Image,ImageChops; import sys; a=Image.open(sys.argv[1]); b=Image.open(sys.argv[2]); assert a.size==b.size; maximum=max(v[1] for v in ImageChops.difference(a,b).getextrema()); print(maximum); assert maximum<=4', before, after], { encoding: 'utf8' });
            comparison = diff.status === 0
              ? `within rasterization tolerance, maximum channel difference ${diff.stdout.trim()}/255`
              : `REVIEW: screenshot differs, maximum channel difference ${diff.stdout.trim()}/255`;
          }
          console.log(`${name} ${width}px ${state}: ${comparison}`);
          checks.push(`${name} ${width}px ${state}: ${comparison}`);
        }
        await compare('initial');
        if (name === 'login') {
          await Promise.all(pages.map(p => p.locator('[onclick="showRegisterForm()"]').click()));
          await compare('register');
          await Promise.all(pages.map(p => p.locator('[onclick="showLoginForm()"]').click()));
          await compare('login');
        }
        if (name === 'menu') {
          for (const category of ['salads', 'desserts', 'drinks', 'snacks', 'Meals']) {
            await Promise.all(pages.map(p => p.locator(`[data-type="${category}"]`).click()));
            await compare(category);
          }
          for (const direction of ['next', 'next', 'next', 'prev', 'prev', 'prev']) {
            await Promise.all(pages.map(p => p.locator('#' + direction).click()));
            await Promise.all(pages.map(p => p.waitForTimeout(150)));
            assert.equal(await pages[1].locator('#cards').innerHTML(), await pages[0].locator('#cards').innerHTML());
          }
          checks.push(`menu ${width}px: pagination including bounds matches`);
        }
        if (name === 'index') {
          for (const category of ['desserts', 'drinks', 'meals', 'salads']) {
            await Promise.all(pages.map(p => p.locator(`[data-category="${category}"]`).click()));
            assert.equal(await pages[1].locator('#featured-dishes-cards').innerHTML(), await pages[0].locator('#featured-dishes-cards').innerHTML());
          }
          await Promise.all(pages.map(p => p.locator('.featured-dishes-heart').first().click()));
          for (const p of pages) assert.equal(await p.locator('.featured-dishes-heart.active').count(), 1);
          await Promise.all(pages.map(p => p.locator('.card').nth(1).focus()));
          await Promise.all(pages.map(p => p.keyboard.press('Enter')));
          await Promise.all(pages.map(p => p.waitForTimeout(1200)));
          assert.equal((await pages[1].locator('#heroImage').getAttribute('src')).replace('/after/', '/before/'), await pages[0].locator('#heroImage').getAttribute('src'));
          checks.push(`index ${width}px: categories, favorite and keyboard hero selection match`);
        }
        assert.deepEqual(errors[1], errors[0], `${name}: different runtime errors`);
        if (errors[0].length) checks.push(`${name} ${width}px baseline errors retained: ${errors[0].join('; ')}`);
        await Promise.all(pages.map(p => p.close()));
      }
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
  fs.writeFileSync(path.join(artifacts, 'results.txt'), checks.join('\n') + '\n');
  console.log(checks.join('\n'));
}
main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
