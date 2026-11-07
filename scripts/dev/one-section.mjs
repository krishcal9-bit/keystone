import { chromium } from 'playwright';
const [,, idx='1', out='/tmp/s.png', theme='light', w='1440', h='900'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, colorScheme: theme });
const page = await ctx.newPage();
await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });
for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); await page.keyboard.press('Escape'); if ((await page.getAttribute('[data-testid=landing]', 'data-intro-done')) === 'true') break; }
for (let i = 1; i <= +idx; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(900); if ((await page.locator(`[data-section="${i}"]`).getAttribute('data-active')) !== 'true') await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400); }
await page.waitForTimeout(9500);
await page.screenshot({ path: out });
await browser.close();
