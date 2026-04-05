import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/road-fatalities';
const API_URL = 'http://localhost:8080/api/v2/road-fatalities';

async function waitForAppReady(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await expect(page.locator('[data-testid="load-initial-data"]')).toBeVisible();
  await expect(page.locator('[data-testid="toggle-create-form"]')).toBeVisible();
  await page.waitForTimeout(500);
}

test.describe('Road Fatalities - Requisitos Funcionales', () => {
  test.beforeEach(async ({ page, request }) => {
    try {
      await request.delete(API_URL);
    } catch (err) {
      console.log('Error limpiando base de datos antes del test:', err);
    }

    await waitForAppReady(page);
  });

  test.afterEach(async ({ request }) => {
    // Limpiar la base de datos después de cada test
    try {
      await request.delete(API_URL);
    } catch (err) {
      // Ignorar errores en la limpieza
      console.log('Error limpiando base de datos:', err);
    }
  });

  // REQUISITO 1: Crear recurso
  test('1. Crear un recurso', async ({ page }) => {
    await page.locator('[data-testid="toggle-create-form"]').click();
    await expect(page.locator('[data-testid="create-form"]')).toBeVisible();

    await page.locator('[data-testid="create-nation"]').fill('testnation');
    await page.locator('[data-testid="create-year"]').fill('2024');
    await page.locator('[data-testid="create-total-death"]').fill('500');
    await page.locator('[data-testid="create-income-level"]').selectOption('middle');
    await page.locator('[data-testid="create-traffic-side"]').selectOption('right');
    await page.locator('[data-testid="create-population-death-rate"]').fill('5.5');
    await page.locator('[data-testid="create-vehicle-death-rate"]').fill('10.2');
    await page.locator('[data-testid="create-distance-death-rate"]').fill('3.1');

    await page.locator('[data-testid="create-submit"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="table-row-testnation-2024"]')).toBeVisible({ timeout: 15000 });
  });

  // REQUISITO 2: Listar recursos
  test('2. Listar todos los recursos', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });
  });

  // REQUISITO 3: Borrar todos
  test('3. Borrar todos los recursos', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('[data-testid="delete-all-resources"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).not.toBeAttached();
  });

  // REQUISITO 4: Borrar concreto
  test('4. Borrar un recurso concreto', async ({ page }) => {
    await page.locator('[data-testid="toggle-create-form"]').click();
    await expect(page.locator('[data-testid="create-form"]')).toBeVisible();

    // Creamos el recurso con todos los datos
    await page.locator('[data-testid="create-nation"]').fill('deletetest');
    await page.locator('[data-testid="create-year"]').fill('2024');
    await page.locator('[data-testid="create-total-death"]').fill('100');
    await page.locator('[data-testid="create-income-level"]').selectOption('high');
    await page.locator('[data-testid="create-traffic-side"]').selectOption('left');
    await page.locator('[data-testid="create-population-death-rate"]').fill('1.0');
    await page.locator('[data-testid="create-vehicle-death-rate"]').fill('2.5');
    await page.locator('[data-testid="create-distance-death-rate"]').fill('1.2');

    await page.locator('[data-testid="create-submit"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="table-row-deletetest-2024"]')).toBeVisible({ timeout: 15000 });

    // Lo borramos usando el formulario específico
    await page.locator('[data-testid="delete-nation"]').fill('deletetest');
    await page.locator('[data-testid="delete-year"]').fill('2024');
    await page.locator('[data-testid="delete-specific-submit"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="table-row-deletetest-2024"]')).not.toBeAttached();
  });

  // REQUISITO 5: Editar en vista separada
  test('5. Editar en vista separada dinámica', async ({ page }) => {
    await page.locator('[data-testid="toggle-create-form"]').click();
    await expect(page.locator('[data-testid="create-form"]')).toBeVisible();

    // Creamos el recurso inicial con TODOS los datos
    await page.locator('[data-testid="create-nation"]').fill('edittest');
    await page.locator('[data-testid="create-year"]').fill('2024');
    await page.locator('[data-testid="create-total-death"]').fill('200');
    await page.locator('[data-testid="create-income-level"]').selectOption('low');
    await page.locator('[data-testid="create-traffic-side"]').selectOption('right');
    await page.locator('[data-testid="create-population-death-rate"]').fill('2.5');
    await page.locator('[data-testid="create-vehicle-death-rate"]').fill('4.0');
    await page.locator('[data-testid="create-distance-death-rate"]').fill('2.1');

    await page.locator('[data-testid="create-submit"]').click();

    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="edit-btn-edittest-2024"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="edit-btn-edittest-2024"]').click();
    await expect(page).toHaveURL(/.*\/road-fatalities\/edittest\/2024/);
  });

  // REQUISITO 6: Buscar por país
  test('6. Buscar por país', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="search-nation"]').fill('spain');
    await page.locator('[data-testid="search-submit"]').click();

    // Esperar a que el mensaje de éxito aparezca o a que la tabla se actualice
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 10000 });
  });

  // REQUISITO 7: Buscar por año
  test('7. Buscar por año', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="search-year"]').fill('2013');
    await page.locator('[data-testid="search-submit"]').click();

    // Esperar a que el mensaje de éxito aparezca
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 10000 });
  });

  // REQUISITO 8: Buscar por rango de años
  test('8. Buscar por rango de años', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="search-from"]').fill('2010');
    await page.locator('[data-testid="search-to"]').fill('2020');
    await page.locator('[data-testid="search-submit"]').click();

    // Esperar a que el mensaje de éxito aparezca
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 10000 });
  });

  // REQUISITO 9: Limpiar búsqueda
  test('9. Limpiar búsqueda', async ({ page }) => {
    await page.locator('[data-testid="load-initial-data"]').click();
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="search-year"]').fill('2013');
    await page.locator('[data-testid="search-submit"]').click();

    // Esperar a que la búsqueda se complete
    await expect(page.locator('[data-testid="message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="search-clear"]').click();

    // Después de limpiar, la tabla debería recargarse con todos los datos
    await expect(page.locator('[data-testid="road-fatalities-table"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="search-year"]')).toHaveValue('');
  });
});