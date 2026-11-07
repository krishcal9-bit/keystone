import { chromium } from 'playwright';
const [,, url='http://localhost:3300/'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 823 } });
await page.addInitScript(() => {
  window.__lcp = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? e.element.tagName + '.' + String(e.element.className?.baseVal ?? e.element.className ?? '').slice(0, 40) + ' :: ' + (e.element.textContent || '').slice(0, 40) : '?' }); }).observe({ type: 'largest-contentful-paint', buffered: true });
  window.__paint = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__paint.push(e.name + '@' + Math.round(e.startTime)); }).observe({ type: 'paint', buffered: true });
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
console.log(JSON.stringify(await page.evaluate(() => ({ lcp: window.__lcp, paint: window.__paint })), null, 1));
await browser.close();
