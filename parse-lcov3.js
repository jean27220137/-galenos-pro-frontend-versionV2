const fs = require('fs');
const lcov = fs.readFileSync('coverage/frontend-galenos-pro/lcov.info', 'utf8');
let cur = null;
let inTarget = false;
const targets = ['solicitudes-list', 'usuarios-list', 'solicitudes-historial'];

for (const line of lcov.split('\n')) {
  if (line.startsWith('SF:')) {
    cur = line.slice(3).trim();
    inTarget = targets.some(t => cur.includes(t));
  }
  if (!inTarget) continue;
  if (line.startsWith('FN:')) {
    console.log('[' + cur.replace(/.*features./, '') + '] FN:', line.slice(3));
  }
  if (line.startsWith('FNDA:')) {
    const idx = line.indexOf(',', 5);
    const cnt = line.slice(5, idx);
    const name = line.slice(idx + 1).trim();
    if (cnt === '0') {
      console.log('  UNCOVERED:', name);
    }
  }
}
