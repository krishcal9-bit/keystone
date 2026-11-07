import { test, expect } from '@playwright/test';

test('site finder: filtering to eligible updates totals; clicking a marker opens Site Detail', async ({ page }) => {
  await page.goto('/sites');
  const total = page.locator('[data-testid=total-sites] [data-value]');
  await expect(total).toHaveAttribute('data-value', '60');
  await page.getByTestId('filter-eligible').click();
  await expect(page.locator('[data-testid=total-sites] [data-value]')).toHaveAttribute('data-value', '48');
  const marker = page.locator('[data-marker="oakfield-community-church"]');
  await marker.scrollIntoViewIfNeeded();
  await marker.click({ force: true });
  await page.waitForURL(/\/sites\/oakfield-community-church/);
  await expect(page.getByTestId('eligibility')).toBeVisible();
});

test('site detail: parking slider changes units; brief renders (mocked)', async ({ page }) => {
  await page.goto('/sites/oakfield-community-church');
  const homes = page.locator('[data-testid=homes] [data-value]');
  await expect(homes).toHaveAttribute('data-value', /\d+/);
  const before = Number(await homes.getAttribute('data-value'));
  const slider = page.getByTestId('keep-slider');
  await slider.focus();
  for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowLeft');
  const after = Number(await homes.getAttribute('data-value'));
  expect(after).toBeGreaterThan(before);
  await expect(page.getByTestId('delta-pill')).toBeVisible();
  await expect(page.getByTestId('brief')).toContainText('Summary', { timeout: 20_000 });
  await expect(page.getByTestId('gap-panel')).toBeVisible();
  await expect(page.getByTestId('time-to-keys')).toBeVisible();
  await expect(page.getByTestId('city-rules')).toBeVisible();
});

test('plan studio: generate produces units that meet or explain the SB 4 minimum; before/after toggles', async ({ page }) => {
  await page.goto('/plan/oakfield-community-church');
  await expect(page.getByTestId('plan-status')).toContainText(/SB 4 minimum/);
  const status = await page.getByTestId('plan-status').textContent();
  expect(status).toMatch(/Meets the SB 4 minimum density|short of the SB 4 minimum/);
  await page.getByRole('radio', { name: 'Stacked flats' }).click();
  await page.getByTestId('generate').click();
  await page.waitForTimeout(1500);
  await page.getByRole('radio', { name: 'Today' }).click();
  await expect(page.getByRole('radio', { name: 'Today' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Plan' }).click();
  await expect(page.getByRole('radio', { name: 'Plan' })).toHaveAttribute('aria-checked', 'true');
});

test('pipeline: changing a stage updates totals and persists across reload', async ({ page }) => {
  await page.goto('/pipeline');
  const firstSelect = page.locator('select').first();
  await expect(firstSelect).toBeVisible();
  await firstSelect.selectOption('meeting');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.locator('select').first()).toBeVisible();
  const values = await page.locator('select').evaluateAll((els) => els.map((e) => (e as HTMLSelectElement).value));
  expect(values).toContain('meeting');
});

test('theme: dark mode applies before paint; street lamps are on', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('keystone:v1:theme', 'dark'); } catch {} });
  await page.goto('/sites');
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('landing')).toHaveAttribute('data-intro-done', 'true', { timeout: 10_000 });
  const lamps = page.locator('[data-section="0"] [data-lamp]');
  expect(await lamps.count()).toBeGreaterThanOrEqual(3);
  await expect(lamps.first()).toHaveAttribute('data-on', 'true');
});

test('lane pill is visible on every route; judges page see-it links open the right screens', async ({ page }) => {
  for (const r of ['/sites', '/sites/oakfield-community-church', '/scan', '/plan/oakfield-community-church', '/pitch/oakfield-community-church', '/pipeline', '/ask', '/judges']) {
    await page.goto(r);
    await expect(page.getByTestId('lane-pill')).toBeVisible();
    if (r !== '/judges') await expect(page.getByTestId('lane-line').first()).toContainText('Find it');
  }
  await page.goto('/judges');
  const links = page.getByTestId('see-it');
  const n = await links.count();
  expect(n).toBeGreaterThanOrEqual(8);
  for (let i = 0; i < n; i++) {
    await page.goto('/judges');
    const link = page.getByTestId('see-it').nth(i);
    const target = (await link.getAttribute('data-target'))!;
    await link.click();
    await page.waitForURL((u) => u.pathname + u.search + u.hash === target || u.pathname === target.split(/[?#]/)[0], { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe(target.split(/[?#]/)[0]);
  }
});
