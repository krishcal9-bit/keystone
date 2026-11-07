/**
 * Rasterises the map detail layer (public/art/map-detail-*.svg, from `npm run gen:art`) to WebP so the browser
 * never has to paint ~1,000 vector paths at runtime: OCMap blits the bitmap onto a canvas. Needs the bundled
 * Playwright Chromium, so it runs by hand (`npm run gen:raster`) and the output is committed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const SIZE = 1400; // DETAIL_BOX.size, map units
const PPU = 2; // device pixels per map unit
const PX = SIZE * PPU;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 200, height: 200 } });
for (const theme of ['day', 'night']) {
  const svg = readFileSync(`public/art/map-detail-${theme}.svg`, 'utf8');
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const webp = await page.evaluate(async ({ dataUrl, PX }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = PX; c.height = PX;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, PX, PX);
    return c.toDataURL('image/webp', 0.9);
  }, { dataUrl, PX });
  const buf = Buffer.from(webp.split(',')[1], 'base64');
  writeFileSync(`public/art/map-detail-${theme}.webp`, buf);
  console.log(`map-detail-${theme}.webp ${PX}px ${(buf.length / 1024).toFixed(0)} KB`);
}
await browser.close();
