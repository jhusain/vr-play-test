const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });
}

function copyStatic() {
  const filesToCopy = ['index.html', 'styles.css'];
  filesToCopy.forEach((file) => {
    const src = path.join(projectRoot, file);
    const dest = path.join(distDir, file);
    fs.copyFileSync(src, dest);
  });
}

async function bundle() {
  await esbuild.build({
    entryPoints: [path.join(projectRoot, 'main.js')],
    bundle: true,
    format: 'esm',
    outfile: path.join(distDir, 'main.js'),
    sourcemap: true,
    minify: true,
    target: ['es2020'],
  });
}

async function run() {
  try {
    cleanDist();
    copyStatic();
    await bundle();
    console.log('Build complete. Output written to dist/.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

run();
