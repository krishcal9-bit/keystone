import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3200/', { waitUntil: 'networkidle' });
for (let i = 0; i < 10; i++) { await page.waitForTimeout(400); await page.keyboard.press('Escape'); if ((await page.getAttribute('[data-testid=landing]', 'data-intro-done')) === 'true') break; }
const state = async () => { const s = await page.locator('[data-section][data-active="true"]').getAttribute('data-section'); const r = await page.locator('[data-testid^=replay-]').count(); return `active=${s} replays=${r}`; };
for (let i = 1; i <= 8; i++) {
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(900);
  let st = await state(); console.log(`press1 -> ${st}`);
  if (!st.includes(`active=${i} `)) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(1200); console.log(`press2 -> ${await state()}`); }
}
await browser.close();
