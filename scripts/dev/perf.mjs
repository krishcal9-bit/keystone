// Long-task + frame profiler at 4x CPU throttle: node scripts/dev/perf.mjs <url> <scenario>
import { chromium } from 'playwright';
const [,, url, scenario='load'] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.addInitScript(() => {
  window.__lt = []; window.__frames = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration), n: e.attribution?.[0]?.containerName || e.attribution?.[0]?.name || '' }); }).observe({ type: 'longtask', buffered: true });
  let last = performance.now();
  const tick = (t) => { window.__frames.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  window.__mark = (name) => window.__lt.push({ t: Math.round(performance.now()), d: 0, n: 'MARK ' + name });
});
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
if (scenario === 'intro') { await page.waitForTimeout(7000); }
if (scenario === 'sections') {
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(300); await page.keyboard.press('Escape'); if ((await page.getAttribute('[data-testid=landing]', 'data-intro-done')) === 'true') break; }
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__mark('walk'));
  for (let i = 1; i <= 4; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(1500); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(2500); }
}
if (scenario === 'slider') {
  const s = page.getByTestId('keep-slider'); await s.scrollIntoViewIfNeeded(); await s.focus();
  await page.evaluate(() => window.__mark('drag'));
  for (let i = 0; i < 40; i++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(40); }
  await page.waitForTimeout(800);
}
if (scenario === 'filters') {
  await page.evaluate(() => window.__mark('filter'));
  await page.getByTestId('filter-eligible').click(); await page.waitForTimeout(800);
  await page.getByTestId('filter-transit').click(); await page.waitForTimeout(800);
  const m = page.locator('[data-marker]').nth(5); await m.hover(); await page.waitForTimeout(500);
}
if (scenario === 'plan') {
  await page.waitForTimeout(6000);
  await page.evaluate(() => window.__mark('generate'));
  await page.getByRole('radio', { name: 'Stacked flats' }).click();
  await page.getByTestId('generate').click(); await page.waitForTimeout(6000);
  await page.evaluate(() => window.__mark('sun'));
  const s = page.getByTestId('sun-slider'); await s.focus(); for (let i = 0; i < 20; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(40); }
  await page.waitForTimeout(800);
}
const r = await page.evaluate(() => { const f = window.__frames.slice(10); const dropped = f.filter((d) => d > 34).length; const worst = Math.max(...f); return { longTasks: window.__lt.filter((x) => x.d > 50 || x.n.startsWith('MARK')), frames: f.length, dropped, worstFrame: Math.round(worst), p95: Math.round(f.sort((a, b) => a - b)[Math.floor(f.length * 0.95)]) }; });
console.log(JSON.stringify(r, null, 0));
await browser.close();
