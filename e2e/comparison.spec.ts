import { test, expect } from '@playwright/test';

test('searching vs. waiting: row-1 eligible count equals the Site Finder total; popovers open; overrides halve the multiplier', async ({ page }) => {
  await page.goto('/sites');
  const live = await page.locator('[data-testid=total-eligible] [data-value]').getAttribute('data-value');
  expect(Number(live)).toBeGreaterThan(0);

  await page.goto('/judges');
  const section = page.getByTestId('judges-comparison');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByTestId('cmp-eligible')).toHaveAttribute('data-value', String(live));

  const rows = section.getByTestId('cmp-row');
  await expect(rows).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const n = await rows.nth(i).getByTestId('info-popover-button').count();
    expect(n).toBeGreaterThanOrEqual(2);
  }
  await rows.nth(0).getByTestId('info-popover-button').first().click();
  await expect(page.getByTestId('info-popover')).toBeVisible();
  await expect(page.getByTestId('info-popover')).toContainText(/calculated|calcula/i);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('info-popover')).toHaveCount(0);

  const mult = section.getByTestId('cmp-multiplier').first();
  const before = Number(await mult.getAttribute('data-value'));
  await section.getByTestId('edit-assumptions').click();
  const panel = page.getByTestId('assumptions-panel');
  await expect(panel).toBeVisible();
  await panel.getByTestId('input-cityOffers').fill('2');
  await expect(section.getByTestId('cmp-multiplier').first()).toHaveAttribute('data-value', String(before / 2));
  await panel.getByTestId('reset-assumptions').click();
  await expect(section.getByTestId('cmp-multiplier').first()).toHaveAttribute('data-value', String(before));
});
