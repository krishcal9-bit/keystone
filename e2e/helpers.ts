import { type Page, expect } from '@playwright/test';

export async function gotoSkipIntro(page: Page, path = '/') {
  await page.goto(path);
  if (path === '/') {
    await page.getByTestId('landing').waitFor({ state: 'attached' });
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      if ((await page.getByTestId('landing').getAttribute('data-intro-done')) === 'true') break;
    }
    await expect(page.getByTestId('landing')).toHaveAttribute('data-intro-done', 'true', { timeout: 15_000 });
  }
}

export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
}

export async function setLang(page: Page, lang: 'en' | 'es') {
  await page.addInitScript((l) => { try { localStorage.setItem('keystone:v1:lang', l); } catch {} }, lang);
}

export const consoleErrors = (page: Page) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(m.text()); });
  return errs;
};
