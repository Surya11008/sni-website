import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const distAssetsDir = path.join(distDir, 'assets');
const rootAssetsDir = path.resolve('assets');
const rootIndex = path.resolve('index.html');
const root404 = path.resolve('404.html');
const distIndex = path.join(distDir, 'index.html');

// 1. Ensure root assets directory exists
if (!fs.existsSync(rootAssetsDir)) {
  fs.mkdirSync(rootAssetsDir, { recursive: true });
}

// 2. Copy dist/assets/* to root assets/
if (fs.existsSync(distAssetsDir)) {
  const files = fs.readdirSync(distAssetsDir);
  for (const file of files) {
    fs.copyFileSync(path.join(distAssetsDir, file), path.join(rootAssetsDir, file));
    console.log(`[postbuild] Synced dist/assets/${file} -> assets/${file}`);
  }
}

// 3. Copy dist/index.html to root index.html and 404.html
if (fs.existsSync(distIndex)) {
  const htmlContent = fs.readFileSync(distIndex, 'utf8');
  fs.writeFileSync(rootIndex, htmlContent, 'utf8');
  fs.writeFileSync(root404, htmlContent, 'utf8');
  console.log('[postbuild] Synced dist/index.html -> index.html & 404.html');
}
