import { test, expect } from '@playwright/test';

test('lot scan: a sample aerial produces polygons; dragging a vertex changes the area', async ({ page }) => {
  await page.goto('/scan');
  await page.getByTestId('scan-page').waitFor({ state: 'attached' });
  const sample = page.locator('[data-testid^="sample-"]').first();
  await sample.click();
  const scanBtn = page.getByRole('button', { name: /Scan lot|Escanear lote/i });
  await expect(scanBtn).toBeVisible({ timeout: 10_000 });
  await scanBtn.click();
  const polys = page.locator('[data-polygon]');
  await expect(polys.first()).toBeVisible({ timeout: 20_000 });
  const buildable = page.locator('[data-testid=scan-buildable]');
  const before = await buildable.getAttribute('data-value');
  const handle = page.locator('[data-vertex="open"], [data-vertex="parking"]').first();
  await handle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await buildable.getAttribute('data-value');
  expect(after).not.toBe(before);
});

test('pitch kit: Spanish letter renders; practice mode completes four turns and shows feedback', async ({ page }) => {
  await page.goto('/pitch/oakfield-community-church');
  await page.getByTestId('draft-letter').click();
  await expect(page.locator('[data-testid=letter-text]')).toContainText(/Estimad|Querid|comunidad|Habitat/i, { timeout: 20_000 });
  await page.getByRole('radio', { name: /Practice|Práctica/ }).click();
  await page.getByTestId('start-practice').click();
  for (let i = 0; i < 4; i++) {
    await expect(page.getByTestId('practice-input')).toBeEnabled({ timeout: 15_000 });
    await page.getByTestId('practice-input').fill(`Answer ${i + 1}: we keep the sanctuary and ${60} spaces, and the congregation keeps control of the land.`);
    await page.getByTestId('practice-send').click();
    await page.waitForTimeout(600);
  }
  await expect(page.getByTestId('practice-feedback')).toBeVisible({ timeout: 20_000 });
});
