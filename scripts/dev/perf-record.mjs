// Records 4x-throttled interactions to e2e-videos/*.webm and prints frame stats.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:3300';
const browser = await chromium.launch();
async function run(name, url, act) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: 'e2e-videos/tmp', size: { width: 1440, height: 900 } } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => { window.__frames = []; let last = performance.now(); const tick = (t) => { window.__frames.push(t - last); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await act(page);
  const f = await page.evaluate(() => { const f = window.__frames.slice(10); const dropped = f.filter((d) => d > 34).length; return { frames: f.length, dropped, p95: Math.round([...f].sort((a, b) => a - b)[Math.floor(f.length * 0.95)]) }; });
  const v = page.video(); await ctx.close(); const p = await v.path();
  const fs = await import('node:fs'); fs.renameSync(p, `e2e-videos/${name}-4x.webm`);
  console.log(name, JSON.stringify(f));
}
await run('sites-load', base + '/sites', async (p) => { await p.waitForTimeout(5000); });
await run('parking-slider', base + '/sites/oakfield-community-church', async (p) => { const s = p.getByTestId('keep-slider'); await s.scrollIntoViewIfNeeded(); await s.focus(); for (let i = 0; i < 40; i++) { await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(40); } await p.waitForTimeout(800); });
await run('plan-build', base + '/plan/oakfield-community-church?gl=force', async (p) => { await p.waitForTimeout(7000); await p.getByRole('radio', { name: 'Stacked flats' }).click(); await p.getByTestId('generate').click(); await p.waitForTimeout(7000); });
await browser.close();
