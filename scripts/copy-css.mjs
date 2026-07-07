// Copies the source stylesheet into dist/ during build.
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

mkdirSync(resolve(root, 'dist'), { recursive: true });
copyFileSync(
  resolve(root, 'src/styles/hebrew-datepicker.css'),
  resolve(root, 'dist/hebrew-datepicker.css')
);
console.log('✓ copied hebrew-datepicker.css → dist/');
