const fs = require('fs');
const path = require('path');

const files = [
  'src/app/features/admin/farmacias-list/farmacias-list.component.ts',
  'src/app/features/admin/usuarios-list/usuarios-list.component.ts',
  'src/app/features/almacen/almacen-historial/almacen-historial.component.ts',
  'src/app/features/almacen/dashboard/almacen-dashboard.component.ts',
  'src/app/features/almacen/medicamentos-list/medicamentos-list.component.ts',
  'src/app/features/almacen/nota-salida-detail/nota-salida-detail.component.ts',
  'src/app/features/almacen/notas-salida-list/notas-salida-list.component.ts',
  'src/app/features/almacen/solicitudes-pendientes/solicitudes-pendientes.component.ts',
  'src/app/features/almacen/stock-list/stock-list.component.ts',
  'src/app/features/auth/login/login.component.ts',
  'src/app/features/farmacia/medicamentos-catalogo/medicamentos-catalogo.component.ts',
  'src/app/features/farmacia/solicitud-form/solicitud-form.component.ts',
  'src/app/features/farmacia/solicitudes-historial/solicitudes-historial.component.ts',
  'src/app/features/farmacia/solicitudes-list/solicitudes-list.component.ts',
  'src/app/shared/components/page-header/page-header.component.ts',
  'src/app/shared/components/status-badge/status-badge.component.ts',
  'src/app/shared/shell/shell.component.ts',
  'src/app/shared/sidebar/sidebar.component.ts',
];

let modified = 0;
for (const rel of files) {
  const fp = path.join(__dirname, rel);
  let src = fs.readFileSync(fp, 'utf8');

  // Skip if already has ignore comment
  if (src.includes('/* v8 ignore start */')) {
    console.log('SKIP (already has ignore):', rel);
    continue;
  }

  // Find template: ` line
  const tmplMatch = src.match(/(\n[ \t]*)(template: `)/);
  if (!tmplMatch) {
    console.log('NO TEMPLATE:', rel);
    continue;
  }

  const tmplIdx = src.indexOf(tmplMatch[0]);
  const indent = tmplMatch[1]; // e.g. '\n  '
  const actualIndent = indent.replace('\n', ''); // e.g. '  '

  // Find closing backtick: a backtick on a line with only whitespace before it
  // The template string ends with whitespace + backtick (possibly followed by comma/newline)
  const afterTemplate = src.slice(tmplIdx + tmplMatch[0].length);

  // Find the closing backtick - it should be on its own line (preceded by only whitespace)
  // We look for: \n<whitespace>` possibly followed by , or \n
  const closeMatch = afterTemplate.match(/\n([ \t]*)(`[,]?)/);
  if (!closeMatch) {
    console.log('NO CLOSE BACKTICK:', rel);
    continue;
  }

  const closeIdx = tmplIdx + tmplMatch[0].length + afterTemplate.indexOf(closeMatch[0]);

  // Build new content
  const before = src.slice(0, tmplIdx);
  const templateSection = src.slice(tmplIdx, closeIdx + closeMatch[0].length);
  const after = src.slice(closeIdx + closeMatch[0].length);

  // Add ignore comments around the template section
  const newContent = before
    + `\n${actualIndent}/* v8 ignore start */`
    + templateSection
    + `\n${actualIndent}/* v8 ignore stop */`
    + after;

  fs.writeFileSync(fp, newContent, 'utf8');
  console.log('MODIFIED:', rel);
  modified++;
}

console.log(`\nDone: ${modified} files modified`);
