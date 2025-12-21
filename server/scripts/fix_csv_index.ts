/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, 'movies.csv');
const encoding = 'utf8';

function fixIndex() {
  const raw = fs.readFileSync(filePath, encoding);
  // handle both CRLF and LF
  const lines = raw.split(/\r?\n/);
  if (lines.length === 0) return;

  const header = lines[0];
  const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);

  const fixed = dataLines.map((line, idx) => {
    // Replace the leading index (before first comma) with (idx+1)
    const parts = line.split(',');
    parts[0] = String(idx + 1);
    return parts.join(',');
  });

  const out = [header, ...fixed].join('\n') + '\n';
  fs.writeFileSync(filePath, out, encoding);
  console.log(`Renumbered ${fixed.length} rows in ${filePath}`);
}

fixIndex();
