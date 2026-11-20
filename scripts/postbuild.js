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

// 4. Copy static root files (logo.png, favicon, etc.) from dist to root
if (fs.existsSync(distDir)) {
  const rootFiles = fs.readdirSync(distDir);
  for (const file of rootFiles) {
    if (file !== 'assets' && file !== 'index.html') {
      const srcPath = path.join(distDir, file);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, path.resolve(file));
        console.log(`[postbuild] Synced dist/${file} -> ${file}`);
      }
    }
  }
}
