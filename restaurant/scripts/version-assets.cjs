const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const file = path.join(root, name);
  const original = fs.readFileSync(file, 'utf8');
  const updated = original.replace(/((?:href|src)=["'])([^"'?#]+\.(?:css|js))(?:\?[^"']*)?(["'])/g, (match, prefix, url, quote) => {
    if (/^(?:[a-z]+:|\/\/)/i.test(url)) return match;
    const asset = path.resolve(root, url);
    if (!asset.startsWith(root + path.sep) || !fs.existsSync(asset)) return match;
    const version = crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0, 12);
    return `${prefix}${url}?v=${version}${quote}`;
  });
  if (updated !== original) fs.writeFileSync(file, updated);
  console.log(`${name}: asset versions synchronized`);
}
