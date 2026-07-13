const fs = require('fs');
const lcov = fs.readFileSync('coverage/frontend-galenos-pro/lcov.info', 'utf8');
const files = {};
let cur = null;
for (const line of lcov.split('\n')) {
  if (line.startsWith('SF:')) {
    cur = line.slice(3).trim();
    files[cur] = { u: [], f: [] };
  } else if (line.startsWith('DA:') && cur) {
    const p = line.slice(3).split(',');
    if (p[1] === '0') files[cur].u.push(p[0]);
  } else if (line.startsWith('FNDA:') && cur) {
    const idx = line.indexOf(',', 5);
    const cnt = line.slice(5, idx);
    const name = line.slice(idx + 1).trim();
    if (cnt === '0') files[cur].f.push(name);
  }
}
for (const [f, d] of Object.entries(files)) {
  if (d.u.length > 0 || d.f.length > 0) {
    const s = f.replace(/.*src[\/\\]app[\/\\]/, '');
    console.log(s + ': lines=[' + d.u.join(',') + '] uncovFns=' + d.f.length);
  }
}
