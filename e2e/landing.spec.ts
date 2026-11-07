import { test, expect } from '@playwright/test';
import { gotoSkipIntro, consoleErrors } from './helpers';

test.describe('landing', () => {
  test('intro plays then hero is interactive; skipping works', async ({ page }) => {
    const errs = consoleErrors(page);
    await page.goto('/');
    await expect(page.getByTestId('intro')).toBeVisible();
    await page.waitForTimeout(600);
    await page.mouse.click(700, 450);
    await expect(page.getByTestId('landing')).toHaveAttribute('data-intro-done', 'true', { timeout: 5_000 });
    await expect(page.getByTestId('cta-find')).toBeVisible();
    await page.getByTestId('cta-find').hover();
    expect(errs).toEqual([]);
  });

  test('intro finishes on its own', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing')).toHaveAttribute('data-intro-done', 'true', { timeout: 12_000 });
  });

  test('two hero CTAs have identical bounding boxes', async ({ page }) => {
    await gotoSkipIntro(page);
    const a = await page.getByTestId('cta-find').boundingBox();
    const b = await page.getByTestId('cta-how').boundingBox();
    expect(a && b).toBeTruthy();
    expect(Math.abs(a!.width - b!.width)).toBeLessThan(1);
    expect(Math.abs(a!.height - b!.height)).toBeLessThan(1);
  });

  test('Down arrow visits every section with no blank frames; header stays on top', async ({ page }) => {
    await gotoSkipIntro(page);
    const count = await page.locator('[data-section]').count();
    expect(count).toBeGreaterThanOrEqual(11);
    for (let i = 1; i < count; i++) {
      // a press during an auto-play sequence completes it; the next press moves on
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(1000);
        if ((await page.locator(`[data-section="${i}"]`).getAttribute('data-active')) === 'true') break;
      }
      await page.waitForTimeout(300);
      const header = await page.getByTestId('header').boundingBox();
      expect(header!.y).toBe(0);
      // the arriving scene is painted: a screenshot of the viewport is never a flat frame
      const shot = await page.screenshot({ clip: { x: 0, y: 64, width: 1440, height: 836 } });
      expect(shot.byteLength).toBeGreaterThan(20_000);
      await expect(page.locator(`[data-section="${i}"]`)).toHaveAttribute('data-active', 'true', { timeout: 5_000 });
      await expect(page.locator(`[data-section="${i}"] svg, [data-section="${i}"] canvas`).first()).toBeVisible();
      await page.waitForTimeout(400);
    }
  });

  test('auto-play section ends with labels visible; Down mid-sequence completes it', async ({ page }) => {
    await gotoSkipIntro(page);
    await page.keyboard.press('ArrowDown'); // section 1 explainer starts
    await expect(page.locator('[data-section="1"]')).toHaveAttribute('data-phase', 'playing', { timeout: 15_000 });
    await page.waitForTimeout(600);
    await page.keyboard.press('ArrowDown'); // mid-sequence: completes instead of moving on
    await page.waitForTimeout(600);
    await expect(page.locator('[data-section="1"]')).toHaveAttribute('data-active', 'true');
    await expect(page.locator('[data-section="1"] [data-testid="replay-1"], [data-section="1"] [data-testid^="replay"]').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('[data-section="1"] h2')).toBeVisible();
    await page.keyboard.press('ArrowDown'); // now moves on
    await expect(page.locator('[data-section="2"]')).toHaveAttribute('data-active', 'true', { timeout: 5_000 });
  });

  test('challenge section cost bar ends with a smaller gap than it started', async ({ page }) => {
    await gotoSkipIntro(page);
    const gap = page.getByTestId('challenge-gap').first();
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(12_000);
    const start = Number(await gap.getAttribute('data-gap-start'));
    const end = Number(await gap.getAttribute('data-gap-end'));
    expect(end).toBeLessThan(start);
  });
});
