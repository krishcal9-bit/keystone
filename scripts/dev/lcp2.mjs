import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const mode of ['nojs', 'reduced']) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, javaScriptEnabled: mode !== 'nojs', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  if (mode !== 'nojs') await page.addInitScript(() => { window.__lcp = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? e.element.tagName + ' :: ' + (e.element.textContent || '').slice(0, 30) : '?' }); }).observe({ type: 'largest-contentful-paint', buffered: true }); });
  await page.goto('http://localhost:3300/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  if (mode === 'nojs') { await page.screenshot({ path: '/tmp/claude-0/-home-user-keystone/9f06e92f-5831-59b5-b826-4ef1a590b76f/scratchpad/shots/nojs.png' }); console.log('nojs screenshot'); }
  else console.log(mode, JSON.stringify(await page.evaluate(() => window.__lcp)));
  await ctx.close();
}
await browser.close();
