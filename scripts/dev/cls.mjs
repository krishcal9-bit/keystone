import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 823 } });
await page.addInitScript(() => {
  window.__cls = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) window.__cls.push({ v: e.value, t: Math.round(e.startTime), src: e.sources?.map((s) => s.node ? (s.node.tagName + '.' + (s.node.className?.baseVal ?? s.node.className ?? '').toString().slice(0, 40) + '#' + (s.node.id || '')) : '?') }); } }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto('http://localhost:3300/', { waitUntil: 'networkidle' });
await page.waitForTimeout(9000);
console.log(JSON.stringify(await page.evaluate(() => window.__cls), null, 1));
await browser.close();
