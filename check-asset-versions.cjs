const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve('restaurant');
let checked = 0;
for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  for (const match of html.matchAll(/(?:href|src)=["']([^"'?#]+\.(?:css|js))(?:\?([^"']*))?["']/g)) {
    const [, url, query = ''] = match;
    if (/^(?:[a-z]+:|\/\/)/i.test(url)) continue;
    const asset = path.resolve(root, url);
    assert.ok(asset.startsWith(root + path.sep));
    const expected = crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0, 12);
    assert.equal(new URLSearchParams(query).get('v'), expected, `${name}: stale reference to ${url}`);
    checked++;
  }
}
console.log(`${checked} local CSS/JavaScript references match their content hashes`);
