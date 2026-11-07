import { chromium } from 'playwright';
const [,, url, expr] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
console.log(JSON.stringify(await page.evaluate(expr), null, 1));
await browser.close();
