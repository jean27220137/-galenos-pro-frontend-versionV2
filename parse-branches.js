const fs = require('fs');
const lcov = fs.readFileSync('coverage/frontend-galenos-pro/lcov.info', 'utf8');
let cur = null;
const files = {};
for (const line of lcov.split('\n')) {
  if (line.startsWith('SF:')) {
    cur = line.slice(3).trim();
  } else if (line.startsWith('BRDA:') && cur) {
    const parts = line.slice(5).split(',');
    const taken = parts[3]?.trim();
    if (taken === '0' || taken === '-') {
      if (!files[cur]) files[cur] = [];
      files[cur].push('  line ' + parts[0] + ' block ' + parts[1] + ' branch ' + parts[2]);
    }
  }
}
for (const [f, lines] of Object.entries(files)) {
  const s = f.replace(/.*src.app./, '');
  console.log('\n' + s);
  lines.forEach(l => console.log(l));
}
