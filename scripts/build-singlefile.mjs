import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

execSync('npx tsc -b && npx vite build --config vite.singlefile.config.ts', { cwd: root, stdio: 'inherit' });

const svgBase64 = readFileSync(resolve(root, 'public/day.svg')).toString('base64');
const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

const htmlPath = resolve(root, 'dist-single/index.html');
const html = readFileSync(htmlPath, 'utf8');
const marker = './day.svg';
if (!html.includes(marker)) {
  throw new Error(`Could not find "${marker}" reference in the built output — check dist-single/index.html for the current background-image URL pattern.`);
}
const inlined = html.split(marker).join(dataUri);
writeFileSync(htmlPath, inlined);

console.log(`Inlined day.svg (${(svgBase64.length / 1024 / 1024).toFixed(1)} MB base64) into dist-single/index.html`);
