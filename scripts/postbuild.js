import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const distAssetsDir = path.join(distDir, 'assets');
const rootAssetsDir = path.resolve('assets');
const rootIndex = path.resolve('index.html');
const root404 = path.resolve('404.html');
const distIndex = path.join(distDir, 'index.html');

// 1. Ensure root assets directory exists & clean old assets
if (fs.existsSync(rootAssetsDir)) {
  const existingAssets = fs.readdirSync(rootAssetsDir);
  for (const f of existingAssets) {
    fs.unlinkSync(path.join(rootAssetsDir, f));
  }
} else {
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

// 4. Copy static public files to dist if missing
const publicDir = path.resolve('public');
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log('[postbuild] Synced all public files to dist');
}
