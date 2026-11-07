// Captures every page and landing section at three viewports in light and dark into docs/screenshots.
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.env.BASE || 'http://localhost:3200';
const out = 'docs/screenshots';
fs.mkdirSync(out, { recursive: true });
const sizes = [[1440, 900], [1024, 768], [390, 844]];
const pages = [['sites', '/sites'], ['site', '/sites/oakfield-community-church'], ['scan', '/scan'], ['plan', '/plan/oakfield-community-church'], ['pitch', '/pitch/oakfield-community-church'], ['pipeline', '/pipeline'], ['ask', '/ask'], ['judges', '/judges'], ['404', '/nope']];
const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    const page = await ctx.newPage();
    await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
    // landing sections
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); await page.keyboard.press('Escape'); if ((await page.getAttribute('[data-testid=landing]', 'data-intro-done')) === 'true') break; }
    const n = await page.locator('[data-section]').count();
    for (let i = 0; i < n; i++) {
      if (i) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(900); if ((await page.locator(`[data-section="${i}"]`).getAttribute('data-active')) !== 'true') await page.keyboard.press('ArrowDown'); }
      await page.waitForTimeout(i ? 7000 : 2500);
      await page.screenshot({ path: `${out}/landing-${i}-${w}x${h}-${theme}.png` });
    }
    for (const [name, path] of pages) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(name === 'plan' ? 6000 : 2500);
      await page.screenshot({ path: `${out}/${name}-${w}x${h}-${theme}.png` });
    }
    await ctx.close();
  }
}
await browser.close();
console.log('done');
