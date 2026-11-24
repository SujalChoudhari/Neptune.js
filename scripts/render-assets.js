import { chromium } from 'playwright';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  const assetsDir = '/root/Neptune.js/examples/emberfall/assets';
  const files = await readdir(assetsDir);
  const svgFiles = files.filter(f => f.endsWith('.svg'));
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  for (const file of svgFiles) {
    const svgPath = join(assetsDir, file);
    const pngPath = join(assetsDir, file.replace(/\.svg$/, '.png'));
    const svgContent = await readFile(svgPath, 'utf8');
    
    // Extract viewBox width and height if present
    const match = svgContent.match(/viewBox=["']\s*0\s+0\s+(\d+)\s+(\d+)\s*["']/);
    const w = match ? parseInt(match[1], 10) * 2 : 256;
    const h = match ? parseInt(match[2], 10) * 2 : 256;
    
    await page.setViewportSize({ width: Math.max(128, w), height: Math.max(128, h) });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;">${svgContent}</body></html>`);
    
    const svgElement = await page.$('svg');
    if (svgElement) {
      const buffer = await svgElement.screenshot({ omitBackground: true });
      await writeFile(pngPath, buffer);
      console.log(`Rendered ${file} -> ${file.replace(/\.svg$/, '.png')} (${buffer.length} bytes)`);
    }
  }
  
  await browser.close();
  console.log('All SVGs rendered successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
