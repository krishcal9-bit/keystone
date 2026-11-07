import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/sites', '/sites/oakfield-community-church', '/scan', '/plan/oakfield-community-church', '/pitch/oakfield-community-church', '/pipeline', '/ask', '/judges', '/does-not-exist'];
const ES_STRINGS = ['Sitios', 'Escanear', 'Seguimiento', 'Preguntar', 'Buscador de sitios', 'Filtros', 'Ciudad', 'Tipo de propietario', 'Solo elegibles', 'Cerca del transporte', 'Sitios mostrados', 'Elegibles', 'Viviendas posibles', 'Personas alojadas', 'Resultados', 'Mapa de calor', 'Datos de muestra', 'Ordenar', 'Puntaje de ajuste', 'Idioma de la congregación'];

test('i18n: Spanish UI has no English leakage on 20 known strings', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('keystone:v1:lang', 'es'); } catch {} });
  await page.goto('/sites');
  await page.waitForTimeout(800);
  const text = await page.locator('body').innerText();
  for (const s of ES_STRINGS) expect(text, s).toContain(s);
  for (const en of ['Site Finder', 'Filters', 'Eligible only', 'Near transit', 'Sites shown', 'Potential homes', 'People housed', 'Heat overlay']) expect(text).not.toContain(en);
});

for (const theme of ['light', 'dark'] as const) {
  test(`a11y: axe has no serious/critical violations in ${theme}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.addInitScript((t) => { try { localStorage.setItem('keystone:v1:theme', t); } catch {} }, theme);
    for (const r of ROUTES) {
      await page.goto(r);
      if (r === '/') { await page.waitForTimeout(400); await page.keyboard.press('Escape'); await page.waitForTimeout(1500); } else await page.waitForTimeout(800);
      const results = await new AxeBuilder({ page: page as never }).disableRules(['color-contrast']).analyze();
      const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(bad.map((v) => `${r}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      const contrast = await new AxeBuilder({ page: page as never }).withRules(['color-contrast']).analyze();
      const badContrast = contrast.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(badContrast.map((v) => `${r}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).slice(0, 4).join(' | ')}`)).toEqual([]);
    }
  });
}

test('resilience: console is clean across routes', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
  for (const r of ROUTES.filter((x) => x !== '/does-not-exist')) { await page.goto(r); await page.waitForTimeout(600); }
  expect(errs).toEqual([]);
});
