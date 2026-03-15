const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const targetDir = path.resolve(rootDir, '..', 'app', 'static', 'openlens');

if (!fs.existsSync(distDir)) {
  throw new Error(`Build output not found: ${distDir}`);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(distDir, targetDir, { recursive: true });
