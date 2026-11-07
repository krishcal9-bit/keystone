import { chromium } from 'playwright';
const [,, theme='light', out='/tmp/sec'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => { if (m.type() === 'error' || (m.type()==='warning' && !m.text().includes('ReadPixels'))) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (let i = 0; i < 7; i++) {
  if (i) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300); await page.screenshot({ path: `${out}-${i}-arrive.png` }); await page.waitForTimeout(7500); }
  await page.screenshot({ path: `${out}-${i}.png` });
}
console.log(logs.join('\n') || 'console clean');
await browser.close();
