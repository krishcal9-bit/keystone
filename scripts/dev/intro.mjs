import { chromium } from 'playwright';
const [,, theme='light', out='/tmp/intro'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => { if (m.type() === 'error' || (m.type()==='warning' && !m.text().includes('ReadPixels'))) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' }); // warm
await page.goto('http://localhost:3100/', { waitUntil: 'domcontentloaded' });
const t0 = Date.now();
for (const at of [300, 1200, 1900, 2500, 3200, 4200, 5200, 6300, 7200]) {
  const wait = at - (Date.now() - t0); if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}-${at}.png` });
}
console.log('introDone', await page.getAttribute('[data-testid=landing]', 'data-intro-done'));
console.log(logs.join('\n') || 'console clean');
await browser.close();
